import { useEffect, useRef, useState } from 'react';
import { getPlans, getPlanDurations } from '../../services/plan.service';
import { getSubscriptionsByUser } from '../../services/subscription.service';
import { registerPlanCheckout } from '../../services/payment.service';
import { formatPriceDisplay, parsePriceInput } from '../../lib/currency';
import {
  PAY_METHODS,
  durationOptionsFor,
  findChargeFormError,
  resolvedPriceFor,
  type ChargeMonths,
} from './plan-charge';
import type { Plan, PlanDuration } from '../../types/plan';
import type { PlanCheckoutPayload } from '../../types/payment';
import type { User } from '../../types/user';

// Owns plans, the selected member's durations and current plan, the resolved
// price and the submit. Every async write compares against the member (or
// plan) it was launched for — audit finding 2 is not fixed by lifting state
// to the section, only by this guard.
export const usePlanCharge = (selectedUser: User | null) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<number | ''>('');
  const [months, setMonths] = useState<ChargeMonths>(1);
  const [durations, setDurations] = useState<PlanDuration[]>([]);
  const [amountText, setAmountText] = useState('');
  const [payMethod, setPayMethod] = useState<string>(PAY_METHODS[0].value);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Set the moment the admin picks a plan by hand. A ref, not state: the
  // subscription-default effect below reads it inside a .then() that must see
  // the LATEST value, not the one captured when the effect (re-)ran — without
  // this, choosing a plan quickly, before that fetch resolves, got silently
  // overwritten by the member's actual current plan once it landed.
  const planTouchedRef = useRef(false);

  // Every setState lives in an async callback, so the effect below only starts
  // the request instead of updating state while React renders. Plans are not
  // scoped to anything the admin can change mid-flight, so no staleness guard
  // is needed here.
  useEffect(() => {
    void getPlans()
      .then((data) => {
        setPlans(data);
        setPlansError(null);
      })
      .catch((err: unknown) => {
        setPlansError(
          err instanceof Error ? err.message : 'No se pudieron cargar los planes.',
        );
      });
  }, []);

  // Default to the member's current plan. A response that lands after the
  // admin has moved to another member must not write anything — that race is
  // what used to leave the old form stuck on a spinner forever.
  useEffect(() => {
    if (!selectedUser) return;
    let isCurrent = true;
    void getSubscriptionsByUser(selectedUser.id)
      .then((subs) => {
        if (!isCurrent || planTouchedRef.current) return;
        const active = subs.find(
          (s) => s.state?.toLowerCase() === 'activa' && !s.deleted,
        );
        setPlanId(active?.planId ?? '');
        setMonths(1);
      })
      .catch((err: unknown) => {
        if (!isCurrent || planTouchedRef.current) return;
        console.warn('Could not read the member current plan', err);
        setPlanId('');
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedUser]);

  // Durations belong to the plan, so they reload on the plan and reset the
  // term — a 6-month term left over from another plan would resolve to null.
  useEffect(() => {
    // Resets synchronously on every plan change, including planId becoming
    // empty — a 6-month term left over from another plan would otherwise
    // resolve to null once durations reload for the new plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonths(1);
    if (!planId) {
      // Resets synchronously — no request is in flight here to gate this on.
      setDurations([]);
      return;
    }
    let isCurrent = true;
    void getPlanDurations(planId)
      .then((data) => {
        if (!isCurrent) return;
        setDurations(data);
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        console.warn('Could not load the plan durations', err);
        setDurations([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [planId]);

  // Exposed to the form instead of the raw setter, so picking a plan by hand
  // marks planTouchedRef before the state update — no gap for the default
  // effect's response to slip in between the two.
  const setPlanIdTouched = (id: number | '') => {
    planTouchedRef.current = true;
    setPlanId(id);
  };

  const plan = plans.find((p) => p.id === planId) ?? null;
  const options = durationOptionsFor(plan, durations);
  const resolvedPrice = resolvedPriceFor(plan, durations, months);

  // Recomputed unconditionally, never left stale: the old form kept the
  // previous subscription's amount when the new one had no price. Satisfying
  // react-hooks/set-state-in-effect here needs a data layer, not a local
  // edit, so the warning is accepted the same way the other sites carrying
  // it are.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmountText(resolvedPrice != null ? formatPriceDisplay(resolvedPrice) : '');
  }, [resolvedPrice]);

  const submit = async (
    userId: number,
    onRegistered: () => void | Promise<void>,
  ) => {
    setFormError(null);
    setSuccess(null);

    const validationError = findChargeFormError({ planId, months, amountText });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const amount = parsePriceInput(amountText);
    setIsSaving(true);
    try {
      await registerPlanCheckout({
        userId,
        planId: Number(planId),
        months,
        amount,
        payMethod: payMethod as PlanCheckoutPayload['payMethod'],
      });
      setSuccess(
        `Cobro de $${formatPriceDisplay(amount)} registrado — ${plan?.name ?? 'plan'}, ${
          months === 1 ? '1 mes' : `${months} meses`
        }.`,
      );
      await onRegistered();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo registrar el cobro.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    plans, plansError, planId, setPlanId: setPlanIdTouched, months, setMonths,
    options, resolvedPrice, amountText, setAmountText,
    payMethod, setPayMethod, isSaving, formError, success, submit,
  };
};

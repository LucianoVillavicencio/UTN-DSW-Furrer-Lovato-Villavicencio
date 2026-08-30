import type { PlanTerm } from '../types/planTerm';
import { getApiErrorMessage } from './api-error';
import api from './api';

// Discounted multi-month terms available for a plan, shown when a member
// changes plans. Any authenticated member can read these.
export const getPlanTermsForPlan = async (
  planId: number,
): Promise<PlanTerm[]> => {
  try {
    const { data } = await api.get<PlanTerm[]>(`/plan-term/by-plan/${planId}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'No se pudieron obtener los plazos del plan.'),
      { cause: error },
    );
  }
};

import { Check, X } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import type { MembershipPlan } from "./plans.data";

interface PlanCardProps {
  plan: MembershipPlan;
}

const PlanCard = ({ plan }: PlanCardProps) => {
  return (
    <Card
      className={`relative flex h-full flex-col justify-between gap-6 p-8 ${
        plan.highlight
          ? "border border-primary bg-bg-secondary shadow-[0_0_30px_rgba(34,197,94,0.15)]"
          : "border-border"
      }`}
    >
      {plan.highlight && (
        <span className="absolute left-6 top-4 z-10 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Más popular
        </span>
      )}

      <div className="space-y-5">
        <div>
          <h3 className="text-3xl font-bold text-text">{plan.name}</h3>
          <p className="mt-2 text-sm text-text-muted">{plan.description}</p>
        </div>

        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-text">{plan.price}</span>
          <span className="pb-1 text-base text-text-muted">{plan.period}</span>
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature.label}
              className={`flex items-center gap-3 text-sm ${
                feature.available ? "text-text" : "text-text-muted"
              }`}
            >
              {feature.available ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <X className="h-4 w-4 text-text-muted" />
              )}
              {feature.label}
            </li>
          ))}
        </ul>
      </div>

      <Button href="/register" className="w-full">
        Elegir plan
      </Button>
    </Card>
  );
};

export default PlanCard;

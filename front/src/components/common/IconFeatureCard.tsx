import type { LucideIcon } from "lucide-react";
import Card from "./Card";

interface IconFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const IconFeatureCard = ({
  icon: Icon,
  title,
  description,
}: IconFeatureCardProps) => {
  return (
    <Card className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-text">{title}</h3>
      <p className="mt-2 font-body text-sm text-text-muted">{description}</p>
    </Card>
  );
};

export default IconFeatureCard;

import { Star } from 'lucide-react';

interface RatingBadgeProps {
  rating: number;
  className?: string;
}

const RatingBadge = ({ rating, className = '' }: RatingBadgeProps) => {
  return (
    <span
      className={` flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 font-semibold text-text backdrop-blur-sm  ${className}`}
    >
      <Star className="h-3.5 w-3.5 fill-star text-star" />
      {rating}
    </span>
  );
};

export default RatingBadge;

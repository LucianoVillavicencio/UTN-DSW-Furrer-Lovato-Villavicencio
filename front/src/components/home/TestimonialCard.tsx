import Card from "../common/Card";
import StarRating from "../common/starRating";
import Avatar from "../common/Avatar";

interface TestimonialCardProps {
  rating: number;
  quote: string;
  avatarSrc: string;
  name: string;
  memberSince: string;
}

const TestimonialCard = ({
  rating,
  quote,
  avatarSrc,
  name,
  memberSince,
}: TestimonialCardProps) => {
  return (
    <Card>
      <StarRating rating={rating} />

      <p className="mt-4 font-body italic text-text-muted">"{quote}"</p>

      <div className="mt-6 flex items-center gap-3">
        <Avatar src={avatarSrc} name={name} />
        <div>
          <p className="text-sm font-semibold text-text">{name}</p>
          <p className="text-xs text-text-muted">
            {" "}
            Miembro desde {memberSince}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TestimonialCard;

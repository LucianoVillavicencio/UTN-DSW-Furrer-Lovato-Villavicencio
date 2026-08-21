interface AvatarProps {
  src: string;
  name: string;
  size?: 'sm' | 'md';
}

const sizeStyles = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
};

const Avatar = ({ src, name, size = 'md' }: AvatarProps) => {
  return (
    <img
      src={src}
      alt={`Foto de perfil ${name}`}
      className={`${sizeStyles[size]} rounded-full object-cover`}
    />
  );
};

export default Avatar;

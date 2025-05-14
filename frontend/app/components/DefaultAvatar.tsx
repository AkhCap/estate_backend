import { User } from 'lucide-react';

interface DefaultAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  size?: number;
  className?: string;
}

export default function DefaultAvatar({ firstName, lastName, size = 96, className = "" }: DefaultAvatarProps) {
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    }
    return <User className="w-1/2 h-1/2 text-gray-600" strokeWidth={1.5} />;
  };

  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-gray-50 ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: `${size * 0.4}px`
      }}
    >
      {getInitials()}
    </div>
  );
} 
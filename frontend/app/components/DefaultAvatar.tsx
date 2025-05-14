import { FaUser } from 'react-icons/fa';

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
    return <FaUser className="w-1/3 h-1/3 text-gray-400" />;
  };

  return (
    <div 
      className={`flex items-center justify-center bg-gray-100 text-gray-600 font-medium ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: `${size * 0.4}px`,
        letterSpacing: '0.05em'
      }}
    >
      {getInitials()}
    </div>
  );
} 
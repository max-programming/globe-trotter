import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  imageUrl?: string | null;
  userName?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-24 h-24",
};

const fallbackIconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
};

export function UserAvatar({
  imageUrl,
  userName,
  className = "",
  size = "md",
}: UserAvatarProps) {
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={imageUrl || ""} className="object-cover" />
      <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
        {userName ? (
          getInitials(userName)
        ) : (
          <User className={fallbackIconSizes[size]} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

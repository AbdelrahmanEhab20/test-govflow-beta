import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UserAvatar({ user, size = "default", showTooltip = true }) {
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    default: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const avatarComponent = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user?.avatar_url} />
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
        {getInitials(user?.full_name || user?.email)}
      </AvatarFallback>
    </Avatar>
  );

  if (!showTooltip) return avatarComponent;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatarComponent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{user?.full_name || "Unknown"}</p>
          {user?.email && <p className="text-xs text-slate-500">{user.email}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
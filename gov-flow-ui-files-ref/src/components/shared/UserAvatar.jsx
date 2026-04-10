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

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      if (!apiBase) return url;
      try {
        return new URL(url, apiBase).toString();
      } catch {
        return url;
      }
    }
    return url;
  };

  const avatarUrl = resolveMediaUrl(
    user?.avatar_url || user?.avatar || user?.photo_url || user?.image_url || user?.profile_image || ""
  );

  const avatarComponent = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={avatarUrl} />
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
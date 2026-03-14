import React from "react";

export type AvatarProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

export function Avatar({ fallback = "", className = "", alt = "Avatar", ...props }: AvatarProps) {
  return (
    <div className="rounded-full bg-[#f1ebe3] w-12 h-12 overflow-hidden shadow-inner">
      <img className={`w-full h-full object-cover ${className}`} alt={alt} {...props} />
    </div>
  );
}

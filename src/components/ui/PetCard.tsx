import React from "react";
import { Badge } from "./Badge";
import { Card } from "./Card";

export type Pet = {
  name: string;
  status: "PERDIDO" | "ENCONTRADO";
  description: string;
  time: string;
  location: string;
  image: string;
  highlight?: boolean;
};

export function PetCard({
  pet,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { pet: Pet }) {
  const tone = pet.status === "PERDIDO" ? "warning" : "success";

  const { onClick } = props as { onClick?: (e?: any) => void };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") onClick(e as any);
  };

  return (
    <Card
      accent={pet.highlight ? "gold" : "neutral"}
      className={`relative flex gap-2 p-3 w-80 h-32 items-start cursor-pointer ${className}`}
      {...props}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={pet.image}
          alt={pet.name}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = "/assets/mascotas/perro1.png";
          }}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-[#020826] truncate">{pet.name}</p>
          <span className="text-xs text-[#716040] ml-2">{pet.time}</span>
        </div>
        <p
          className="text-sm text-[#716040] mt-1"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {pet.description}
        </p>

        <div className="absolute left-3 bottom-3 text-xs text-[#716040] inline-flex items-center gap-1 max-w-[11rem]">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 0C3.34315 0 2 1.34315 2 3C2 5 5 10 5 10C5 10 8 5 8 3C8 1.34315 6.65685 0 5 0Z"
              stroke="#8c7851"
            />
            <circle cx="5" cy="3" r="1" fill="#8c7851" />
          </svg>
          <span className="truncate">{pet.location}</span>
        </div>
        <div className="absolute right-3 bottom-3">
          <Badge tone={tone}>{pet.status}</Badge>
        </div>
      </div>
    </Card>
  );
}

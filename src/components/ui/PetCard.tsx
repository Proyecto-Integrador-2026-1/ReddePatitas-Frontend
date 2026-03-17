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
  return (
    <Card accent={pet.highlight ? "gold" : "neutral"} className={`relative flex gap-2 p-3 ${className}`} {...props}>
      <div className="h-16 w-16 rounded-lg overflow-hidden">
        <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-[#020826]">{pet.name}</p>
          <span className="text-xs text-[#716040]">{pet.time}</span>
        </div>
        <p className="text-sm text-[#716040] mt-1">{pet.description}</p>
        <div className="flex items-center gap-2 mt-3 text-xs text-[#716040]">
          <span className="inline-flex items-center gap-1 text-[#716040]">
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5 0C3.34315 0 2 1.34315 2 3C2 5 5 10 5 10C5 10 8 5 8 3C8 1.34315 6.65685 0 5 0Z"
                stroke="#8c7851"
                strokeWidth="1.25"
              />
              <circle cx="5" cy="3" r="1" fill="#8c7851" />
            </svg>
            {pet.location}
          </span>
          <Badge tone={tone}>{pet.status}</Badge>
        </div>
      </div>
    </Card>
  );
}

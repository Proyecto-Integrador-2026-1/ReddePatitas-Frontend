import React from "react";
import { Button } from "./Button";
import { Link } from "react-router-dom";

export type NavItem = {
  label: string;
  active?: boolean;
  count?: number;
  icon?: React.ReactNode;
};

type SideNavProps = {
  items: NavItem[];
};

export function SideNav({ items }: SideNavProps) {
  return (
    <nav className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
            item.active ? "bg-[#f9f4ef] shadow-[0px_4px_6px_rgba(0,0,0,0.1)]" : "text-[#716040] hover:bg-[#f6f1e7]"
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-[#020826]">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {typeof item.count === "number" && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#8c7851] text-xs font-bold text-white">
              {item.count}
            </span>
          )}
        </div>
      ))}
      <div className="pt-3 border-t border-[#e5e7eb]">
        <Link to="/login">
          <Button variant="solid" size="md" className="w-full">
            Acceder
          </Button>
        </Link>
      </div>
    </nav>
  );
}

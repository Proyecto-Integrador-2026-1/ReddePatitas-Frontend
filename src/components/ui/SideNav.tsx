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
  // Split items into two groups: top (first 4) and bottom (rest)
  const splitIndex = Math.min(4, items.length);
  const topItems = items.slice(0, splitIndex);
  const bottomItems = items.slice(splitIndex);

  return (
    // make nav full-height and distribute content so Acceder stays at the bottom
    <nav className="h-full flex flex-col justify-between">
      <div className="space-y-3">
        {topItems.map((item) => (
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
      </div>

      <div>
        {/* Caja blanca que agrupa 'Mi Perfil', 'Configuración' y el botón Acceder */}
        <div className="pt-3">
          <div className="space-y-3">
            {bottomItems.map((item) => (
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
          </div>

          <div className="mt-4 rounded-2xl bg-white/95 border border-[#e5e7eb] p-4">
            <Link to="/login">
              <Button variant="solid" size="md" className="w-full">
                Acceder
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

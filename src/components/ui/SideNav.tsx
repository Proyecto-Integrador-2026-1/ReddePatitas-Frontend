import React from "react";
import { Button } from "./Button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export type NavItem = {
  label: string;
  active?: boolean;
  count?: number;
  icon?: React.ReactNode;
  to?: string;
  authOnly?: boolean;
};

type SideNavProps = {
  items: NavItem[];
};

function AuthButton() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleClick = async () => {
    if (user) {
      await logout();
      navigate('/');
    }
  };

  if (!user) {
    return (
      <Link to="/login" className="inline-flex h-14 w-full items-center justify-center rounded-[12px] border border-transparent bg-[#020826] px-6 text-base font-bold text-white shadow-[0px_10px_25px_rgba(0,0,0,0.25)] transition hover:bg-[#020826cc]">
        Acceder
      </Link>
    );
  }

  return (
    <Button variant="solid" size="md" className="w-full" onClick={handleClick} type="button">
      Cerrar sesión
    </Button>
  );
}

export function SideNav({ items }: SideNavProps) {
  const { isAuthenticated } = useAuth();
  const visibleItems = items.filter((item) => !item.authOnly || isAuthenticated);
  const splitIndex = Math.min(4, visibleItems.length);
  const topItems = visibleItems.slice(0, splitIndex);
  const bottomItems = visibleItems.slice(splitIndex);

  return (
    <nav className="h-full flex flex-col justify-between">
      <div className="space-y-3">
        {topItems.map((item) => {
          const content = (
            <div className="flex items-center gap-3 text-sm font-semibold text-[#020826]">
              {item.icon}
              <span>{item.label}</span>
            </div>
          );
          return (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                item.active ? "bg-[#f9f4ef] shadow-[0px_4px_6px_rgba(0,0,0,0.1)]" : "text-[#716040] hover:bg-[#f6f1e7]"
              }`}
            >
              {item.to ? <Link to={item.to}>{content}</Link> : content}
              {typeof item.count === "number" && (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#8c7851] text-xs font-bold text-white">
                  {item.count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-[#e5e7eb] space-y-3">
        {bottomItems.map((item) => {
          const content = (
            <div className="flex items-center gap-3 text-sm font-semibold text-[#020826]">
              {item.icon}
              <span>{item.label}</span>
            </div>
          );
          return (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                item.active ? "bg-[#f9f4ef] shadow-[0px_4px_6px_rgba(0,0,0,0.1)]" : "text-[#716040] hover:bg-[#f6f1e7]"
              }`}
            >
              {item.to ? <Link to={item.to}>{content}</Link> : content}
              {typeof item.count === "number" && (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#8c7851] text-xs font-bold text-white">
                  {item.count}
                </span>
              )}
            </div>
          );
        })}
        <div className="pt-6">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
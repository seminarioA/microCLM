import type { ReactNode } from "react";
import "./ModuleHeader.css";

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function ModuleHeader({ title, subtitle, actions }: ModuleHeaderProps) {
  return (
    <header className="module-header">
      <div>
        <h1 className="module-header__title">{title}</h1>
        <p className="module-header__subtitle">{subtitle}</p>
      </div>
      {actions && <div className="module-header__actions">{actions}</div>}
    </header>
  );
}

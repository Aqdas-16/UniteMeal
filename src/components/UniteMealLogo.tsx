import React from "react";

export function UniteMealLogo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center font-extrabold tracking-tight ${className || "text-2xl"}`} {...props}>
      <span style={{ color: '#1E2A44' }} className="dark:text-white">Unite</span>
      <span style={{ color: '#4CAF50' }}>Meal</span>
    </div>
  );
}

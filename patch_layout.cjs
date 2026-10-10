const fs = require('fs');

const layoutCode = `
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, User, Settings, LogOut, Menu, X, MapPin, Bell, Truck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { Button } from '@/components/ui/button';

export function VolunteerDashboardLayout() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Active', icon: Truck, href: '/dashboard/volunteer' },
    { label: 'Completed', icon: ClipboardList, href: '/dashboard/volunteer/history' },
    { label: 'Profile', icon: User, href: '/dashboard/volunteer/settings' }, // using settings page for profile currently
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col">
      {/* Desktop & Mobile Header */}
      <header className="bg-white dark:bg-[#111113] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard/volunteer')}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UM</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white hidden sm:block">Delivery Partner</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={\`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors \${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#1a1a1a]'
                  }\`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full mb-16 md:mb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111113] border-t border-slate-200 dark:border-slate-800 pb-safe z-50 flex justify-around">
        {navItems.map(item => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={\`flex flex-col items-center justify-center w-full py-3 space-y-1 transition-colors \${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }\`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
`;

fs.writeFileSync('src/components/layout/VolunteerDashboardLayout.tsx', layoutCode);

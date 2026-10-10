import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, User, LogOut, Truck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { FloatingAssistant } from '@/src/components/FloatingAssistant';
import { CertificateWidget } from '@/src/components/dashboard/CertificateWidget';

export function VolunteerDashboardLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Active', icon: Truck, href: '/dashboard/volunteer' },
    { label: 'Completed', icon: ClipboardList, href: '/dashboard/volunteer/history' },
    { label: 'Profile', icon: User, href: '/dashboard/volunteer/profile' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col font-sans selection:bg-emerald-100">
      
      {/* Professional SaaS Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard/volunteer')}>
            <div className="w-7 h-7 bg-[#059669] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs tracking-tight">UM</span>
            </div>
            <span className="font-bold text-[13px] text-slate-900 dark:text-white tracking-tight hidden sm:block">NGO Team Portal</span>
          </div>

          {/* Clean Segmented Navigation */}
          <nav className="hidden md:flex items-center bg-slate-100 dark:bg-[#111113] p-1 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-[#1A1C20] text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111113] border-t border-slate-200 dark:border-slate-800 pb-safe z-50 flex justify-around px-2 py-1 shadow-lg">
        {navItems.map(item => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                isActive ? 'text-[#059669] dark:text-emerald-400 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <item.icon className="w-4 h-4 mb-1" />
              <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <CertificateWidget />
      <FloatingAssistant />
    </div>
  );
}
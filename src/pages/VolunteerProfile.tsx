import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { User, LogOut, Bell, Shield, KeyRound, Bike, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function VolunteerProfile() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="h-[calc(100dvh-64px)] w-full overflow-y-auto bg-[#F8F9F6] dark:bg-[#0A0A0A] font-sans px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-[800px] mx-auto w-full space-y-4">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#111113] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
               <User className="w-6 h-6" />
            </div>
            <div>
               <h1 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight">{profile?.full_name || 'Volunteer Partner'}</h1>
               <p className="text-[12px] text-slate-500 mt-0.5">{profile?.email || user?.email}</p>
            </div>
          </div>
          <span className="w-fit px-3 py-1 bg-emerald-50 text-[#059669] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
             Active Team Member
          </span>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
           <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-[#0A0A0A]/50">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Preferences & Settings</h2>
           </div>
           
           <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-[#16181D]/50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Appearance</p>
                    <p className="text-[11px] text-slate-500">Switch between light and dark modes</p>
                 </div>
              </div>
              <ThemeToggle />
           </div>

           <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-[#16181D]/50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Push Notifications</p>
                    <p className="text-[11px] text-slate-500">Receive alerts for assigned pickups</p>
                 </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[12px] bg-transparent border-slate-200 dark:border-slate-700">Enabled</Button>
           </div>
        </div>

        {/* Security & Actions Section */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
           <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-[#0A0A0A]/50">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Security</h2>
           </div>

           <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-[#16181D]/50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Password & Credentials</p>
                    <p className="text-[11px] text-slate-500">Update your account password securely</p>
                 </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/reset-password')} className="h-8 text-[12px] border-slate-200 dark:border-slate-700 bg-transparent">
                 Change Password
              </Button>
           </div>

           <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-[#16181D]/50 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Session Control</p>
                    <p className="text-[11px] text-slate-500">Sign out of your volunteer account</p>
                 </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { signOut(); navigate('/'); }} 
                className="h-8 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/30 dark:hover:bg-red-900/20 bg-transparent"
              >
                 Logout
              </Button>
           </div>
        </div>

      </div>
    </main>
  );
}
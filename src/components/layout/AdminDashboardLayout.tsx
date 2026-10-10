import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Box, Search, LayoutDashboard, Users, ShieldCheck, Activity, BarChart3, FileText, Settings, Bell, LogOut, HelpCircle, User, Bot , Menu, X , Plus , History , Truck } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthContext';
import { UniteMealLogo } from '../UniteMealLogo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AdminDashboardLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { session, profile, signOut, user } = useAuth();
  const roleName = 'Platform Admin';
  
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
        const { count } = await supabase.from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_user_id', user.uid)
            .eq('is_read', false);
        if (count !== null) setUnreadCount(count);
    };

    fetchUnreadCount();

    const channel = supabase.channel('admin-notifs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiver_user_id=eq.${user.uid}` }, () => fetchUnreadCount())
        .subscribe();
        
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const displayName = profile?.full_name || 'System Operator';
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* GLOBAL TOP NAVIGATION */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] flex items-center justify-between px-4 xl:px-8 shrink-0 relative z-20 shadow-sm">
        
        <div className="flex items-center gap-8">
            <Button variant="ghost" size="icon" className="lg:hidden mr-2 -ml-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-1 font-extrabold text-2xl tracking-tight mr-4 cursor-pointer" onClick={() => navigate('/dashboard/admin')}>
              <UniteMealLogo />
            </div>

            {/* HORIZONTAL NAV LINKS */}
            <nav className="hidden lg:flex items-center space-x-1">
              <NavLink to="/dashboard/admin" end className={({isActive}) => `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                Home
              </NavLink>
              <NavLink to="/dashboard/admin/analytics" className={({isActive}) => `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                Dashboard
              </NavLink>
              <NavLink to="/dashboard/admin/donations" className={({isActive}) => `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                Live Tracking
              </NavLink>
              <NavLink to="/dashboard/admin/reports" className={({isActive}) => `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                Reports
              </NavLink>
              <NavLink to="/dashboard/admin/users" className={({isActive}) => `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                Users
              </NavLink>
              <NavLink to="/dashboard/admin/settings" className={({isActive}) => `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                Settings
              </NavLink>
            </nav>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex relative group">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search IDs, Users, NGOs..." 
              className="w-48 lg:w-64 bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-full h-8 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all dark:text-slate-200 focus:bg-white dark:focus:bg-[#111113] focus:border-emerald-200 dark:focus:border-emerald-900/50"
            />
          </div>

          
          

          <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-500 rounded-full relative hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate('/dashboard/admin/notifications')}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-[#111113] text-[8px] font-bold text-white flex items-center justify-center">{unreadCount}</div>}
          </Button>
          
          
          <ThemeToggle />
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
          
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 flex items-center justify-center p-0 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold overflow-hidden border border-slate-300 dark:border-slate-700 hover:ring-2 ring-emerald-500/50 transition-all focus:outline-none">
                 {displayInitials}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel className="font-normal p-3 bg-slate-50 dark:bg-slate-900/50 rounded-t-md mb-1">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-slate-500 mt-1">{session?.email}</p>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 py-1 px-2 rounded w-fit">Standard Admin</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/admin/profile')}>
                <User className="mr-2 h-4 w-4 text-slate-500" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/admin/analytics')}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/admin/settings')}>
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/admin/settings?tab=security')}>
                <ShieldCheck className="mr-2 h-4 w-4 text-slate-500" />
                <span>Security</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/admin/notifications')}>
                <Bell className="mr-2 h-4 w-4 text-slate-500" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/faq')}>
                <HelpCircle className="mr-2 h-4 w-4 text-slate-500" />
                <span>Help Center</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                 className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer font-medium"
                 onClick={async () => { await signOut(); navigate('/auth'); }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>
      
      
      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-[#11131f] z-[70] lg:hidden flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                <UniteMealLogo />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 rounded-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
                
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
                {/* Dynamically extract links from the desktop nav, for now just hardcode based on role */}
                
                <MobileNavItem to="/dashboard/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavItem to="/dashboard/admin/users" icon={<Users className="w-4 h-4" />} label="Users" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavItem to="/dashboard/admin/verifications" icon={<Shield className="w-4 h-4" />} label="Verifications" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavItem to="/dashboard/admin/donations" icon={<Box className="w-4 h-4" />} label="Donations" onClick={() => setIsMobileMenuOpen(false)} />
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-auto bg-slate-50 dark:bg-[#09090b]">
        <Outlet />
      </main>
    </div>
  );
}


function MobileNavItem({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <NavLink 
      to={to} 
      end={to === '/dashboard/restaurant' || to === '/dashboard/ngo' || to === '/dashboard/admin'}
      onClick={onClick}
      className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-[#3FAE49]/10 text-[#3FAE49] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
    >
      {icon}
      {label}
    </NavLink>
  );
}

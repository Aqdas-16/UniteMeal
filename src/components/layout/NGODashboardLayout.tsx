import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Truck, Search, LayoutDashboard, History, PlusCircle, BarChart3, Settings, Bell, LogOut, HelpCircle, Map, User, Bot, Command , Menu, X , Users , Shield , Box } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthContext';
import { UniteMealLogo } from '../UniteMealLogo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function NGODashboardLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { session, profile, signOut, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const isHome = location.pathname === '/dashboard/ngo';

  useEffect(() => {
    if (!user) return;
    
    const fetchUnread = async () => {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.uid)
            .eq('is_read', false);
        setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.uid}`
      }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  const displayName = profile?.business_name || profile?.full_name || 'Organization';
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isHome ? 'bg-theme-bg' : 'bg-theme-bg dark:bg-theme-bg'} text-[#1E3A5F] dark:text-[#FFFFFF] font-sans transition-colors duration-200`}>
      
      {/* GLOBAL TOP NAVIGATION */}
      <header className={`fixed top-0 left-0 right-0 z-50 w-full px-4 pt-2 md:pt-4 transition-all duration-300`}>
        <div className={`mx-auto max-w-5xl rounded-[28px] border transition-all duration-300 backdrop-blur-[18px] bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(23,28,36,0.92)] border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] flex h-[52px] items-center justify-between px-4 md:px-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none`}>
        
        <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="lg:hidden mr-2 -ml-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className={`flex items-center gap-1 font-extrabold text-2xl tracking-tight cursor-pointer`} onClick={() => navigate('/dashboard/ngo')}>
              <UniteMealLogo />
            </div>

            {/* HORIZONTAL NAV LINKS */}
            <nav className="hidden lg:flex items-center space-x-1">

              <NavLink to="/dashboard/ngo" end className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                Home
              </NavLink>
              <NavLink to="/dashboard/ngo/incoming" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                Available Donations
              </NavLink>
              <NavLink to="/dashboard/ngo/track" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                My Pickups
              </NavLink>
              <NavLink to="/dashboard/ngo/volunteers" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                Volunteers
              </NavLink>
              <NavLink to="/dashboard/ngo/history" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                History
              </NavLink>
              <NavLink to="/dashboard/ngo/analytics" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                Analytics
              </NavLink>
</nav>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">

          <Button variant="ghost" size="icon" className={`w-8 h-8 rounded-full relative text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800`} onClick={() => navigate('/dashboard/ngo/notifications')}>
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 text-[8px] font-bold text-white flex items-center justify-center border-white dark:border-[#171C24]`}>
                 {unreadCount}
              </div>
            )}
          </Button>
          
          <ThemeToggle className="w-8 h-8" />
          
          <div className={`w-px h-4 mx-1 hidden sm:block bg-slate-200 dark:bg-slate-700`} />
          
          <DropdownMenu>
            <DropdownMenuTrigger className={`relative h-8 w-8 flex items-center justify-center p-0 rounded-full font-bold text-sm overflow-hidden border transition-all shadow-sm focus:outline-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:ring-2 ring-[#3FAE49]/50 dark:ring-[#D4AF37]/50`}>
                 {displayInitials}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel className="font-normal p-3 bg-slate-50 dark:bg-slate-900/50 rounded-t-md mb-1">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-slate-500 mt-1">{session?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded w-fit ${profile?.verification_status === 'verified' ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' : profile?.verification_status === 'rejected' ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30' : 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {profile?.verification_status === 'verified' ? '🟢 Verified Partner' : profile?.verification_status === 'rejected' ? '🔴 Verification Rejected' : '🟡 Verification Pending'}
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/ngo')}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/ngo/profile')}>
                <User className="mr-2 h-4 w-4 text-slate-500" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/ngo/track')}>
                <History className="mr-2 h-4 w-4 text-slate-500" />
                <span>View My Pickups</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/ngo/volunteers')}>
                <Command className="mr-2 h-4 w-4 text-slate-500" />
                <span>Volunteers</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/ngo/analytics')}>
                <BarChart3 className="mr-2 h-4 w-4 text-slate-500" />
                <span>Report & Analytics</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/ngo/settings')}>
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                 className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer font-medium"
                 onClick={async () => { await signOut(); navigate('/auth'); }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
        </div>
      </header>
      
      
      {/* MOBILE DRAWER */}
      

      <main className={`flex-1 flex flex-col overflow-auto bg-theme-bg dark:bg-theme-bg ${isHome ? '' : 'pt-[68px] lg:pt-[76px]'} pb-16 md:pb-0`}>
        <Outlet />
      </main>

      {/* BOTTOM NAVIGATION (MOBILE ONLY) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-theme-surface border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 px-2 z-50 pb-safe">
        <NavLink to="/dashboard/ngo" end className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-primary dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>
        <NavLink to="/dashboard/ngo/incoming" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-primary dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Donations</span>
        </NavLink>
        <NavLink to="/dashboard/ngo/track" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-primary dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium">Track</span>
        </NavLink>
        <NavLink to="/dashboard/ngo/volunteers" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-primary dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Team</span>
        </NavLink>
        <NavLink to="/dashboard/ngo/profile" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-primary dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>
      </div>

    </div>
  );
}


function MobileNavItem({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <NavLink 
      to={to} 
      end={to === '/dashboard/ngo' || to === '/dashboard/ngo' || to === '/dashboard/admin'}
      onClick={onClick}
      className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
    >
      {icon}
      {label}
    </NavLink>
  );
}

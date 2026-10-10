import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Map, Truck, Search, LayoutDashboard, History, PlusCircle, BarChart3, Settings, Bell, LogOut, HelpCircle, User, Bot, Command , Menu, X , Users , Shield , Box } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthContext';
import { UniteMealLogo } from '../UniteMealLogo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function DonorDashboardLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { session, profile, signOut, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const isHome = location.pathname === '/dashboard/restaurant';

  useEffect(() => {
    if (!user) return;
    
    const fetchUnread = async () => {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_user_id', user.uid)
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
        filter: `receiver_user_id=eq.${user.uid}`
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
    <div className="role-restaurant flex flex-col h-screen overflow-hidden bg-[#F5F0E8] text-[#292722] font-sans transition-colors duration-200 dark:bg-[#171B17] dark:text-[#F5F0E8]">
      
      {/* GLOBAL TOP NAVIGATION */}
      <header className={`fixed top-0 left-0 right-0 z-50 w-full px-4 pt-2 md:pt-4 transition-all duration-300`}>
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] flex h-14 items-center justify-between px-4 md:px-6 shadow-sm transition-colors duration-200 dark:border-[#394339] dark:bg-[#202720]">
        <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="lg:hidden mr-2 -ml-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className={`flex items-center gap-1 font-extrabold text-2xl tracking-tight cursor-pointer`} onClick={() => navigate('/dashboard/restaurant')}>
              <UniteMealLogo />
            </div>

            {/* HORIZONTAL NAV LINKS */}
            <nav className="hidden lg:flex items-center space-x-1">
              <NavLink to="/dashboard/restaurant" end className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-[#E5E9DF] text-[#245C43] dark:bg-[#2B342C] dark:text-[#A9D0B5]' : 'text-[#716F67] hover:bg-[#F5F0E8] hover:text-[#245C43] dark:text-[#B8BDB3] dark:hover:bg-[#2B342C] dark:hover:text-[#A9D0B5]'}`}>
                Home
              </NavLink>
              <NavLink to="/dashboard/restaurant/create" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-[#E5E9DF] text-[#245C43] dark:bg-[#2B342C] dark:text-[#A9D0B5]' : 'text-[#716F67] hover:bg-[#F5F0E8] hover:text-[#245C43] dark:text-[#B8BDB3] dark:hover:bg-[#2B342C] dark:hover:text-[#A9D0B5]'}`}>
                Donate Food
              </NavLink>
              <NavLink to="/dashboard/restaurant/active" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-[#E5E9DF] text-[#245C43] dark:bg-[#2B342C] dark:text-[#A9D0B5]' : 'text-[#716F67] hover:bg-[#F5F0E8] hover:text-[#245C43] dark:text-[#B8BDB3] dark:hover:bg-[#2B342C] dark:hover:text-[#A9D0B5]'}`}>
                Donations
              </NavLink>
              <NavLink to="/dashboard/restaurant/track" className={({isActive}) => `px-3 py-1.5 text-[14px] font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-[#E5E9DF] text-[#245C43] dark:bg-[#2B342C] dark:text-[#A9D0B5]'  : 'text-[#716F67] hover:bg-[#F5F0E8] hover:text-[#245C43] dark:text-[#B8BDB3] dark:hover:bg-[#2B342C] dark:hover:text-[#A9D0B5]'}`}>
                Track Deliveries
              </NavLink>
            </nav>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">

          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-[#716F67] hover:bg-[#E5E9DF] hover:text-[#245C43] dark:text-[#B8BDB3] dark:hover:bg-[#2B342C] dark:hover:text-[#A9D0B5]" onClick={() => navigate('/dashboard/restaurant/notifications')}>
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
              <DropdownMenuItem onClick={() => navigate('/dashboard/restaurant')}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/restaurant/profile')}>
                <User className="mr-2 h-4 w-4 text-slate-500" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/restaurant/active')}>
                <History className="mr-2 h-4 w-4 text-slate-500" />
                <span>View Donations</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/restaurant/track')}>
                <Command className="mr-2 h-4 w-4 text-slate-500" />
                <span>Track Deliveries</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/restaurant/analytics')}>
                <BarChart3 className="mr-2 h-4 w-4 text-slate-500" />
                <span>Report & Analytics</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/restaurant/settings')}>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFDF8] dark:bg-[#202720] border-t border-[#E5DED2] dark:border-[#394339] flex justify-around items-center h-16 px-2 z-50 pb-safe">
        <NavLink to="/dashboard/restaurant" end className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>
        <NavLink to="/dashboard/restaurant/create" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Donate</span>
        </NavLink>
        <NavLink to="/dashboard/restaurant/track" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium">Track</span>
        </NavLink>
        <NavLink to="/dashboard/restaurant/history" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </NavLink>
        <NavLink to="/dashboard/restaurant/profile" className={({isActive}) => `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}`}>
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
      end={to === '/dashboard/restaurant' || to === '/dashboard/ngo' || to === '/dashboard/admin'}
      onClick={onClick}
      className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-primary/10 text-primary dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
    >
      {icon}
      {label}
    </NavLink>
  );
}

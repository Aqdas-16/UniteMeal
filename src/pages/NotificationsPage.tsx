import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Search, Filter, Trash2, MailOpen, AlertCircle, Inbox, ArchiveX, CheckCircle2, Star, 
  MapPin, HeartHandshake, Truck, User, ArrowLeft, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function NotificationsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.uid)
      .order('created_at', { ascending: false });
    
    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.uid).eq('is_read', false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', id);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }

    if (notif.action_url) {
       navigate(notif.action_url);
       return;
    }

    // Fallback routing based on type if no action_url
    if (!profile?.role) return;
    const role = profile.role;
    
    switch (notif.related_entity_type) {
        case 'donation':
            if (role === 'donor') navigate('/dashboard/restaurant/active');
            else if (role === 'ngo') navigate('/dashboard/ngo');
            break;
        case 'delivery':
            navigate(`/dashboard/${role}/track`);
            break;
        case 'request':
            if (role === 'donor') navigate('/dashboard/restaurant/requests');
            else if (role === 'ngo') navigate('/dashboard/ngo/requests');
            break;
        case 'profile':
            navigate(`/dashboard/${role}/profile`);
            break;
        default:
            navigate(`/dashboard/${role}`);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
        case 'ngo_request': return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
        case 'delivery_update': return <Truck className="w-4 h-4 text-blue-600" />;
        case 'system_alert': return <Bell className="w-4 h-4 text-purple-600" />;
        case 'verification_status': return <AlertCircle className="w-4 h-4 text-rose-600" />;
        case 'profile': return <User className="w-4 h-4 text-orange-600" />;
        case 'general': return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
        default: return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };
  
  const getCategoryColorClass = (type: string) => {
     switch (type) {
         case 'ngo_request': return 'text-emerald-500';
         case 'delivery_update': return 'text-blue-500';
         case 'system_alert': return 'text-purple-500';
         case 'verification_status': return 'text-rose-500';
         case 'profile': return 'text-orange-500';
         case 'general': return 'text-slate-500';
         default: return 'text-slate-500';
     }
  };

  const filteredNotifications = notifications.filter(n => {
      const matchesSearch = (n.title || '').toLowerCase().includes(search.toLowerCase()) || (n.message || '').toLowerCase().includes(search.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'unread') matchesTab = !n.is_read;
      else if (activeTab !== 'all') matchesTab = n.type === activeTab;
      
      return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col py-6">
       <div className="flex items-center gap-4 mb-6">
           <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/restaurant')} className="shrink-0 gap-2 font-bold"><ArrowLeft className="w-4 h-4" /> Back</Button>
           <h1 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h1>
       </div>
       
       <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
           {/* Sidebar */}
           <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
               <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <Input 
                       placeholder="Search notifications..." 
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       className="pl-9 bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 rounded-xl"
                   />
               </div>
               
               <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1">
                   <Button onClick={() => setActiveTab('all')} variant={activeTab === 'all' ? 'secondary' : 'ghost'} className="w-full justify-between h-9 text-sm font-bold">
                       <span className="flex items-center gap-2"><Inbox className="w-4 h-4 text-slate-500" /> All Mail</span>
                       {notifications.length > 0 && <span className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">{notifications.length}</span>}
                   </Button>
                   <Button onClick={() => setActiveTab('unread')} variant={activeTab === 'unread' ? 'secondary' : 'ghost'} className="w-full justify-between h-9 text-sm font-bold">
                       <span className="flex items-center gap-2"><MailOpen className="w-4 h-4 text-slate-500" /> Unread</span>
                       {notifications.filter(n => !n.is_read).length > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-2 py-0.5 rounded-full">{notifications.filter(n => !n.is_read).length}</span>}
                   </Button>
               </div>

               <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1">
                   <div className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">Categories</div>
                   <Button onClick={() => setActiveTab('ngo_request')} variant={activeTab === 'ngo_request' ? 'secondary' : 'ghost'} className="w-full justify-start h-9 text-sm text-slate-600 dark:text-slate-400 font-medium">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 mr-4 ml-1"></span> NGO Requests
                   </Button>
                   <Button onClick={() => setActiveTab('delivery_update')} variant={activeTab === 'delivery_update' ? 'secondary' : 'ghost'} className="w-full justify-start h-9 text-sm text-slate-600 dark:text-slate-400 font-medium">
                       <span className="w-2 h-2 rounded-full bg-blue-500 mr-4 ml-1"></span> Delivery Updates
                   </Button>
                   <Button onClick={() => setActiveTab('system_alert')} variant={activeTab === 'system_alert' ? 'secondary' : 'ghost'} className="w-full justify-start h-9 text-sm text-slate-600 dark:text-slate-400 font-medium">
                       <span className="w-2 h-2 rounded-full bg-purple-500 mr-4 ml-1"></span> System Alerts
                   </Button>
                   <Button onClick={() => setActiveTab('verification_status')} variant={activeTab === 'verification_status' ? 'secondary' : 'ghost'} className="w-full justify-start h-9 text-sm text-slate-600 dark:text-slate-400 font-medium">
                       <span className="w-2 h-2 rounded-full bg-rose-500 mr-4 ml-1"></span> Verification
                   </Button>
                   <Button onClick={() => setActiveTab('profile')} variant={activeTab === 'profile' ? 'secondary' : 'ghost'} className="w-full justify-start h-9 text-sm text-slate-600 dark:text-slate-400 font-medium">
                       <span className="w-2 h-2 rounded-full bg-orange-500 mr-4 ml-1"></span> Profile
                   </Button>
                   <Button onClick={() => setActiveTab('general')} variant={activeTab === 'general' ? 'secondary' : 'ghost'} className="w-full justify-start h-9 text-sm text-slate-600 dark:text-slate-400 font-medium">
                       <span className="w-2 h-2 rounded-full bg-slate-500 mr-4 ml-1"></span> General
                   </Button>
               </div>
           </div>

           {/* Mail List Area */}
           <div className="flex-1 bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative z-10">
               <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 bg-slate-50 dark:bg-[#111113] shrink-0 sticky top-0 z-20">
                   <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-slate-400 pointer-events-none"><ArchiveX className="w-4 h-4" /></Button>
                   </div>
                   <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="h-8 text-xs font-bold gap-2">
                       <Check className="w-3.5 h-3.5" /> Mark all as read
                   </Button>
               </div>
               <div className="flex-1 overflow-y-auto w-full no-scrollbar">
                   {loading ? (
                       <div className="flex justify-center p-8"><span className="animate-pulse font-bold text-slate-400">Loading...</span></div>
                   ) : filteredNotifications.length === 0 ? (
                       <div className="text-center flex flex-col items-center justify-center p-20 h-full">
                          <Inbox className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No notifications found</h3>
                          <p className="text-slate-500 font-medium max-w-[250px] mx-auto">You're all caught up! New updates will appear here.</p>
                       </div>
                   ) : (
                       <div className="divide-y divide-slate-100 dark:divide-slate-800/60 w-full select-none cursor-pointer">
                           {filteredNotifications.map((notif) => (
                               <div
                                   key={notif.id}
                                   onClick={() => handleNotificationClick(notif)}
                                   className={`flex items-center px-4 py-4 hover:shadow-[inset_2px_0_0_#cbd5e1,0_1px_2px_0_rgba(0,0,0,0.05)] dark:hover:shadow-[inset_2px_0_0_#334155,0_1px_2px_0_rgba(0,0,0,0.05)] transition-all group ${!notif.is_read ? 'bg-slate-50 dark:bg-slate-900/50 shadow-[inset_2px_0_0_#6366f1]' : 'bg-white dark:bg-[#111113] shadow-[inset_2px_0_0_transparent]'}`}
                               >
                                  <div className="flex items-center gap-3 w-[160px] md:w-[200px] shrink-0">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.is_read ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800/50'}`}>
                                          {getIconForType(notif.type)}
                                      </div>
                                      <span className={`truncate text-sm capitalize ${!notif.is_read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>{notif.type.replace('_', ' ')}</span>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 pr-4 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                      <div className="flex items-center gap-2">
                                          {!notif.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>}
                                          {notif.priority === 'high' && <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px] py-0 px-1.5 shrink-0">URGENT</Badge>}
                                          <span className={`truncate text-sm ${!notif.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{notif.title}</span>
                                      </div>
                                      <span className="text-slate-500 text-sm font-normal truncate hidden md:block"> - {notif.message}</span>
                                      <span className="text-slate-500 text-xs font-normal truncate md:hidden">{notif.message}</span>
                                  </div>
                                  
                                  <div className="w-24 shrink-0 text-right">
                                      <span className={`text-xs ${!notif.is_read ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>
                                          {notif.created_at ? new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                      </span>
                                  </div>
                                  
                                  <div className="absolute right-0 top-0 bottom-0 pr-4 items-center gap-2 bg-gradient-to-l from-slate-50 via-slate-50 to-transparent dark:from-slate-900 pl-12 hidden group-hover:flex">
                                       {!notif.is_read && (
                                           <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white dark:bg-[#111113] shadow-sm text-slate-500 hover:text-indigo-600" onClick={(e) => handleMarkAsRead(notif.id, e)} title="Mark as read">
                                               <MailOpen className="w-4 h-4" />
                                           </Button>
                                       )}
                                       <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white dark:bg-[#111113] shadow-sm text-slate-500 hover:text-red-600" onClick={(e) => handleDelete(notif.id, e)} title="Delete">
                                           <Trash2 className="w-4 h-4" />
                                       </Button>
                                  </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
}

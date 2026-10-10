import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Building, ClipboardList, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CertificateCard } from '@/src/components/dashboard/CertificateCard';

export function VolunteerHistory() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          donations(title, quantity_kg, donor_id),
          ngos(organization_name, address)
        `)
        .eq('volunteer_id', user.uid)
        .in('status', ['delivered', 'completed', 'cancelled', 'failed'])
        .order('updated_at', { ascending: false });
        
      if (!error && data) {
         const enhanced = await Promise.all(data.map(async (d: any) => {
            const { data: rData } = await supabase.from('restaurants').select('business_name').eq('user_id', d.donations?.donor_id).maybeSingle();
            const { data: pData } = await supabase.from('profiles').select('full_name').eq('id', d.donations?.donor_id).maybeSingle();
            return {
               ...d,
               restaurantName: rData?.business_name || pData?.full_name || 'Restaurant'
            };
         }));
         setDeliveries(enhanced);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  const filteredDeliveries = deliveries.filter(item => {
    const matchesSearch = 
        item.donations?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ngos?.organization_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="h-[calc(100dvh-64px)] w-full overflow-hidden bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col font-sans">
      <div className="mx-auto max-w-[1280px] w-full h-full p-4 sm:p-5 flex flex-col gap-3">
        
        {/* Certificate Card widget integrated neatly */}
        <div className="shrink-0">
           <CertificateCard role="volunteer" />
        </div>

        {/* Compact Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 dark:text-white leading-tight">Completed Deliveries</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Review your past community rescue missions and routes.</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by food, restaurant, or NGO..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-[12px] bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 shadow-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-[12px] bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 shadow-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">All Statuses</SelectItem>
              <SelectItem value="completed" className="text-[12px]">Completed</SelectItem>
              <SelectItem value="delivered" className="text-[12px]">Delivered</SelectItem>
              <SelectItem value="cancelled" className="text-[12px]">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* High-Density Scrollable List Container */}
        <div className="flex-1 min-h-0 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Table Header Row */}
            <div className="hidden sm:flex items-center justify-between px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0A0A0A]/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                <div className="w-[35%] min-w-[200px]">Delivery Title & Status</div>
                <div className="w-[30%]">Route (Pickup → Dropoff)</div>
                <div className="w-[15%]">Timestamp</div>
                <div className="w-[20%] text-right">Yield Quantity</div>
            </div>

            {/* List Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full py-10 text-slate-400 text-[12px]">
                   <Loader2 className="w-5 h-5 animate-spin text-[#059669] mr-2" /> Loading records...
                </div>
              ) : filteredDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                   <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">No delivery records found</h3>
                   <p className="text-[11px] text-slate-500 mt-0.5">Your completed rescue missions will appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredDeliveries.map(d => (
                    <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-5 hover:bg-slate-50/50 dark:hover:bg-[#16181D] transition-colors gap-3 sm:gap-0">
                      
                      {/* 1. Title & Status */}
                      <div className="flex flex-col gap-1 w-full sm:w-[35%] min-w-[200px] pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-wider
                            ${d.status === 'completed' || d.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                              'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                            }
                          `}>
                            {d.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-[13px] text-slate-900 dark:text-white truncate leading-tight">{d.donations?.title || 'Food Rescue Delivery'}</h3>
                      </div>

                      {/* 2. Route Info */}
                      <div className="w-full sm:w-[30%] flex flex-col text-[11px] text-slate-500 dark:text-slate-400 gap-0.5 pr-3">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">From: {d.restaurantName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">To: {d.ngos?.organization_name || 'Partner NGO'}</span>
                        </div>
                      </div>

                      {/* 3. Timestamp */}
                      <div className="w-full sm:w-[15%] flex items-center gap-1.5 text-[11px] text-slate-400 pr-3">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{format(new Date(d.updated_at), 'MMM d, yyyy')}</span>
                      </div>

                      {/* 4. Quantity */}
                      <div className="w-full sm:w-[20%] flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <div className="font-bold text-[12px] text-slate-900 dark:text-white">
                            {d.donations?.quantity_kg || 0} kg
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Weight</div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>

      </div>
    </main>
  );
}
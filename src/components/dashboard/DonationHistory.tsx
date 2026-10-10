import React, { useState, useEffect } from 'react';
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Search, RefreshCcw, Plus, Trash2, ArrowLeft, 
  AlertTriangle, ChevronDown, Edit3, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function DonationHistoryContent() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    
    // State
    const [donations, setDonations] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedDonation, setSelectedDonation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [donationToDelete, setDonationToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDonations = async () => {
        if (!user) return;
        setLoading(true);
        let query = supabase
            .from('donations')
            .select('*, ngo:profiles!donations_ngo_id_fkey(full_name)')
            .eq('donor_id', user.uid);
            
        if (statusFilter !== 'All') query = query.eq('status', statusFilter.toLowerCase().replace(' ', '_'));
        if (categoryFilter !== 'All') query = query.ilike('food_category', `%${categoryFilter}%`);
        if (search) query = query.or(`title.ilike.%${search}%,id.eq.${search}`);
            
        if (sortOrder === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortOrder === 'oldest') query = query.order('created_at', { ascending: true });
        else if (sortOrder === 'weight') query = query.order('quantity_kg', { ascending: false });

        const { data, error } = await query;
        if (!error && data) setDonations(data);
        else toast.error('Failed to load donations');
        setLoading(false);
    };

    useEffect(() => {
        fetchDonations();
        if (!user) return;
        const channel = supabase.channel('donations_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: `donor_id=eq.${user.uid}` }, fetchDonations)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, statusFilter, categoryFilter, search, sortOrder]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'delivered': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
            default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
        }
    };
    
    const getCategoryIcon = (category: string) => {
        const norm = normalizeCategory(category);
        const opt = CATEGORY_OPTIONS.find(c => c.id === norm);
        if (opt) return React.cloneElement(opt.icon as React.ReactElement, { className: 'w-4 h-4' });
        return <div className="w-4 h-4" />;
    };

    const confirmDelete = async () => {
        if (!donationToDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('donations').delete().eq('id', donationToDelete.id);
        if (!error) {
            toast.success('Donation deleted successfully');
            setDonationToDelete(null);
            if (selectedDonation?.id === donationToDelete.id) setSelectedDonation(null);
            fetchDonations();
        } else toast.error('Failed to delete donation');
        setIsDeleting(false);
    };

    // ----------------------------------------------------------------------
    // DETAIL VIEW
    // ----------------------------------------------------------------------
    if (selectedDonation) {
        return (
            <main className="w-full min-h-[calc(100dvh-64px)] bg-[#FAFAFA] dark:bg-[#0A0A0A] px-4 py-2 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1200px]">
                    <div className="mb-4 flex items-center justify-between">
                        <button 
                            className="inline-flex items-center text-[13px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                            onClick={() => setSelectedDonation(null)}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Donations
                        </button>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50 border-red-200 dark:border-red-900/30 dark:hover:bg-red-900/20" onClick={() => setDonationToDelete(selectedDonation)}>
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        {selectedDonation.title}
                                    </h1>
                                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium capitalize ${getStatusStyle(selectedDonation.status)}`}>
                                        {selectedDonation.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-[13px] text-slate-500 font-mono">
                                    ID: {selectedDonation.id.split('-')[0].toUpperCase()}
                                </p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-[13px] text-slate-500 mb-1">Created on</p>
                                <p className="text-[13px] font-medium text-slate-900 dark:text-slate-300">
                                    {new Date(selectedDonation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-[#0A0A0A]/50">
                            <div className="p-6 sm:p-8">
                                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Donation Details</h3>
                                <dl className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-[13px] text-slate-500">Category</dt>
                                        <dd className="text-[13px] font-medium text-slate-900 dark:text-slate-200 col-span-2">{selectedDonation.food_category}</dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-[13px] text-slate-500">Yield</dt>
                                        <dd className="text-[13px] font-medium text-slate-900 dark:text-slate-200 col-span-2 flex items-center gap-2">
                                            {selectedDonation.quantity_kg} kg <span className="text-slate-300 dark:text-slate-700">|</span> ~{selectedDonation.estimated_meals} meals
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-[13px] text-slate-500">Expires</dt>
                                        <dd className="text-[13px] font-medium text-slate-900 dark:text-slate-200 col-span-2">
                                            {new Date(selectedDonation.expiry_time).toLocaleString()}
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-[13px] text-slate-500">Dietary</dt>
                                        <dd className="text-[13px] font-medium text-slate-900 dark:text-slate-200 col-span-2">{selectedDonation.dietary_restrictions || 'None specified'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="p-6 sm:p-8">
                                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Fulfillment</h3>
                                <dl className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-[13px] text-slate-500">Location</dt>
                                        <dd className="text-[13px] font-medium text-slate-900 dark:text-slate-200 col-span-2">
                                            {profile?.business_name || profile?.full_name || 'My Restaurant'}
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-[13px] text-slate-500">Address</dt>
                                        <dd className="text-[13px] font-medium text-slate-900 dark:text-slate-200 col-span-2 leading-relaxed">
                                            {selectedDonation.address || selectedDonation.pickup_address}
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800/60">
                                        <dt className="text-[13px] text-slate-500">NGO Partner</dt>
                                        <dd className="text-[13px] font-medium text-slate-900 dark:text-slate-200 col-span-2">
                                            {selectedDonation.ngo?.full_name ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">{selectedDonation.ngo.full_name}</span>
                                            ) : (
                                                <span className="text-slate-400 italic">Unassigned</span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ----------------------------------------------------------------------
    // LIST VIEW (Multi-Column Thin Strips)
    // ----------------------------------------------------------------------
    return (
        <main className="w-full min-h-[calc(100dvh-64px)] bg-[#FAFAFA] dark:bg-[#0A0A0A] px-4 py-3 sm:px-6 lg:px-8">
            {/* Expanded max-width to utilize the side space */}
            <div className="mx-auto max-w-[1400px]">
                
                {/* Minimal Header Section */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Donations</h1>
                        <p className="text-[12px] text-slate-500 mt-0.5">Manage your active and historical food listings.</p>
                    </div>
                    <Button 
                        onClick={() => navigate('/dashboard/restaurant/create')}
                        className="h-8 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white shadow-sm text-[12px] px-4 w-full sm:w-auto transition-all"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New Donation
                    </Button>
                </div>

                {/* Inline Command Bar */}
                <div className="mb-5 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search donations..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111111] pl-8 pr-3 text-[12px] text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <div className="relative">
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-8 appearance-none rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111111] pl-3 pr-7 text-[12px] text-slate-700 dark:text-slate-300 outline-none shadow-sm cursor-pointer"
                            >
                                {['All Statuses', 'Available', 'Pending', 'Delivered', 'Cancelled'].map(s => (
                                    <option key={s} value={s === 'All Statuses' ? 'All' : s}>{s}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="h-8 appearance-none rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111111] pl-3 pr-7 text-[12px] text-slate-700 dark:text-slate-300 outline-none shadow-sm cursor-pointer"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="weight">Heaviest</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Grid of Thin Strips: 1 Col Mobile, 2 Cols Tablet, 3 Cols Desktop */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <RefreshCcw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                        <p className="text-[13px]">Loading data...</p>
                    </div>
                ) : donations.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-dashed py-16 text-center bg-white dark:bg-[#111111]">
                        <p className="text-[13px] font-medium text-slate-900 dark:text-white">No donations found</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">Adjust filters or create a new donation.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {donations.map((d) => (
                            <div 
                                key={d.id} 
                                onClick={() => setSelectedDonation(d)}
                                className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111111] hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer"
                            >
                                {/* Left: Icon + Content */}
                                <div className="flex items-center min-w-0 flex-1">
                                    {/* Icon Box */}
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-50 dark:bg-[#1A1D24] text-slate-500 mr-3 border border-slate-100 dark:border-slate-800">
                                        {getCategoryIcon(d.food_category)}
                                    </div>
                                    
                                    {/* Titles */}
                                    <div className="min-w-0 pr-3 flex-1">
                                        <h3 className="truncate text-[13px] font-semibold text-slate-900 dark:text-white leading-tight mb-0.5">
                                            {d.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                            <span className="truncate max-w-[80px] sm:max-w-[100px] capitalize">{d.food_category}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                            <span>{d.quantity_kg}kg (~{d.estimated_meals}m)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Status, Date, & Hover Actions */}
                                <div className="flex flex-col items-end shrink-0 pl-2">
                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-medium capitalize mb-1 ${getStatusStyle(d.status)}`}>
                                        {d.status.replace('_', ' ')}
                                    </span>
                                    
                                    <div className="flex items-center justify-end h-5">
                                        {/* Date (disappears on hover to show trash icon) */}
                                        <div className="text-[10px] text-slate-400 group-hover:hidden transition-opacity flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </div>
                                        
                                        {/* Action Buttons (Appears on hover) */}
                                        <div className="hidden group-hover:flex items-center gap-2 animate-in fade-in duration-200">
                                            <button 
                                                className="text-slate-400 hover:text-red-600 transition-colors"
                                                onClick={(e) => { e.stopPropagation(); setDonationToDelete(d); }}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Modal */}
                {donationToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete Donation</h3>
                            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                                Are you sure you want to delete <span className="font-medium text-slate-900 dark:text-slate-300">"{donationToDelete.title}"</span>? This action cannot be undone.
                            </p>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" className="h-8 text-xs bg-white dark:bg-[#111111] border-slate-200 dark:border-slate-800" onClick={() => setDonationToDelete(null)} disabled={isDeleting}>Cancel</Button>
                                <Button className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete} disabled={isDeleting}>
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
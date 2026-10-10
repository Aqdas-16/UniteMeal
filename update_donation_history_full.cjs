const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, Truck, Box, Zap, Share, Store, Search, Filter, RefreshCcw, Plus, Utensils, Leaf, Drumstick, Croissant, ShoppingBag, Wheat, X, ArrowLeft, Download, Printer, Copy, Calendar, AlertTriangle, FileText, ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export function DonationHistoryContent() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [donations, setDonations] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedDonation, setSelectedDonation] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchDonations = async () => {
        if (!user) return;
        setIsRefreshing(true);
        setLoading(true);
        let query = supabase
            .from('donations')
            .select('*, deliveries(*, ngos(*))')
            .eq('donor_id', user.uid);
            
        if (statusFilter !== 'All') {
            query = query.eq('status', statusFilter.toLowerCase().replace(' ', '_'));
        }
        
        if (categoryFilter !== 'All') {
            query = query.ilike('food_category', \`%\${categoryFilter}%\`);
        }
        
        if (search) {
            query = query.or(\`title.ilike.%\${search}%,food_category.ilike.%\${search}%,address.ilike.%\${search}%,id.eq.\${search}\`);
        }
        
        if (sortOrder === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortOrder === 'oldest') query = query.order('created_at', { ascending: true });
        else if (sortOrder === 'weight') query = query.order('quantity_kg', { ascending: false });
        else if (sortOrder === 'meals') query = query.order('estimated_meals', { ascending: false });
        // Expiry time sorting (approximate)
        else if (sortOrder === 'expiry') query = query.order('expiry_time', { ascending: true });

        const { data, error } = await query;
        
        if (error) {
            console.error("Error fetching donations:", error);
            toast.error("Failed to fetch donations");
        } else {
            setDonations(data || []);
        }
        setLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchDonations();
        const channel = supabase.channel('history_donations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: \`donor_id=eq.\${user?.uid}\` }, () => fetchDonations())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, statusFilter, categoryFilter, search, sortOrder]);

    const getStatusConfig = (status: string) => {
        switch(status) {
            case 'available': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50', label: 'Available', dot: 'bg-emerald-500' };
            case 'requested': return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800/50', label: 'Requested', dot: 'bg-yellow-500' };
            case 'assigned': 
            case 'accepted': 
            case 'reserved': return { color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50', label: 'Accepted', dot: 'bg-blue-500' };
            case 'volunteer_assigned': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800/50', label: 'Volunteer Assigned', dot: 'bg-indigo-500' };
            case 'picked_up': 
            case 'in_transit': return { color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800/50', label: 'Picked Up', dot: 'bg-orange-500' };
            case 'delivered': return { color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800/50', label: 'Delivered', dot: 'bg-purple-500' };
            case 'completed': return { color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:border-green-800/50', label: 'Completed', dot: 'bg-green-600' };
            case 'expired': return { color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800/50', label: 'Expired', dot: 'bg-red-500' };
            case 'cancelled': return { color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300', label: 'Cancelled', dot: 'bg-slate-500' };
            default: return { color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300', label: (status||'').replace('_', ' '), dot: 'bg-slate-400' };
        }
    };

    const getCategoryIcon = (category: string) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('cooked') || cat.includes('prepared')) return <Utensils className="w-6 h-6 text-orange-500" />;
        if (cat.includes('veg') && !cat.includes('non')) return <Leaf className="w-6 h-6 text-emerald-500" />;
        if (cat.includes('non-veg') || cat.includes('meat')) return <Drumstick className="w-6 h-6 text-red-500" />;
        if (cat.includes('bakery') || cat.includes('bread')) return <Croissant className="w-6 h-6 text-amber-500" />;
        if (cat.includes('groceries') || cat.includes('packed')) return <ShoppingBag className="w-6 h-6 text-blue-500" />;
        if (cat.includes('dairy')) return <Coffee className="w-6 h-6 text-indigo-500" />;
        if (cat.includes('dry') || cat.includes('raw')) return <Wheat className="w-6 h-6 text-yellow-600" />;
        return <Box className="w-6 h-6 text-slate-500" />;
    };
    
    const handleAction = async (action: string, id: string) => {
        try {
            if (action === 'cancel') {
                await supabase.from('donations').update({ status: 'cancelled' }).eq('id', id);
                toast.success('Donation cancelled');
            } else if (action === 'duplicate') {
                const donation = donations.find(d => d.id === id);
                if (!donation) return;
                const { id: _, created_at, status, ...rest } = donation;
                await supabase.from('donations').insert({ ...rest, status: 'available' });
                toast.success('Donation duplicated');
            } else if (action === 'share') {
                navigator.clipboard.writeText(\`\${window.location.origin}/donate/\${id}\`);
                toast.success('Link copied to clipboard');
            } else if (action === 'print' || action === 'download') {
                window.print();
            }
        } catch(e) {
            toast.error('Action failed');
        }
        setSelectedDonation(null);
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-20">
            <PageHeader title="Donations" breadcrumbs={[{label: 'Donations'}]} />
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div>
                    <p className="text-slate-500 font-medium mt-2 text-sm">Manage food donations, monitor status and respond to NGO requests.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search by Title, ID..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[240px] h-10 pl-9 rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 font-medium shadow-sm"
                        />
                    </div>
                    <div className="flex items-center bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-xl p-1 h-10 shadow-sm">
                        <select 
                          className="h-full bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 px-3 outline-none border-r border-slate-200 dark:border-slate-800"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option>All</option>
                            <option>Available</option>
                            <option>Pending</option>
                            <option>Accepted</option>
                            <option>Picked Up</option>
                            <option>Delivered</option>
                            <option>Completed</option>
                            <option>Expired</option>
                            <option>Cancelled</option>
                        </select>
                        <select 
                          className="h-full bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 px-3 outline-none border-r border-slate-200 dark:border-slate-800"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option>All</option>
                            <option value="Cooked Food">Cooked Food</option>
                            <option value="Raw Food">Raw Food</option>
                            <option value="Packed Food">Packed Food</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Vegetables">Vegetables</option>
                            <option value="Fruits">Fruits</option>
                            <option value="Dairy">Dairy</option>
                        </select>
                        <select 
                          className="h-full bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 px-3 outline-none"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="expiry">Expiry Time</option>
                            <option value="weight">Weight</option>
                            <option value="meals">Meals</option>
                        </select>
                    </div>
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 shadow-sm" onClick={fetchDonations}>
                        <RefreshCcw className={\`w-4 h-4 text-slate-600 \${isRefreshing ? 'animate-spin' : ''}\`} />
                    </Button>
                    <Button onClick={() => navigate('/dashboard/donor/create')} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm flex items-center px-4">
                        <Plus className="w-4 h-4 mr-2" /> New Donation
                    </Button>
                </div>
            </div>

            {loading ? (
                 <div className="py-24 text-center">
                    <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading donations...</p>
                 </div>
            ) : donations.length === 0 ? (
                <div className="py-24 text-center border rounded-xl dark:border-slate-800 bg-white dark:bg-[#111113] shadow-sm max-w-2xl mx-auto">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Box className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">No matching records</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">You haven't created any donations that match these filters. Try adjusting your search or create a new donation.</p>
                    <Button onClick={() => navigate('/dashboard/donor/create')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                        <Plus className="w-4 h-4 mr-2" /> Create your first donation
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {donations.map((donation) => {
                        const status = getStatusConfig(donation.status);
                        return (
                            <Card key={donation.id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer bg-white dark:bg-[#111113] flex flex-col" onClick={() => setSelectedDonation(donation)}>
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center shrink-0">
                                                {getCategoryIcon(donation.food_category)}
                                            </div>
                                            <div>
                                                <Badge variant="outline" className={\`uppercase tracking-wider font-bold text-[10px] px-2 py-0.5 rounded-full mb-1 border \${status.color}\`}>
                                                    <span className={\`w-1.5 h-1.5 rounded-full mr-1.5 inline-block \${status.dot}\`} />
                                                    {status.label}
                                                </Badge>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1">{donation.title || 'Untitled Donation'}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[11px] font-bold uppercase">Quantity</span>
                                            </div>
                                            <p className="font-bold text-slate-900 dark:text-white">{donation.quantity_kg} kg</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                                <Store className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="text-[11px] font-bold uppercase">Meals</span>
                                            </div>
                                            <p className="font-bold text-slate-900 dark:text-white">~{donation.estimated_meals}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="flex items-start gap-2">
                                            <Clock className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                                            <span className="line-clamp-1">Listed {new Date(donation.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                                            <span className="line-clamp-1">{donation.address}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                                    <span className="text-xs font-medium text-slate-500">ID: {donation.id?.split('-')[0]}</span>
                                    <div className="flex -space-x-2">
                                        <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white dark:border-[#111113] flex items-center justify-center z-20" title="Restaurant Verified">
                                            <Store className="w-3 h-3 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {selectedDonation && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedDonation(null)} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </Button>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Donation Details</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-slate-200" onClick={() => handleAction('share', selectedDonation.id)}>
                                    <Share className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-slate-200" onClick={() => handleAction('download', selectedDonation.id)}>
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        
                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">
                            
                            {/* Status Banner */}
                            <div className={\`rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border \${getStatusConfig(selectedDonation.status).color.replace('border-', 'border-l-4 border-')}\`}>
                                <div className="flex items-center gap-4">
                                    <div className={\`w-14 h-14 rounded-full flex items-center justify-center text-white \${getStatusConfig(selectedDonation.status).dot}\`}>
                                        {getStatusConfig(selectedDonation.status).label === 'Completed' ? <Store className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{getStatusConfig(selectedDonation.status).label}</h3>
                                        <p className="text-sm font-medium mt-1">ID: {selectedDonation.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold uppercase tracking-wider mb-1">Created</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{new Date(selectedDonation.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Food Information */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Utensils className="w-5 h-5 text-emerald-500"/> Food Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">{selectedDonation.title}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">{selectedDonation.food_category}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Quantity</p>
                                        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{selectedDonation.quantity_kg} kg</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Estimated Meals</p>
                                        <p className="font-bold text-blue-700 dark:text-blue-400 text-lg">~{selectedDonation.estimated_meals} meals</p>
                                    </div>
                                </div>
                                {selectedDonation.notes && (
                                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Notes</p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedDonation.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Logistics */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500"/> Logistics</h3>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-start gap-3 mb-4">
                                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pickup Address</p>
                                            <p className="font-semibold text-slate-900 dark:text-white">{selectedDonation.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Safety & Expiry</p>
                                            <p className="font-semibold text-slate-900 dark:text-white">Consume within {selectedDonation.expiry_time} hours of preparation.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => handleAction('duplicate', selectedDonation.id)}>
                                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                                </Button>
                                {['available', 'pending'].includes(selectedDonation.status) && (
                                    <>
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20" onClick={() => handleAction('cancel', selectedDonation.id)}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
`;
fs.writeFileSync('components/dashboard/DonationHistory.tsx', code);

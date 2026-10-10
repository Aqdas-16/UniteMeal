const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, Truck, Box, Zap, Share, Store, Search, Filter, RefreshCcw, Plus, Utensils, Leaf, Drumstick, Croissant, ShoppingBag, Wheat, X, ArrowLeft, Download, Printer, Copy, Calendar, AlertTriangle, FileText, ChevronLeft, ChevronRight, Edit3, Trash2, Coffee, ArrowRight, MoreHorizontal } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export function DonationHistoryContent() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [donations, setDonations] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedDonation, setSelectedDonation] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Deletion state
    const [donationToDelete, setDonationToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

        const { data, error } = await query;
        if (!error && data) {
            setDonations(data);
        } else if (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load donations');
        }
        setIsRefreshing(false);
        setLoading(false);
    };

    useEffect(() => {
        fetchDonations();
        
        if (!user) return;
        
        // Subscribe to realtime changes so it never goes missing
        const channel = supabase.channel('donations_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: \`donor_id=eq.\${user.uid}\` }, () => {
                fetchDonations();
            })
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, statusFilter, categoryFilter, search, sortOrder]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'assigned': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
            case 'picked_up': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
            case 'delivered': return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800';
            case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
        }
    };

    const getCategoryIcon = (category: string) => {
        if (!category) return <Box className="w-5 h-5" />;
        const cat = category.toLowerCase();
        if (cat.includes('cooked') || cat.includes('prepared')) return <Utensils className="w-5 h-5" />;
        if (cat.includes('produce') || cat.includes('vegetable') || cat.includes('fruit')) return <Leaf className="w-5 h-5" />;
        if (cat.includes('meat') || cat.includes('poultry')) return <Drumstick className="w-5 h-5" />;
        if (cat.includes('bakery') || cat.includes('bread') || cat.includes('pastry')) return <Croissant className="w-5 h-5" />;
        if (cat.includes('dairy') || cat.includes('milk') || cat.includes('cheese')) return <Coffee className="w-5 h-5" />;
        if (cat.includes('grocery') || cat.includes('packaged')) return <ShoppingBag className="w-5 h-5" />;
        if (cat.includes('grain') || cat.includes('pasta') || cat.includes('rice')) return <Wheat className="w-5 h-5" />;
        return <Box className="w-5 h-5" />;
    };

    const confirmDelete = async () => {
        if (!donationToDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('donations').delete().eq('id', donationToDelete.id);
        if (!error) {
            toast.success('Donation deleted successfully');
            setDonationToDelete(null);
            fetchDonations();
        } else {
            toast.error('Failed to delete donation');
        }
        setIsDeleting(false);
    };

    if (selectedDonation) {
        return (
            <div className="w-full">
                {/* Back Button */}
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setSelectedDonation(null)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Donations List
                    </Button>
                </div>
                
                {/* Header */}
                <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                    {getCategoryIcon(selectedDonation.food_category)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <Badge className={\`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 \${getStatusColor(selectedDonation.status)}\`}>
                                            {selectedDonation.status.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(selectedDonation.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                            ID: {selectedDonation.id.split('-')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                                        {selectedDonation.title}
                                    </h1>
                                    <p className="text-sm font-medium text-slate-500 mt-2">
                                        {selectedDonation.quantity_kg} kg • ~{selectedDonation.estimated_meals} meals • {selectedDonation.food_category}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                <Button variant="outline" className="border-slate-200 dark:border-slate-800 shrink-0" onClick={() => {}}>
                                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                                </Button>
                                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 shrink-0" onClick={() => setDonationToDelete(selectedDonation)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Donation Profile</h3>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                    <span className="text-sm font-medium text-slate-500">Category</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedDonation.food_category}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                    <span className="text-sm font-medium text-slate-500">Quantity</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedDonation.quantity_kg} kg</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                    <span className="text-sm font-medium text-slate-500">Est. Meals</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedDonation.estimated_meals} meals</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                    <span className="text-sm font-medium text-slate-500">Expires At</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedDonation.expiry_time).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500">Dietary Needs</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedDonation.dietary_restrictions || 'None'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Pickup Details</h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                <span className="text-sm font-medium text-slate-500">Location Name</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{profile?.business_name || profile?.full_name || 'My Restaurant'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                <span className="text-sm font-medium text-slate-500">Address</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{selectedDonation.address || selectedDonation.pickup_address}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                <span className="text-sm font-medium text-slate-500">NGO Partner</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {selectedDonation.deliveries?.[0]?.ngos?.name || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Page Header explicitly mapping back to Home */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" className="mb-4 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate('/dashboard/donor')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Donations</h1>
                        <p className="text-sm text-slate-500">Manage your historical and active donations.</p>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto" onClick={() => navigate('/dashboard/donor/create')}>
                        <Plus className="w-4 h-4 mr-2" /> Donate Food
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search by title or ID..." 
                            className="pl-9 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 h-10 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        className="h-10 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 text-sm text-slate-900 dark:text-white outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {['All', 'Available', 'Pending', 'Accepted', 'Assigned', 'Picked Up', 'Delivered', 'Completed', 'Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select 
                        className="h-10 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 text-sm text-slate-900 dark:text-white outline-none"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="meals">Most Meals</option>
                        <option value="weight">Highest Weight</option>
                    </select>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <RefreshCcw className="w-8 h-8 animate-spin text-slate-400 mb-4" />
                    <p className="font-medium">Loading your donations...</p>
                </div>
            ) : donations.length === 0 ? (
                <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6 border-4 border-slate-100 dark:border-slate-800">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No donations found</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-sm mb-6">
                        You don't have any donations matching these filters, or you haven't created any yet.
                    </p>
                    <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white" onClick={() => navigate('/dashboard/donor/create')}>
                        Create your first donation
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {donations.map((d) => (
                        <div key={d.id} className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group">
                            
                            {/* Content */}
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 text-indigo-500">
                                    {getCategoryIcon(d.food_category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <Badge className={\`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 \${getStatusColor(d.status)}\`}>
                                            {d.status.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">• {new Date(d.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate pr-4">
                                        {d.title}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                        <span className="flex items-center"><Box className="w-3.5 h-3.5 mr-1" /> {d.quantity_kg} kg</span>
                                        <span className="hidden sm:inline-flex items-center text-slate-300 dark:text-slate-600">•</span>
                                        <span className="flex items-center"><Utensils className="w-3.5 h-3.5 mr-1" /> ~{d.estimated_meals} meals</span>
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0">
                                <Button 
                                    variant="outline" 
                                    className="w-full sm:w-auto bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={() => setSelectedDonation(d)}
                                >
                                    View Details
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                                    onClick={() => setDonationToDelete(d)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            {donationToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Donation</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{donationToDelete.title}"</span>? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <Button variant="outline" className="border-slate-200 dark:border-slate-700" onClick={() => setDonationToDelete(null)} disabled={isDeleting}>Cancel</Button>
                            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
`

fs.writeFileSync('components/dashboard/DonationHistory.tsx', code);

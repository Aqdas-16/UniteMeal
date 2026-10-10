const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorFeatures.tsx', 'utf8');

const targetFunction = code.substring(
    code.indexOf('export function DonationHistoryContent() {'),
    code.indexOf('export function DonorTrackContent() {')
);

const newFunction = `export function DonationHistoryContent() {
  const [donations, setDonations] = useState<any[]>([]);
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedDonation, setSelectedDonation] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDonations = async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*, deliveries(*, ngos(*))')
        .eq('donor_id', user.uid);
        
      if (error) {
        if (!['42P01', '42501'].includes(error.code)) console.error("Error fetching donations:", error);
        return;
      }
      
      let fetchedData = data || [];
      
      const statusWeights: Record<string, number> = {
          'available': 1,
          'requested': 2,
          'reserved': 2,
          'assigned': 3,
          'picked_up': 4,
          'in_transit': 4,
          'delivered': 5,
          'completed': 5,
          'cancelled': 6,
          'expired': 6
      };

      fetchedData.sort((a: any, b: any) => {
          const weightA = statusWeights[a.status] || 99;
          const weightB = statusWeights[b.status] || 99;
          if (weightA !== weightB) return weightA - weightB;
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
      });
      setDonations(fetchedData);
    };
    
    fetchDonations();

    const channel = supabase.channel('history_donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: \`donor_id=eq.\${user.uid}\` }, () => fetchDonations())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDelete = async (id: string) => {
     if (confirm('Are you sure you want to permanently delete this donation? This action cannot be undone.')) {
         // Optimistic UI update
         setDonations(prev => prev.filter(d => d.id !== id));
         
         const { error } = await supabase.from('donations').delete().eq('id', id);
         if (error) {
             console.error("Error deleting donation:", error);
             // It will resync with realtime anyway if it fails and someone refreshes, or we can handle rollback.
         }
     }
  };

  const filtered = donations.filter(d => 
       (d.title || '').toLowerCase().includes(search.toLowerCase()) || 
       (d.status || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Donations Ledger</h2>
           <p className="text-slate-500 font-medium mt-1">Manage and track your active and historical contributions.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
           <Input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-[250px] h-10 rounded-full bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800" />
           <Button variant="outline" className="h-10 rounded-full font-bold shadow-sm whitespace-nowrap">Filter</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
          {filtered.length === 0 ? (
             <div className="py-20 text-center border rounded-xl dark:border-slate-800">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <History className="w-8 h-8 text-slate-400" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Records Found</h3>
                 <p className="text-slate-500">You do not have any donations matching your search.</p>
             </div>
          ) : filtered.map(d => (
             <motion.div key={d.id} whileHover={{ x: 4 }} className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <Box className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{d.title || d.food_category || 'Surplus Food'}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(d.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {d.quantity_kg} {d.unit || 'kg'} ({d.estimated_meals} meals)</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                    <Badge variant="outline" className={\`shrink-0 uppercase tracking-wider py-1 px-3 font-bold \${
                         ['delivered', 'completed'].includes(d.status) ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' :
                         d.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800/50' :
                         ['in_transit', 'picked_up'].includes(d.status) ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30' :
                         'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30'
                    }\`}>
                        {d.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedDonation(d)} className="font-bold text-[#1E3A5F] dark:text-slate-300">Details</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(d.id)} className="font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">Delete</Button>
                    </div>
                </div>
             </motion.div>
          ))}
      </div>

      <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
        <DialogContent className="max-w-md sm:max-w-2xl bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90vh] overflow-y-auto">
            {selectedDonation && (
                <>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-between">
                        {selectedDonation.title || 'Donation Details'}
                        <Badge className="ml-2 uppercase tracking-widest">{selectedDonation.status.replace('_', ' ')}</Badge>
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Weight</p>
                            <p className="text-lg font-bold">{selectedDonation.quantity_kg} {selectedDonation.unit || 'kg'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Meals</p>
                            <p className="text-lg font-bold">{selectedDonation.estimated_meals}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Category</p>
                            <p className="text-lg font-bold capitalize">{selectedDonation.food_category.replace('_', ' ')}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Expiry</p>
                            <p className="text-sm font-bold">{new Date(selectedDonation.expiry_time).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Pickup Address</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedDonation.pickup_address}</p>
                    </div>

                    {selectedDonation.description && (
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Description</p>
                            <p className="text-slate-700 dark:text-slate-300 text-sm">{selectedDonation.description}</p>
                        </div>
                    )}
                    
                    {selectedDonation.special_instructions && (
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Special Instructions</p>
                            <p className="text-slate-700 dark:text-slate-300 text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/50">{selectedDonation.special_instructions}</p>
                        </div>
                    )}
                    
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Timeline</p>
                        <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <p className="text-sm font-medium">Created: {new Date(selectedDonation.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <p className="text-sm font-medium">Last Updated: {new Date(selectedDonation.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

code = code.replace(targetFunction, newFunction);
fs.writeFileSync('src/pages/DonorFeatures.tsx', code);

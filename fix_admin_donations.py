import sys

def run():
    with open('src/pages/AdminFeatures.tsx', 'r') as f:
        content = f.read()

    start_idx = content.find("export function AdminDonationMonitoringContent() {")
    end_idx = content.find("export function AdminAnalyticsContent() {")

    if start_idx == -1 or end_idx == -1:
        print("Could not find boundaries")
        return

    new_component = """export function AdminDonationMonitoringContent() {
   const [donations, setDonations] = useState<any[]>([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [filterStatus, setFilterStatus] = useState('all');

   useEffect(() => {
     const fetchDonations = async () => {
        const { data } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
        if (data) setDonations(data);
     };
     fetchDonations();
     const channel = supabase.channel('admin-donations-mon').on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchDonations()).subscribe();
            
     return () => { supabase.removeChannel(channel); };
   }, []);

   const handleArchive = async (id: string) => {
      if (confirm('Archive this completed donation?')) {
          await supabase.from('donations').update({ status: 'archived' }).eq('id', id);
          toast.success('Donation archived');
      }
   };

   const filtered = donations.filter(d => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (searchQuery) {
         const search = searchQuery.toLowerCase();
         if (!d.id.toLowerCase().includes(search) && !d.title?.toLowerCase().includes(search) && !d.organization_name?.toLowerCase().includes(search)) return false;
      }
      return true;
   });

   return (
      <div className="space-y-6 max-w-6xl mx-auto">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Live Tracking</h2>
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-theme-text-secondary" />
                  <input type="text" placeholder="Search ID, Food, Contributor..." className="pl-9 pr-4 py-2 text-sm border rounded-md dark:bg-slate-900" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
               </div>
               <select className="border rounded-md px-3 py-2 text-sm dark:bg-slate-900" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="archived">Archived</option>
               </select>
            </div>
         </div>
         <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113]">
            <CardContent className="p-0 overflow-x-auto">
               <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                     <TableRow className="border-slate-200 dark:border-slate-800">
                        <TableHead>ID</TableHead>
                        <TableHead>Food Contributor</TableHead>
                        <TableHead>Food Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filtered.map(d => (
                        <TableRow key={d.id} className="border-slate-200 dark:border-slate-800">
                           <TableCell className="font-mono text-xs max-w-[100px] truncate">{d.id}</TableCell>
                           <TableCell className="font-medium">{d.organization_name || 'N/A'}</TableCell>
                           <TableCell>{d.title}</TableCell>
                           <TableCell>{d.quantity_kg}kg</TableCell>
                           <TableCell className="max-w-[150px] truncate">{d.pickup_address}</TableCell>
                           <TableCell>
                              <Badge variant="outline" className="uppercase text-[10px] bg-slate-100 dark:bg-slate-800">{d.status.replace('_', ' ')}</Badge>
                           </TableCell>
                           <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                              {d.created_at ? new Date(d.created_at).toLocaleString() : 'N/A'}
                           </TableCell>
                           <TableCell className="text-right">
                              {d.status === 'completed' && (
                                  <Button variant="outline" size="sm" onClick={() => handleArchive(d.id)} className="text-xs h-7">Archive</Button>
                              )}
                           </TableCell>
                        </TableRow>
                     ))}
                     {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">No contributions match filters.</TableCell></TableRow>}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
   )
}
"""
    final_content = content[:start_idx] + new_component + content[end_idx:]

    with open('src/pages/AdminFeatures.tsx', 'w') as f:
        f.write(final_content)
    print("Replaced successfully")

run()

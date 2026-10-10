const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminFeatures.tsx', 'utf8');

const oldContent = `export function AdminUsersContent() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tab, setTab] = useState<'donor'|'ngo'>('donor');

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (data) setProfiles(data);
    };

    fetchProfiles();

    const channel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdate = async (id: string, status: string) => {
    try {
      await supabase.from('profiles').update({ account_status: status }).eq('id', id);
      createNotification({ userId: id, type: 'system_alert', title: 'Account Status Updated', message: \`Your account has been \${status === 'active' ? 'activated' : 'suspended'}.\`, priority: status === 'active' ? 'normal' : 'high' });
    } catch(e) {}
  };

  const filtered = profiles.filter(p => p.role === tab);`;

const newContent = `export function AdminUsersContent() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [tab, setTab] = useState<'donor'|'ngo'>('donor');

  useEffect(() => {
    const fetchData = async () => {
      const { data: p } = await supabase.from('profiles').select('*');
      const { data: n } = await supabase.from('ngos').select('id');
      const { data: r } = await supabase.from('restaurants').select('user_id');
      if (p) setProfiles(p);
      if (n) setNgos(n);
      if (r) setRestaurants(r);
    };

    fetchData();

    const channel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchData())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdate = async (id: string, status: string) => {
    try {
      await supabase.from('profiles').update({ account_status: status }).eq('id', id);
      createNotification({ userId: id, type: 'system_alert', title: 'Account Status Updated', message: \`Your account has been \${status === 'active' ? 'activated' : 'suspended'}.\`, priority: status === 'active' ? 'normal' : 'high' });
    } catch(e) {}
  };

  const filtered = profiles.filter(p => {
    if (tab === 'ngo') {
      return ngos.some(n => n.id === p.id) || p.role === 'ngo';
    } else {
      return restaurants.some(r => r.user_id === p.id) || p.role === 'donor';
    }
  });`;

code = code.replace(oldContent, newContent);
fs.writeFileSync('src/pages/AdminFeatures.tsx', code);

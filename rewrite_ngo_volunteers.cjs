const fs = require('fs');

const code = `
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, MapPin, CheckCircle2, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

export function NGOVolunteersContent() {
  const { user } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', role: 'Volunteer', availability: 'full-time', status: 'available', photo_url: ''
  });

  useEffect(() => {
    if (!user) return;
    fetchTeam();

    const channel = supabase.channel('ngo-volunteers-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_volunteers', filter: \`ngo_id=eq.\${user.uid}\` }, () => fetchTeam())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchTeam = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('ngo_volunteers').select('*').eq('ngo_id', user.uid).order('created_at', { ascending: false });
    if (data) setTeam(data);
    if (error) console.error(error);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      if (editingMember) {
        const { error } = await supabase.from('ngo_volunteers').update({
          ...formData, updated_at: new Date().toISOString()
        }).eq('id', editingMember.id);
        if (error) throw error;
        toast.success("Volunteer updated");
      } else {
        const { error } = await supabase.from('ngo_volunteers').insert({
          ngo_id: user.uid,
          ...formData
        });
        if (error) throw error;
        toast.success("Volunteer added");
      }
      setIsAddOpen(false);
      setEditingMember(null);
      setFormData({ name: '', phone: '', email: '', role: 'Volunteer', availability: 'full-time', status: 'available', photo_url: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this volunteer?')) return;
    try {
      const { error } = await supabase.from('ngo_volunteers').delete().eq('id', id);
      if (error) throw error;
      toast.success("Volunteer removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      role: member.role || 'Volunteer',
      availability: member.availability || 'full-time',
      status: member.status || 'available',
      photo_url: member.photo_url || ''
    });
    setIsAddOpen(true);
  };

  return (
    <div className="w-full font-sans pb-12 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Manage Volunteers</h1>
          <p className="text-slate-500 mt-1">Manage your team and assign them to pickups.</p>
        </div>
        <Button className="bg-[#3FAE49] hover:bg-[#328f3a] text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all" onClick={() => {
          setEditingMember(null);
          setFormData({ name: '', phone: '', email: '', role: 'Volunteer', availability: 'full-time', status: 'available', photo_url: '' });
          setIsAddOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" /> Add Volunteer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-[#111113] rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
            <Users className="w-12 h-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No volunteers found</h3>
            <p className="text-sm mt-1">Add your first volunteer to start managing pickups.</p>
          </div>
        ) : (
          team.map(member => (
            <Card key={member.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111113] overflow-hidden hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    {member.photo_url ? <img src={member.photo_url} className="w-full h-full object-cover" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{member.name}</h3>
                    <div className="text-sm text-slate-500 font-medium">{member.role || 'Volunteer'}</div>
                  </div>
                </div>
                
                <div className="p-6 space-y-3 bg-slate-50 dark:bg-[#171719]/50">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4 text-slate-400" /> {member.phone || 'No phone'}
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-slate-400" /> {member.email}
                    </div>
                  )}
                  
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className={
                      member.status === 'available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      member.status === 'busy' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                      {member.status || 'available'}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 capitalize">
                      {member.availability || 'full-time'}
                    </Badge>
                  </div>
                </div>

                <div className="flex divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => openEdit(member)} className="flex-1 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#3FAE49] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => handleDelete(member.id)} className="flex-1 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Volunteer' : 'Add New Volunteer'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Volunteer, Driver, etc." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Availability</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                  value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="weekends">Weekends only</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="available">Available</option>
                  <option value="busy">Busy / On Delivery</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.phone} className="bg-[#3FAE49] hover:bg-[#328f3a]">
              Save Volunteer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/NGOVolunteersContent.tsx', code);

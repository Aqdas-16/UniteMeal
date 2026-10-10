const fs = require('fs');
const code = `import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, MapPin, Truck, CheckCircle2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function NGOVolunteersContent() {
  const { user } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', designation: '', vehicle_type: '', vehicle_number: '', status: 'Available'
  });

  useEffect(() => {
    if (!user) return;
    fetchTeam();
    const channel = supabase.channel('ngo-team-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_team', filter: \`ngo_id=eq.\${user.uid}\` }, () => fetchTeam())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchTeam = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('ngo_team').select('*').eq('ngo_id', user.uid).order('created_at', { ascending: false });
    if (data) setTeam(data);
    if (error) console.error(error);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      if (editingMember) {
        const { error } = await supabase.from('ngo_team').update({
          ...formData, updated_at: new Date().toISOString()
        }).eq('id', editingMember.id);
        if (error) throw error;
        toast.success("Team member updated");
      } else {
        const { error } = await supabase.from('ngo_team').insert({
          ngo_id: user.uid,
          ...formData
        });
        if (error) throw error;
        toast.success("Team member added");
      }
      setIsAddOpen(false);
      setEditingMember(null);
      setFormData({ name: '', phone: '', email: '', designation: '', vehicle_type: '', vehicle_number: '', status: 'Available' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('ngo_team').delete().eq('id', id);
      if (error) throw error;
      toast.success("Member removed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      designation: member.designation || '',
      vehicle_type: member.vehicle_type || '',
      vehicle_number: member.vehicle_number || '',
      status: member.status || 'Available'
    });
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">NGO Team Management</h2>
          <p className="text-slate-500">Manage your rescue operation team and their vehicles.</p>
        </div>
        <Button onClick={() => {
          setEditingMember(null);
          setFormData({ name: '', phone: '', email: '', designation: '', vehicle_type: '', vehicle_number: '', status: 'Available' });
          setIsAddOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.designation || 'Member'}</p>
                  </div>
                </div>
                <Badge variant={member.status === 'Available' ? 'default' : member.status === 'Busy' ? 'secondary' : 'outline'}
                    className={member.status === 'Available' ? 'bg-emerald-500' : member.status === 'Busy' ? 'bg-amber-500' : ''}>
                  {member.status}
                </Badge>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {member.phone && (
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    {member.email}
                  </div>
                )}
                {member.vehicle_type && (
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <Truck className="w-4 h-4 mr-2 text-slate-400" />
                    {member.vehicle_type} {member.vehicle_number ? \`- \${member.vehicle_number}\` : ''}
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(member.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {team.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-800">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No team members</h3>
            <p className="text-slate-500 mb-4">Add your first team member to start assigning pickups.</p>
            <Button onClick={() => setIsAddOpen(true)}>Add Team Member</Button>
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="Driver, Manager, etc." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email address" type="email" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Input value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})} placeholder="Van, Bike, etc." />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} placeholder="License Plate" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name}>{editingMember ? 'Save Changes' : 'Add Member'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/NGOVolunteersContent.tsx', code);

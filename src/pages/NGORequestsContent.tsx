import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function NGORequestsContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('ngo_id', user.uid)
        .order('created_at', { ascending: false });
        
      if (data) setRequests(data);
    };
    
    fetchRequests();
    
    const channel = supabase
      .channel('ngo-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `ngo_id=eq.${user.uid}` }, fetchRequests)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'partially_fulfilled': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Food Requests</h2>
          <p className="text-slate-500">Track and manage your broadcasted needs.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/ngo/request-food')} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Request Food
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-slate-500 mb-4">You haven't made any food requests yet.</p>
            <Button onClick={() => navigate('/dashboard/ngo/request-food')} variant="outline">
              Create Your First Request
            </Button>
          </div>
        ) : requests.map(req => (
          <Card key={req.id} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl">{req.food_name || req.title}</h3>
                  <p className="text-sm text-slate-500">{req.category} • {req.food_type}</p>
                </div>
                <Badge className={getStatusColor(req.status)} variant="outline">
                  {req.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm border-t border-b py-4 border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Required:</span>
                  <span className="font-medium">{req.required_quantity_kg || req.quantity_required} {req.quantity_unit || 'kg'}</span>
                </div>
                {Number(req.fulfilled_quantity) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fulfilled:</span>
                    <span className="font-medium text-emerald-600">{req.fulfilled_quantity} {req.quantity_unit || 'kg'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">People / Meals:</span>
                  <span className="font-medium">{req.people_in_need} / {req.meals_required}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required By:</span>
                  <span className="font-medium">
                    {req.required_by ? format(new Date(req.required_by), "MMM d, h:mm a") : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Urgency:</span>
                  <Badge variant={req.urgency === 'Critical' ? 'destructive' : req.urgency === 'Urgent' ? 'default' : 'secondary'} className="h-5">
                    {req.urgency || 'Normal'}
                  </Badge>
                </div>
              </div>

              {req.notes && (
                <p className="text-xs text-slate-500 italic mb-4">"{req.notes}"</p>
              )}

              <div className="text-xs text-slate-400 text-right mt-4">
                Created: {format(new Date(req.created_at), "MMM d, yyyy")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

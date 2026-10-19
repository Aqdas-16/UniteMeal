
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Phone, CheckCircle2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AssignVolunteerModal({ isOpen, onClose, donation, ngoId, onAssigned }: { isOpen: boolean, onClose: () => void, donation: any, ngoId: string, onAssigned: () => void }) {
    const [volunteers, setVolunteers] = useState<any[]>([]);
    const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && ngoId) {
            fetchAvailableVolunteers();
        }
    }, [isOpen, ngoId]);

    const fetchAvailableVolunteers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('volunteers')
            .select('*, profiles!inner(*)')
            .eq('approved', true)
            .eq('status', 'active')
            .eq('availability', 'online')
            .eq('ngo_id', ngoId);
            
        if (data) {
            const formatted = data.map(v => ({
                id: v.id,
                name: v.profiles?.full_name || 'Volunteer',
                phone: v.profiles?.phone || v.profiles?.phone_number || '',
                profile_photo: v.profiles?.avatar_url
            }));
            setVolunteers(formatted);
        }
        setLoading(false);
    };

    const handleAssign = async (volId: string) => {
        setIsAssigning(true);
        try {
            const { error: dErr } = await supabase.from('donations')
                .update({ status: 'assigned', ngo_id: ngoId })
                .eq('id', donation.id);
            if (dErr) throw dErr;
            
            const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
            const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
            
            const { error: dtErr } = await supabase.from('deliveries').insert({
                donation_id: donation.id,
                ngo_id: ngoId,
                volunteer_id: volId,
                status: 'assigned',
                pickup_otp: pickupOtp,
                delivery_otp: deliveryOtp
            });
            if (dtErr) throw dtErr;
            
            // Set volunteer to busy
            await supabase.from('volunteers').update({ availability: 'busy' }).eq('id', volId);
            
            // Notify volunteer
            await supabase.from('notifications').insert({
                user_id: volId,
                title: 'New Delivery Assigned',
                message: `You have been assigned to pick up: ${donation.title}`,
                type: 'delivery_assigned',
                related_entity_id: donation.id
            });
            
            toast.success('Volunteer assigned successfully');
            onAssigned();
        } catch (e: any) {
            toast.error(e.message || 'Failed to assign volunteer');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Assign Volunteer</DialogTitle>
                </DialogHeader>
                
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                ) : volunteers.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">No volunteers available</h3>
                        <p className="text-slate-500 mb-6 text-sm">All your volunteers are busy or offline.</p>
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {volunteers.map(vol => (
                            <div 
                                key={vol.id}
                                onClick={() => setSelectedVolunteer(vol.id)}
                                className={`p-4 border rounded-xl cursor-pointer flex gap-4 transition-all ${selectedVolunteer === vol.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
                                    {vol.profile_photo ? <img src={vol.profile_photo} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-400" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">{vol.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Phone className="w-3 h-3" /> {vol.phone}
                                            </div>
                                        </div>
                                        {selectedVolunteer === vol.id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] py-0 px-1.5 h-4">
                                            Available
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {volunteers.length > 0 && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button 
                            onClick={() => selectedVolunteer && handleAssign(selectedVolunteer)}
                            disabled={!selectedVolunteer || isAssigning}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isAssigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Assign & Confirm Pickup
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

const fs = require('fs');
let code = fs.readFileSync('src/pages/NGODashboard.tsx', 'utf8');

const targetImports = `import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, MapPin, Clock, Truck, ShieldCheck, Check, Navigation2, CheckSquare, Bike, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';`;

const replacementImports = `import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Activity, MapPin, Clock, Truck, ShieldCheck, Check, Navigation2, CheckSquare, Bike, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';`;

code = code.replace(targetImports, replacementImports);

const targetState = `  const [ngoLocation, setNgoLocation] = useState<any>(null);`;
const replacementState = `  const [ngoLocation, setNgoLocation] = useState<any>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState('');`;

code = code.replace(targetState, replacementState);

const targetHandleAccept = `  const handleAccept = async (donation: any) => {
    if (!user) return;
    
    // Simulate accepting logic - real app would insert delivery record
    await supabase.from('donations').update({ status: 'assigned', ngo_id: user.uid }).eq('id', donation.id);
    await supabase.from('deliveries').insert({
       donation_id: donation.id,
       ngo_id: user.uid,
       status: 'pending',
       created_at: new Date().toISOString()
    });
  };`;

const replacementHandleAccept = `  const openRequestModal = (donation: any) => {
    setSelectedDonation(donation);
    setRequestMessage('');
    setRequestModalOpen(true);
  };

  const submitRequest = async () => {
    if (!user || !selectedDonation) return;
    
    // Submit request to food_requests
    await supabase.from('food_requests').insert({
        donation_id: selectedDonation.id,
        restaurant_id: selectedDonation.donor_id,
        ngo_id: user.uid,
        message: requestMessage,
        status: 'pending'
    });
    
    // Create a notification for the restaurant
    await supabase.from('notifications').insert({
        user_id: selectedDonation.donor_id,
        type: 'donation_match',
        title: 'New Food Request',
        message: \`\${profile?.organization_name || 'An NGO'} has requested your donation: \${selectedDonation.title || selectedDonation.food_category}\`,
        related_entity_type: 'donation',
        related_entity_id: selectedDonation.id
    });
    
    // Update local state to hide it
    setAiMatches(aiMatches.filter(d => d.id !== selectedDonation.id));
    setRequestModalOpen(false);
    setSelectedDonation(null);
  };`;

code = code.replace(targetHandleAccept, replacementHandleAccept);

const targetButtons = `<Button className="w-full sm:w-auto h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAccept(item)}>Accept</Button>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto h-8 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(item)}>Ignore</Button>`;
const replacementButtons = `<Button className="w-full sm:w-auto h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => openRequestModal(item)}>Request Food</Button>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => handleReject(item)}>Ignore</Button>`;

code = code.replace(targetButtons, replacementButtons);

const renderEnd = `    </div>
  );
}`;

const replacementRenderEnd = `
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#111113] border-slate-200 dark:border-slate-800 rounded-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">Request Donation</DialogTitle>
                <DialogDescription>
                    Send a request to the restaurant for this food. You can add an optional message.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {selectedDonation && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{selectedDonation.title || 'Assorted Food'}</p>
                        <p className="text-sm text-slate-500">{selectedDonation.quantity_kg} kg • {selectedDonation.estimated_meals} meals</p>
                    </div>
                )}
                <Input 
                    placeholder="Optional message (e.g., We can pick it up in 10 mins)" 
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full h-12"
                />
            </div>
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setRequestModalOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submitRequest}>Send Request</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

code = code.replace(renderEnd, replacementRenderEnd);

// Also fix the top quick actions "Accept Food Donation" button which is a bit ambiguous
const topButtonTarget = `<Button onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })} className="h-16 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all">
              <Check className="w-5 h-5 mr-2" /> Accept Food Donation
          </Button>`;
const topButtonReplacement = `<Button onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })} className="h-16 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all">
              <Check className="w-5 h-5 mr-2" /> Browse Donations
          </Button>`;

code = code.replace(topButtonTarget, topButtonReplacement);

fs.writeFileSync('src/pages/NGODashboard.tsx', code);

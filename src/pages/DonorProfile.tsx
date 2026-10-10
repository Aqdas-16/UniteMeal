import React, { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    Store, AlertCircle, RefreshCw, CheckCircle, 
    ArrowLeft, X, Camera
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { createAuditLog } from '@/lib/notifications';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';
import { LocationEditor } from '../components/dashboard/LocationEditor';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

// Ultra-compact input classes
const inputClass = "h-8 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-[#F8F9F6] dark:bg-[#15171c] px-2.5 text-[12px] text-slate-900 dark:text-white outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-900/50";
const labelClass = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

export function DonorProfile() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        if (profile?.role === 'ngo') navigate('/dashboard/ngo');
        else if (profile?.role === 'admin') navigate('/dashboard/admin');
        else navigate('/dashboard/restaurant');
    };
    
    const { user, profile, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed' | 'unsaved'>('idle');
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [originalData, setOriginalData] = useState<any>(null);

    const [formData, setFormData] = useState({
        business_name: profile?.full_name || '',
        owner_name: '',
        email: user?.email || '',
        phone: '',
        website: '',
        description: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        latitude: '',
        longitude: '',
        place_id: '',
        gst_number: '',
        fssai_number: '',
        verification_status: 'pending',
        profile_image_url: '',
        joined_date: user?.metadata?.creationTime || new Date().toISOString()
    });

    useEffect(() => {
        if (user && !isLoaded) {
            fetchRestaurantData();
        }
    }, [user, isLoaded]);

    const fetchRestaurantData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data: donorData } = await supabase.from('donors').select('*').eq('id', user.uid).maybeSingle();
            const { data: restDataArr } = await supabase.from('restaurants').select('*').eq('user_id', user.uid).order('updated_at', { ascending: false }).limit(1);
            const restData = restDataArr?.[0];

            let newData = { ...formData };
            if (donorData || restData) {
                newData = {
                    ...newData,
                    business_name: restData?.business_name || donorData?.organization_name || formData.business_name,
                    owner_name: restData?.owner_name || '',
                    email: restData?.email || user.email || '',
                    phone: restData?.phone || '',
                    website: restData?.website || '',
                    description: restData?.description || '',
                    address: restData?.address || donorData?.address || '',
                    city: restData?.city || donorData?.city || '',
                    state: restData?.state || donorData?.state || '',
                    pincode: restData?.pincode || donorData?.zip_code || '',
                    country: restData?.country || donorData?.country || '',
                    latitude: restData?.latitude?.toString() || donorData?.location_lat?.toString() || '',
                    longitude: restData?.longitude?.toString() || donorData?.location_lng?.toString() || '',
                    place_id: restData?.place_id || '',
                    gst_number: restData?.gst_number || '',
                    fssai_number: restData?.fssai_number || '',
                    profile_image_url: restData?.profile_image_url || '',
                    verification_status: profile?.verification_status || restData?.verification_status || 'pending' 
                };
            } else {
                newData = {
                    ...newData,
                    email: user.email || '',
                    business_name: profile?.business_name || profile?.full_name || ''
                };
            }
            setFormData(newData);
            setOriginalData(newData);
            setIsLoaded(true);
        } catch (error) {
            console.error('Error fetching restaurant data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
        if (isEditing) {
            setHasChanges(true);
            setSaveStatus('unsaved');
        }
    };

    const handleSave = async (locationOverrides?: any) => {
        const currentData = { ...formData, ...locationOverrides };
        if (!user) return;
        setIsSaving(true);
        setSaveStatus('saving');

        try {
            if (!currentData.business_name || !currentData.address) {
                toast.error('Business Name and Address are required');
                setSaveStatus('failed');
                setIsSaving(false);
                return;
            }

            const updates = {
                business_name: currentData.business_name,
                owner_name: currentData.owner_name,
                email: currentData.email,
                phone: currentData.phone,
                description: currentData.description,
                address: currentData.address,
                city: currentData.city,
                state: currentData.state,
                pincode: currentData.pincode,
                country: currentData.country,
                latitude: currentData.latitude ? parseFloat(currentData.latitude) : null,
                longitude: currentData.longitude ? parseFloat(currentData.longitude) : null,
                profile_image_url: currentData.profile_image_url,
                updated_at: new Date().toISOString(),
                verification_status: currentData.verification_status || 'pending'
            };

            const { data: existingRests, error: checkError } = await supabase.from('restaurants').select('restaurant_id').eq('user_id', user.uid).limit(1);
            if (checkError) throw checkError;
            
            if (existingRests && existingRests.length > 0) {
                const { error: updateError } = await supabase.from('restaurants').update(updates).eq('restaurant_id', existingRests[0].restaurant_id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('restaurants').insert([{ user_id: user.uid, ...updates }]);
                if (insertError) throw insertError;
            }

            const { data: existingDonor } = await supabase.from('donors').select('id').eq('id', user.uid).limit(1);
            if (existingDonor && existingDonor.length > 0) {
                await supabase.from('donors').update({
                    organization_name: currentData.business_name,
                    address: currentData.address,
                    city: currentData.city,
                    state: currentData.state,
                    zip_code: currentData.pincode,
                    country: currentData.country,
                    location_lat: currentData.latitude ? parseFloat(currentData.latitude) : null,
                    location_lng: currentData.longitude ? parseFloat(currentData.longitude) : null 
                }).eq('id', user.uid);
            }

            await createAuditLog({ entityName: 'profiles', entityId: user.uid, action: 'updated', performedBy: user.uid, changes: { source: 'manual' } });
            
            setSaveStatus('saved');
            toast.success('Profile updated successfully');
            setHasChanges(false);
            
            await fetchRestaurantData();
            if (refreshProfile) await refreshProfile();
        } catch (error: any) {
            console.error('Error saving restaurant data:', error);
            setSaveStatus('failed');
            toast.error(error.message || 'Unable to save profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.uid}-${Math.random()}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage.from('restaurants').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('restaurants').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, profile_image_url: data.publicUrl }));
            toast.success("Image uploaded.");
            setHasChanges(true);
            setSaveStatus('unsaved');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload image');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString));
        } catch (e) {
            return 'Recently';
        }
    };

    const renderContent = () => (
        // Viewport locked to prevent scrolling. Tightly packed horizontal design.
        <main className="h-[calc(100dvh-64px)] w-full overflow-hidden bg-[#F8F9F6] dark:bg-[#0f1115] px-4 py-3 sm:px-6 flex flex-col items-center">
            
            <div className="w-full max-w-[1100px] h-full flex flex-col gap-2">
                
                {/* Ultra-compact Header */}
                <div className="flex items-center justify-between shrink-0">
                    <button 
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        {saveStatus === 'saving' && <><RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Saving...</>}
                        {saveStatus === 'saved' && <><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Saved</>}
                        {saveStatus === 'unsaved' && <><AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Unsaved</>}
                        {saveStatus === 'failed' && <><X className="w-3.5 h-3.5 text-red-600" /> Failed</>}
                    </div>
                </div>

                {/* Main Horizontal Rectangle Card */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[220px_1fr_340px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111317] shadow-sm">
                    
                    {/* LEFT PANE: Identity Profile */}
                    <div className="bg-slate-50/50 dark:bg-[#161616] p-4 flex flex-col items-center text-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="relative group w-16 h-16 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden mb-3">
                            {formData.profile_image_url ? (
                                <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Store className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            )}
                            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <Camera className="w-3.5 h-3.5" />
                            </label>
                        </div>
                        
                        <h2 className="text-[13px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight w-full mb-1">
                            {formData.business_name || 'Business Name'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-mono w-full">ID: {user?.uid.substring(0,8).toUpperCase()}</p>
                        
                        <div className="w-full space-y-2.5 mt-5">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                {formData.verification_status === 'verified' ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-none px-2 py-0 text-[9px] uppercase tracking-wider">Verified</Badge>
                                ) : formData.verification_status === 'rejected' ? (
                                    <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 shadow-none px-2 py-0 text-[9px] uppercase tracking-wider">Rejected</Badge>
                                ) : (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 shadow-none px-2 py-0 text-[9px] uppercase tracking-wider">Pending</Badge>
                                )}
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Joined</p>
                                <p className="text-[11px] font-medium text-slate-900 dark:text-slate-300">{formatDate(formData.joined_date)}</p>
                            </div>
                        </div>

                        {/* Save Button pinned to bottom */}
                        <div className="w-full mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || !hasChanges} 
                                className="w-full h-8 rounded-md text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            >
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </div>
                    </div>

                    {/* MIDDLE PANE: Business Details (Compact Form Grid) */}
                    <div className="p-5 flex flex-col overflow-y-auto lg:border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-[12px] font-bold text-slate-900 dark:text-white">Business Details</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Update your contact and public information.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div className="col-span-2">
                                <Label className={labelClass}>Business Name *</Label>
                                <Input id="business_name" value={formData.business_name} onChange={handleChange} disabled={!isEditing || isSaving} className={inputClass} />
                            </div>
                            <div className="col-span-1">
                                <Label className={labelClass}>Owner Name</Label>
                                <Input id="owner_name" value={formData.owner_name} onChange={handleChange} disabled={!isEditing || isSaving} className={inputClass} />
                            </div>
                            <div className="col-span-1">
                                <Label className={labelClass}>Contact Phone</Label>
                                <Input id="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing || isSaving} className={inputClass} />
                            </div>
                            <div className="col-span-2">
                                <Label className={labelClass}>Email Address</Label>
                                <Input id="email" value={formData.email} onChange={handleChange} disabled={!isEditing || isSaving} className={inputClass} />
                            </div>
                            <div className="col-span-2 flex-1 flex flex-col">
                                <Label className={labelClass}>Description</Label>
                                <Textarea id="description" value={formData.description} onChange={handleChange} disabled={!isEditing || isSaving} className={`${inputClass} flex-1 min-h-[64px] py-2 resize-none`} placeholder="Brief description..." />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE: Location Editor */}
                    <div className="p-5 flex flex-col overflow-y-auto bg-[#FAFBF9] dark:bg-[#111317]">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-[12px] font-bold text-slate-900 dark:text-white">Location</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Pickup address for food routing.</p>
                            </div>
                        </div>
                        
                        <div className="flex-1">
                            <LocationEditor 
                                data={{
                                    address: formData.address || '',
                                    city: formData.city || '',
                                    state: formData.state || '',
                                    postal_code: formData.pincode || '',
                                    country: formData.country || '',
                                    latitude: formData.latitude || null,
                                    longitude: formData.longitude || null
                                }}
                                onChange={(updates) => {
                                    const mappedUpdates = { ...updates } as any;
                                    if (mappedUpdates.postal_code !== undefined) {
                                        mappedUpdates.pincode = mappedUpdates.postal_code;
                                        delete mappedUpdates.postal_code;
                                    }
                                    setFormData(prev => ({ ...prev, ...mappedUpdates }));
                                    setHasChanges(true);
                                    setSaveStatus('unsaved');
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );

    return (
        <>
            {API_KEY ? (
                <APIProvider apiKey={API_KEY}>
                    {renderContent()}
                </APIProvider>
            ) : (
                renderContent()
            )}
        </>
    );
}
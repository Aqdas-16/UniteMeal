const fs = require('fs');

const code = `
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Building2, UploadCloud, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { LocationEditor } from '../components/dashboard/LocationEditor';

export function NGOProfile() {
    const navigate = useNavigate();
    const { user, profile, refreshProfile } = useAuth();
    
    const [isEditing, setIsEditing] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    const [formData, setFormData] = useState({
        organization_name: '',
        registration_number: '',
        email: '',
        phone: '',
        website: '',
        description: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        latitude: null as number | null,
        longitude: null as number | null,
        capacity_people: '',
        storage_capacity_kg: '',
        operating_hours: '',
        is_verified: false,
        created_at: '',
        profile_image_url: ''
    });

    const [originalData, setOriginalData] = useState<any>(null);

    useEffect(() => {
        if (!user) return;
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                // Read from profiles for general info (email, etc)
                const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.uid).single();
                
                // Read strictly from ngos for NGO specific info
                let { data: ngo, error: ngoError } = await supabase.from('ngos').select('*').eq('id', user.uid).maybeSingle();
                
                if (!ngo) {
                    // Create default row if missing
                    const newNgo = {
                        id: user.uid,
                        organization_name: prof?.full_name || 'New NGO',
                        is_verified: false
                    };
                    await supabase.from('ngos').insert(newNgo);
                    const { data: createdNgo } = await supabase.from('ngos').select('*').eq('id', user.uid).single();
                    ngo = createdNgo;
                }
                
                const loadedData = {
                    organization_name: ngo?.organization_name || '',
                    registration_number: ngo?.registration_number || '',
                    email: prof?.email || user.email || '',
                    phone: prof?.phone_number || prof?.phone || '',
                    website: ngo?.website || '', // might not be in schema, keep it in UI
                    description: ngo?.mission_statement || '',
                    address: ngo?.address || '',
                    city: ngo?.city || '',
                    state: ngo?.state || '',
                    zip_code: ngo?.zip_code || '',
                    latitude: ngo?.location_lat || null,
                    longitude: ngo?.location_lng || null,
                    capacity_people: ngo?.capacity_people?.toString() || '',
                    storage_capacity_kg: ngo?.storage_capacity_kg?.toString() || '',
                    operating_hours: ngo?.operating_hours || '',
                    is_verified: ngo?.is_verified || false,
                    created_at: ngo?.created_at || new Date().toISOString(),
                    profile_image_url: prof?.avatar_url || ''
                };
                
                setFormData(loadedData);
                setOriginalData(loadedData);
            } catch (error: any) {
                console.error("Error fetching NGO profile:", error);
                toast.error("Failed to load profile.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchProfileData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const updates = {
                organization_name: formData.organization_name,
                registration_number: formData.registration_number,
                mission_statement: formData.description,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip_code: formData.zip_code,
                location_lat: formData.latitude,
                location_lng: formData.longitude,
                operating_hours: formData.operating_hours,
                capacity_people: formData.capacity_people ? parseInt(formData.capacity_people) : null,
                storage_capacity_kg: formData.storage_capacity_kg ? parseFloat(formData.storage_capacity_kg) : null,
                updated_at: new Date().toISOString()
            };
            
            // Upsert into ngos
            const { error: ngoError } = await supabase.from('ngos').upsert({ id: user.uid, ...updates });
            if (ngoError) throw ngoError;
            
            // Update profiles
            const { error: profError } = await supabase.from('profiles').update({
                full_name: formData.organization_name,
                phone_number: formData.phone
            }).eq('id', user.uid);
            
            if (profError) throw profError;
            
            setOriginalData({ ...formData });
            setHasChanges(false);
            toast.success("Profile saved successfully");
            await refreshProfile();
        } catch (error: any) {
            console.error("Error saving profile:", error);
            toast.error(error.message || "Failed to save profile");
        } finally {
            setIsSaving(false);
        }
    };
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Just now';
        try {
            return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString));
        } catch (e) {
            return 'Just now';
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3FAE49]"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col font-sans pb-12">
            <div className="flex-1 max-w-7xl mx-auto w-full">
                <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">NGO Profile</h1>
                        <p className="text-slate-500 mt-1">Manage your organization details and settings.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* LEFT PANEL */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#161618] rounded-xl flex flex-col items-center p-6 sm:p-8 flex-1">
                            <div className="relative group/avatar mb-4 md:mb-6">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover/avatar:scale-105">
                                    {formData.profile_image_url ? (
                                        <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-slate-400" />
                                    )}
                                </div>
                            </div>
                            
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center line-clamp-2 leading-tight">
                                {formData.organization_name || 'Organization Name'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 mb-6 text-center">ID: {user?.uid.substring(0,8).toUpperCase()}</p>
                            
                            <div className="w-full space-y-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Status</span>
                                    {formData.is_verified ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">🟢 Verified NGO</Badge>
                                    ) : (
                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">🟡 Verification Pending</Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Member Since</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{formatDate(formData.created_at)}</span>
                                </div>
                                
                                <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="w-full h-10 rounded-md font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 mt-6">
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#161618] rounded-xl flex-1">
                            <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Organization Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Organization Name *</Label>
                                        <Input id="organization_name" value={formData.organization_name} onChange={handleChange} disabled={!isEditing || isSaving} className="h-9 text-sm bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 disabled:opacity-90 disabled:text-slate-700 dark:disabled:text-slate-300 rounded-md" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Registration Number</Label>
                                        <Input id="registration_number" value={formData.registration_number} onChange={handleChange} disabled={!isEditing || isSaving} className="h-9 text-sm bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 disabled:opacity-90 disabled:text-slate-700 dark:disabled:text-slate-300 rounded-md" />
                                    </div>
                                    
                                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Address</Label>
                                        <Input id="email" value={formData.email} onChange={handleChange} disabled={!isEditing || isSaving} className="h-9 text-sm bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 disabled:opacity-90 disabled:text-slate-700 dark:disabled:text-slate-300 rounded-md" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Contact Phone</Label>
                                        <Input id="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing || isSaving} className="h-9 text-sm bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 disabled:opacity-90 disabled:text-slate-700 dark:disabled:text-slate-300 rounded-md" />
                                    </div>

                                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Operating Hours</Label>
                                        <Input id="operating_hours" placeholder="e.g. 09:00 AM - 05:00 PM" value={formData.operating_hours} onChange={handleChange} disabled={!isEditing || isSaving} className="h-9 text-sm bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 disabled:opacity-90 disabled:text-slate-700 dark:disabled:text-slate-300 rounded-md" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Storage Capacity (kg)</Label>
                                        <Input id="storage_capacity_kg" type="number" value={formData.storage_capacity_kg} onChange={handleChange} disabled={!isEditing || isSaving} className="h-9 text-sm bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 disabled:opacity-90 disabled:text-slate-700 dark:disabled:text-slate-300 rounded-md" />
                                    </div>

                                    <div className="col-span-2 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Mission Statement / Description</Label>
                                        <Textarea id="description" value={formData.description} onChange={handleChange} disabled={!isEditing || isSaving} className="min-h-[80px] text-sm bg-white dark:bg-[#161618] border-slate-200 dark:border-slate-700 resize-none disabled:opacity-90 disabled:text-slate-700 dark:disabled:text-slate-300 rounded-md" />
                                    </div>
                                    
                                    <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Location details</h3>
                                        <LocationEditor 
                                            data={{
                                                address: formData.address || '',
                                                city: formData.city || '',
                                                state: formData.state || '',
                                                postal_code: formData.zip_code || '',
                                                latitude: formData.latitude || null,
                                                longitude: formData.longitude || null
                                            }}
                                            onChange={(updates) => {
                                                const mappedUpdates = { ...updates } as any;
                                                if (mappedUpdates.postal_code !== undefined) {
                                                    mappedUpdates.zip_code = mappedUpdates.postal_code;
                                                    delete mappedUpdates.postal_code;
                                                }
                                                setFormData(prev => ({ ...prev, ...mappedUpdates }));
                                                setHasChanges(true);
                                            }}
                                            disabled={!isEditing || isSaving}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
`;
fs.writeFileSync('src/pages/NGOProfile.tsx', code);

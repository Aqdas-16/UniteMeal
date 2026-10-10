import React, { useState, useEffect } from 'react';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    ArrowLeft, Sun, Bell, Shield, KeyRound, 
    LogOut, CheckCircle2, Loader2, Heart, Globe2
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/theme-provider';

export function SettingsPage() {
    const { user, profile } = useAuth();
    const { setTheme } = useTheme();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

    const [formData, setFormData] = useState({
        notif_email: true,
        notif_push: true,
        notif_donation_request: true,
        auto_accept_ngo: false,
        language: 'en',
        timezone: 'UTC',
        default_food_category: 'Cooked',
        default_visibility: 'public',
    });

    useEffect(() => {
        // Enforce light mode on this page
        setTheme('light');
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: profileData } = await supabase.from('profiles').select('settings').eq('id', user.uid).single();
            if (profileData?.settings) {
                setFormData(prev => ({ ...prev, ...profileData.settings }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !hasChanges) return;
        setIsSaving(true);
        setSaveStatus('saving');
        try {
            const { error } = await supabase.from('profiles').update({ settings: formData }).eq('id', user.uid);
            if (error) throw error;
            
            setHasChanges(false);
            setSaveStatus('saved');
            toast.success('Settings updated successfully');
            
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save settings');
            setSaveStatus('idle');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaveStatus('idle');
    };

    const handleBack = () => {
        if (profile?.role === 'ngo') navigate('/dashboard/ngo');
        else if (profile?.role === 'admin') navigate('/dashboard/admin');
        else navigate('/dashboard/restaurant');
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast.success('Password reset email sent');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset email');
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center items-center min-h-[calc(100dvh-64px)]"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-emerald-100">
            
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={handleBack} className="h-8 px-3 text-[12px] font-medium text-slate-600 hover:bg-slate-100">
                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                        </Button>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                        <h1 className="text-[13px] font-semibold text-slate-900 hidden sm:block">App Settings</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {saveStatus === 'saved' && !hasChanges && (
                            <span className="hidden sm:flex items-center text-[12px] font-medium text-emerald-600 animate-in fade-in">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Saved
                            </span>
                        )}
                        <Button 
                            onClick={handleSave} 
                            disabled={!hasChanges || isSaving}
                            className="h-8 text-[12px] font-semibold bg-slate-900 hover:bg-slate-800 text-white px-5 transition-all shadow-sm"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
                    <p className="text-[13px] text-slate-500">Manage your application preferences and account security.</p>
                </div>

                <div className="space-y-8 divide-y divide-slate-200">
                    
                    {/* 1. Appearance */}
                    <section className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 pt-6 first:pt-0">
                        <div>
                            <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                                <Sun className="w-4 h-4 text-amber-500" /> Appearance
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-1">Customize the theme of your dashboard.</p>
                        </div>
                        <div>
                            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-1.5 flex max-w-[200px]">
                                <button
                                    disabled
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[12px] font-medium bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/50 cursor-default"
                                >
                                    <Sun className="w-3.5 h-3.5" />
                                    <span>Light Mode</span>
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 ml-1">Currently optimized for Light mode viewing.</p>
                        </div>
                    </section>

                    {/* 2. Donation Defaults */}
                    <section className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 pt-8">
                        <div>
                            <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                                <Heart className="w-4 h-4 text-rose-500" /> Donation Defaults
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-1">Set default values for new food listings.</p>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Default Category</Label>
                                    <Select value={formData.default_food_category} onValueChange={(val) => handleChange('default_food_category', val)}>
                                        <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[12px]">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORY_OPTIONS.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-[12px]">{cat.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Default Visibility</Label>
                                    <Select value={formData.default_visibility} onValueChange={(val) => handleChange('default_visibility', val)}>
                                        <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[12px]">
                                            <SelectValue placeholder="Select visibility" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public" className="text-[12px]">Public (All verified NGOs)</SelectItem>
                                            <SelectItem value="private" className="text-[12px]">Private (Invite only)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Notifications */}
                    <section className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 pt-8">
                        <div>
                            <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                                <Bell className="w-4 h-4 text-emerald-500" /> Notifications
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-1">Configure how you receive updates and alerts.</p>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-lg divide-y divide-slate-100">
                            {[
                                { id: 'notif_email', label: 'Email Notifications', desc: 'Receive daily digests and critical alerts.' },
                                { id: 'notif_push', label: 'Push Notifications', desc: 'Immediate browser alerts for active deliveries.' },
                                { id: 'notif_donation_request', label: 'Donation Updates', desc: 'Alerts when NGOs request your food.' },
                                { id: 'auto_accept_ngo', label: 'Auto-Accept NGOs', desc: 'Automatically accept requests from trusted partners.' }
                            ].map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="pr-4">
                                        <Label className="text-[13px] font-medium text-slate-900 cursor-pointer" htmlFor={item.id}>{item.label}</Label>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                                    </div>
                                    <Switch id={item.id} checked={(formData as any)[item.id] || false} onCheckedChange={(val) => handleChange(item.id, val)} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. Regional */}
                    <section className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 pt-8">
                        <div>
                            <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                                <Globe2 className="w-4 h-4 text-blue-500" /> Regional Settings
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-1">Set your language and timezone.</p>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Language</Label>
                                    <Select value={formData.language} onValueChange={(val) => handleChange('language', val)}>
                                        <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[12px]">
                                            <SelectValue placeholder="Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en" className="text-[12px]">English (US)</SelectItem>
                                            <SelectItem value="en-gb" className="text-[12px]">English (UK)</SelectItem>
                                            <SelectItem value="hi" className="text-[12px]">Hindi (हिंदी)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Timezone</Label>
                                    <Select value={formData.timezone} onValueChange={(val) => handleChange('timezone', val)}>
                                        <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[12px]">
                                            <SelectValue placeholder="Timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Asia/Kolkata" className="text-[12px]">IST (Asia/Kolkata)</SelectItem>
                                            <SelectItem value="UTC" className="text-[12px]">UTC</SelectItem>
                                            <SelectItem value="America/New_York" className="text-[12px]">EST (New York)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 5. Security */}
                    <section className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 pt-8 pb-8">
                        <div>
                            <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-amber-500" /> Security
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-1">Manage passwords and active sessions.</p>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-lg divide-y divide-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="text-[13px] font-medium text-slate-900 flex items-center gap-2"><KeyRound className="w-4 h-4 text-slate-400" /> Password</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Receive a secure link to reset your password.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handlePasswordReset} className="h-8 text-[12px] bg-transparent border-slate-200 w-full sm:w-auto">
                                    Change Password
                                </Button>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                                <div>
                                    <p className="text-[13px] font-medium text-slate-900 flex items-center gap-2"><LogOut className="w-4 h-4 text-slate-400" /> Active Sessions</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Log out of all other active browser sessions.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => toast.success("Logged out of all other devices.")} className="h-8 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 w-full sm:w-auto">
                                    Logout all devices
                                </Button>
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
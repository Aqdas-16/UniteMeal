const fs = require('fs');

const fileContent = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  CheckCircle2, Clock, MapPin, Box, ImagePlus, X,
  Utensils, Apple, Coffee, CupSoda, Wheat, Search, Navigation2,
  ArrowRight, ArrowLeft, Loader2, PartyPopper, Check
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { AddressAutocompleteInput } from '@/components/ui/AddressAutocomplete';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createNotification, createAuditLog } from '@/lib/notifications';
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && !API_KEY.includes('YOUR_');

const CATEGORIES = [
  { id: 'cooked_food', icon: <Utensils className="w-5 h-5 text-emerald-600" />, title: 'Cooked Meals', desc: 'Prepared & hot meals' },
  { id: 'fresh_produce', icon: <Apple className="w-5 h-5 text-emerald-600" />, title: 'Fresh Produce', desc: 'Raw veg & fruits' },
  { id: 'packaged_food', icon: <Box className="w-5 h-5 text-emerald-600" />, title: 'Packaged Food', desc: 'Sealed & canned' },
  { id: 'bakery', icon: <Wheat className="w-5 h-5 text-emerald-600" />, title: 'Bakery', desc: 'Breads & pastries' },
  { id: 'dairy', icon: <Coffee className="w-5 h-5 text-emerald-600" />, title: 'Dairy', desc: 'Milk, cheese' },
  { id: 'beverage', icon: <CupSoda className="w-5 h-5 text-emerald-600" />, title: 'Beverages', desc: 'Drinks & juices' },
];

const DIETARY_TYPES = ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Halal', 'Jain', 'Gluten Free', 'Mixed'];
const UNITS = ['Kg', 'Meals', 'Boxes', 'Packets', 'Containers'];
const TIME_OPTIONS = [
  { label: 'Now', val: 0 },
  { label: '30 min', val: 30 },
  { label: '1 hour', val: 60 },
  { label: '2 hours', val: 120 }
];

export function CreateDonationContent() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'cooked_food',
    quantity: 5,
    unit: 'Kg',
    dietary: [] as string[],
    estimated_meals: '',
    address: '',
    pin_lat: 19.0760,
    pin_lng: 72.8777,
    ready_in: 30
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const loadDonorProfile = async () => {
        const { data } = await supabase.from('donors').select('address, location_lat, location_lng').eq('id', user.uid).maybeSingle();
        if (data && data.address) {
          setFormData(prev => ({
            ...prev,
            address: data.address,
            pin_lat: data.location_lat || prev.pin_lat,
            pin_lng: data.location_lng || prev.pin_lng
          }));
        }
      };
      loadDonorProfile();
    }
  }, [user]);

  const getCalculatedMeals = () => {
    if (formData.estimated_meals) return parseInt(formData.estimated_meals);
    if (formData.unit === 'Kg') return Math.round(formData.quantity * 4);
    if (formData.unit === 'Meals') return formData.quantity;
    return Math.round(formData.quantity * 2);
  };

  const handleUseMyAddress = async () => {
    if (!user) return;
    const { data } = await supabase.from('donors').select('address, location_lat, location_lng').eq('id', user.uid).maybeSingle();
    if (data && data.address) {
      setFormData(prev => ({ ...prev, address: data.address, pin_lat: data.location_lat || prev.pin_lat, pin_lng: data.location_lng || prev.pin_lng }));
      toast.success("Address loaded");
    } else {
      toast.error("No saved address found.");
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelection = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Max 10MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!formData.title) { toast.error("Please enter food name"); setStep(1); return; }
    if (!formData.address) { toast.error("Please select pickup address"); setStep(2); return; }

    setIsSubmitting(true);
    try {
      if (user) {
        const { data: existingDonor } = await supabase.from('donors').select('id').eq('id', user.uid).maybeSingle();
        if (!existingDonor) {
          await supabase.from('donors').insert({
            id: user.uid,
            donor_type: 'restaurant',
            organization_name: profile?.business_name || profile?.full_name || 'Unknown Restaurant',
            address: formData.address,
            location_lat: formData.pin_lat,
            location_lng: formData.pin_lng
          });
        }
      }

      const donationData = {
        title: formData.title,
        food_category: formData.category,
        quantity_kg: formData.unit === 'Kg' ? formData.quantity : (formData.quantity * 0.25), 
        estimated_meals: getCalculatedMeals(),
        donor_id: user?.uid || 'unknown',
        status: 'available',
        expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pickup_address: formData.address,
        pickup_lat: formData.pin_lat,
        pickup_lng: formData.pin_lng
      };

      const { data: newDoc, error: insertError } = await supabase.from('donations').insert(donationData).select().single();
      if (insertError) throw insertError;

      if (imageFile && newDoc?.id) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = \`\${newDoc.id}-\${Date.now()}.\${fileExt}\`;
        const filePath = \`\${user?.uid}/\${fileName}\`;
        const { error: uploadError } = await supabase.storage.from('donation-images').upload(filePath, imageFile);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('donation-images').getPublicUrl(filePath);
          await supabase.from('donation_images').insert({
            donation_id: newDoc.id,
            image_url: publicUrlData.publicUrl,
            file_name: imageFile.name,
            file_size: imageFile.size,
            mime_type: imageFile.type
          });
        }
      }

      if (user?.uid && newDoc?.id) {
        await createNotification({
          userId: user.uid, type: 'general', title: 'Donation Created',
          message: \`Donation "\${formData.title}" published.\`, relatedEntityType: 'donation', relatedEntityId: newDoc.id, priority: 'normal', actionUrl: '/dashboard/donor/active'
        });
        await createAuditLog({ entityName: 'donations', entityId: newDoc.id, action: 'created', performedBy: user.uid });
      }

      setSuccessData({ id: newDoc?.id?.split('-')[0].toUpperCase(), meals: getCalculatedMeals() });
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create donation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.title) return toast.error("Please enter a food name.");
    if (step === 2 && !formData.address) return toast.error("Please provide a pickup address.");
    setStep(prev => Math.min(prev + 1, 4));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (isSuccess) {
    return (
      <div className="max-w-[1050px] mx-auto mt-12 bg-white dark:bg-[#111113] p-12 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
            <PartyPopper className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Donation Published</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 text-sm">
          Your food is now visible to nearby NGOs. Volunteers will be notified shortly.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-md mx-auto">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">ID</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{successData?.id || 'DON-X9'}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider mb-1">Meals</p>
            <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">~{successData?.meals || 0}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider mb-1">CO₂ Saved</p>
            <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">{Math.round((successData?.meals || 0) * 1.5)} kg</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/dashboard/donor/active')} className="w-full sm:w-auto h-11 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-medium shadow-none">
            Track Delivery
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setIsSuccess(false); setStep(1); setFormData({...formData, title: ''}); setImageFile(null); setImagePreview(null); }} className="w-full sm:w-auto h-11 px-6 rounded-lg text-sm font-medium border-slate-200 dark:border-slate-700 shadow-none">
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Details', desc: 'Food info' },
    { num: 2, title: 'Pickup', desc: 'Location' },
    { num: 3, title: 'Photo', desc: 'Verification' },
    { num: 4, title: 'Review', desc: 'Publish' }
  ];

  const content = (
    <div className="max-w-[1050px] mx-auto py-6 px-4 sm:px-6">
      {/* HEADER */}
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          🍽️ Create Food Donation
        </h1>
        <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-sm">
          <Clock className="w-3.5 h-3.5" /> <span>About 2 minutes</span>
        </div>
      </div>

      {/* STEP PROGRESS - 80px tall */}
      <div className="mb-10 max-w-2xl mx-auto h-[80px] relative flex items-center">
        <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-100 dark:bg-slate-800 -z-10" />
        <motion.div 
          className="absolute top-5 left-10 h-[2px] bg-emerald-500 -z-10 transition-all duration-500 ease-in-out" 
          style={{ width: \`\${((step - 1) / 3) * 100}%\`, right: '2.5rem' }} 
        />
        <div className="flex justify-between w-full relative z-10">
          {steps.map(s => {
            const isActive = step === s.num;
            const isPassed = step > s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-2 w-20">
                <div className={\`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 \${isActive ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-900/20' : isPassed ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400'}\`}>
                  {isPassed ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <div className="text-center">
                  <p className={\`text-[13px] font-medium transition-colors \${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}\`}>{s.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FORM SECTIONS */}
      <div className="max-w-2xl mx-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* STEP 1: FOOD DETAILS */}
            {step === 1 && (
              <>
                <div className="bg-white dark:bg-[#111113] rounded-[14px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Food Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Chicken Biryani, Vegetable Rice..." 
                      className="pl-10 h-12 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111113] rounded-[14px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Category</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map(cat => (
                      <div 
                        key={cat.id}
                        onClick={() => setFormData({...formData, category: cat.id})}
                        className={\`p-3 rounded-xl cursor-pointer transition-all duration-200 border flex flex-col justify-center h-[90px] \${formData.category === cat.id ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-sm ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'}\`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {cat.icon}
                          <span className="font-medium text-slate-900 dark:text-white text-[13px]">{cat.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight">{cat.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111113] rounded-[14px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Quantity</Label>
                    <div className="flex items-center h-11 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 max-w-[240px]">
                      <button onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})} className="w-10 h-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 font-medium">-</button>
                      <div className="flex-1 text-center font-semibold text-slate-900 dark:text-white text-sm">{formData.quantity}</div>
                      <button onClick={() => setFormData({...formData, quantity: formData.quantity + 1})} className="w-10 h-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 font-medium">+</button>
                      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700" />
                      <select 
                        value={formData.unit} 
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="h-full bg-transparent pl-3 pr-6 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-0 cursor-pointer appearance-none"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex-1">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Est. Meals</Label>
                    <div className="relative h-11">
                      <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      <Input 
                        type="number"
                        value={formData.estimated_meals}
                        onChange={(e) => setFormData({...formData, estimated_meals: e.target.value})}
                        placeholder={\`Approx \${getCalculatedMeals()}\`}
                        className="pl-9 h-full rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-emerald-500 placeholder:text-slate-400 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111113] rounded-[14px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Dietary Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_TYPES.map(type => {
                      const isSelected = formData.dietary.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            const newTypes = isSelected 
                              ? formData.dietary.filter(t => t !== type)
                              : [...formData.dietary, type];
                            setFormData({...formData, dietary: newTypes});
                          }}
                          className={\`px-4 h-8 rounded-full text-[13px] font-medium transition-all duration-200 border \${isSelected ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'}\`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: PICKUP */}
            {step === 2 && (
              <div className="bg-white dark:bg-[#111113] rounded-[14px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pickup Location</Label>
                    <button onClick={handleUseMyAddress} className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50/50 px-2.5 py-1 rounded-md transition-colors">
                      <Navigation2 className="w-3.5 h-3.5" /> Use My Address
                    </button>
                  </div>
                  <AddressAutocompleteInput 
                    value={formData.address}
                    onChange={(val) => setFormData({...formData, address: val})}
                    onPlaceSelect={(place) => setFormData({
                      ...formData, 
                      address: place.formattedAddress || place.displayName, 
                      pin_lat: place.location.lat(), 
                      pin_lng: place.location.lng()
                    })}
                    className="h-12 text-sm rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 px-4"
                  />
                </div>

                <div className="h-[240px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
                  {hasValidKey ? (
                    <GoogleMap 
                      defaultZoom={15} 
                      defaultCenter={{ lat: formData.pin_lat, lng: formData.pin_lng }}
                      center={{ lat: formData.pin_lat, lng: formData.pin_lng }}
                      mapId="pickup-map"
                      disableDefaultUI
                    >
                      <AdvancedMarker position={{ lat: formData.pin_lat, lng: formData.pin_lng }}>
                        <div className="bg-emerald-600 w-8 h-8 rounded-full flex items-center justify-center shadow-md border-[3px] border-white dark:border-slate-900">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                      </AdvancedMarker>
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center flex-col gap-2">
                      <MapPin className="w-6 h-6 text-slate-400" />
                      <span className="text-slate-500 text-sm font-medium">Map view unavailable</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[12px] font-medium text-slate-700 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Volunteer ETA: 15-30m
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Ready for pickup in</Label>
                  <div className="flex gap-2">
                    {TIME_OPTIONS.map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setFormData({...formData, ready_in: opt.val})}
                        className={\`flex-1 h-11 rounded-lg text-[13px] font-medium transition-all duration-200 border \${formData.ready_in === opt.val ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'}\`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFICATION */}
            {step === 3 && (
              <div className="bg-white dark:bg-[#111113] rounded-[14px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                <Label className="text-lg font-medium text-slate-900 dark:text-white block mb-1">Upload Photo</Label>
                <p className="text-slate-500 text-sm mb-6">Verify quality and packaging for NGOs.</p>

                <div 
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group max-w-sm mx-auto"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => { if (e.target.files) handleFileSelection(e.target.files[0]); }} />
                  
                  {imagePreview ? (
                    <div className="relative w-full rounded-lg overflow-hidden shadow-sm group-hover:scale-[1.01] transition-transform">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-md backdrop-blur transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-500">
                        <ImagePlus className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Click or drag image</h3>
                      <p className="text-[12px] text-slate-500">JPG, PNG, WEBP (Max 10MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <div className="bg-white dark:bg-[#111113] rounded-[14px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                  {/* Left Column */}
                  <div className="p-6 space-y-6">
                    <div className="aspect-video w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700/50">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Food" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <ImagePlus className="w-6 h-6 mb-2 opacity-60" />
                          <span className="text-sm font-medium">No photo provided</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{formData.title}</h3>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-sm font-medium">
                        <Box className="w-4 h-4 text-emerald-600" />
                        {formData.quantity} {formData.unit}
                        <span className="text-slate-300 dark:text-slate-600 mx-1">•</span>
                        {CATEGORIES.find(c => c.id === formData.category)?.title}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="p-6 flex flex-col justify-between">
                    <div className="space-y-5">
                      <div>
                        <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pickup Location</Label>
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug">{formData.address}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Est. Meals</Label>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">~{getCalculatedMeals()}</span>
                         </div>
                         <div>
                          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Ready In</Label>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">{formData.ready_in === 0 ? 'Now' : formData.ready_in + ' min'}</span>
                         </div>
                         <div>
                          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">CO₂ Saved</Label>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">{Math.round(getCalculatedMeals() * 1.5)} kg</span>
                         </div>
                         <div>
                          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 block">Expiry</Label>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">24 hours</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* STICKY FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-[#111113]/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 p-4">
        <div className="max-w-[1050px] mx-auto flex justify-between items-center px-2 sm:px-6">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={\`h-11 px-4 rounded-lg font-medium text-sm \${step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}\`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {step < 4 ? (
            <Button 
              onClick={nextStep} 
              className="h-11 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-medium text-sm shadow-sm transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="h-11 px-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all flex items-center"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
              ) : (
                <>Publish Donation <CheckCircle2 className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return hasValidKey ? <APIProvider apiKey={API_KEY}>{content}</APIProvider> : content;
}
`;

fs.writeFileSync('components/dashboard/CreateDonation.tsx', fileContent);

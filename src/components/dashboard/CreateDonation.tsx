import React, { useState, useEffect, useRef } from 'react';

import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';

import {

  CheckCircle2,

  Clock,

  MapPin,

  ImagePlus,

  Search,

  ArrowLeft,

  Loader2,

  PartyPopper,

  Utensils,

  X,

} from 'lucide-react';



import { CATEGORY_OPTIONS as CATEGORIES } from '@/lib/constants';

import { useAuth } from '@/components/auth/AuthContext';

import { supabase } from '@/lib/supabase';

import { AddressAutocompleteInput } from '@/components/ui/AddressAutocomplete';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Button } from '@/components/ui/button';

import { PageHeader } from '@/components/ui/PageHeader';

import {

  createNotification,

  createAuditLog,

} from '@/lib/notifications';



const DIETARY_TYPES = [

  'Veg',

  'Non-Veg',

  'Egg',

  'Vegan',

  'Jain',

  'Other',

];



const UNITS = ['Kg', 'Gram', 'Packets', 'Boxes', 'Meals'];



const TIME_OPTIONS = [

  { label: 'Now', val: 0 },

  { label: '30 min', val: 30 },

  { label: '1 hour', val: 60 },

  { label: '2 hours', val: 120 },

];



const EXPIRY_OPTIONS = [

  { label: '2 hours', value: '2' },

  { label: '4 hours', value: '4' },

  { label: '6 hours', value: '6' },

  { label: '12 hours', value: '12' },

  { label: '24 hours', value: '24' },

  { label: '48 hours', value: '48' },

  { label: '72 hours', value: '72' },

];



const inputClass =
  'h-9 w-full rounded-lg border border-[#DDE5DD] bg-[#F8F9F6] px-3 text-[12px] text-[#1F2937] shadow-none outline-none transition placeholder:text-[#89938C] focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/15 dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-100 dark:focus:border-emerald-500';

const labelClass =

  'mb-1 block text-[10px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400';



const cardClass =
  'rounded-xl border border-[#E1E7E1] bg-white dark:border-slate-800 dark:bg-[#111317]';

const fileToBase64 = (file: File): Promise<string> =>

  new Promise((resolve, reject) => {

    const reader = new FileReader();



    reader.readAsDataURL(file);



    reader.onload = () => {

      const result = reader.result as string;

      resolve(result.split(',')[1]);

    };



    reader.onerror = reject;

  });



export function CreateDonationContent() {

  const { user, profile } = useAuth();

  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);



  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  const [successData, setSuccessData] = useState<any>(null);



  const [useRestaurantAddress, setUseRestaurantAddress] =

    useState(true);



  const [touched, setTouched] = useState<Record<string, boolean>>({});



  const [formData, setFormData] = useState({

    title: '',

    category: 'Cooked',

    quantity: 5,

    unit: 'Kg',

    dietary: [] as string[],

    estimated_meals: '',

    expiry: '24',

    notes: '',

    address: '',

    pin_lat: 19.076,

    pin_lng: 72.8777,

    ready_in: 30,

    instructions: '',

  });



  const [imageFile, setImageFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);



  const updateForm = (updates: Partial<typeof formData>) => {

    setFormData((prev) => ({ ...prev, ...updates }));

  };



  const getErrors = () => {

    const errors: Record<string, string> = {};



    if (formData.title.trim().length < 2) {

      errors.title = 'Enter a food name with at least 2 characters.';

    }



    if (formData.dietary.length === 0) {

      errors.dietary = 'Select a food type.';

    }



    if (!formData.category) {

      errors.category = 'Select a food category.';

    }



    if (!Number.isFinite(formData.quantity) || formData.quantity < 1) {

      errors.quantity = 'Quantity must be at least 1.';

    }



    if (!formData.address.trim()) {

      errors.address = 'Provide a pickup address.';

    }



    const expiry = Number(formData.expiry);



    if (!Number.isFinite(expiry) || expiry < 1 || expiry > 72) {

      errors.expiry = 'Expiry must be between 1 and 72 hours.';

    }



    return errors;

  };



  const errors = getErrors();



  const getPlaceholderImage = (category: string) => {

    switch (category) {

      case 'Cooked':

        return 'https\://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85';

      case 'Produce':

        return 'https\://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85';

      case 'Packaged':

        return 'https\://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=1200&q=85';

      case 'Bakery':

        return 'https\://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85';

      case 'Dairy':

        return 'https\://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=85';

      case 'Beverage':

        return 'https\://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=85';

      default:

        return 'https\://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85';

    }

  };



  const getCalculatedMeals = () => {

    if (formData.estimated_meals.trim()) {

      const enteredMeals = Number.parseInt(formData.estimated_meals, 10);



      if (Number.isFinite(enteredMeals) && enteredMeals >= 0) {

        return enteredMeals;

      }

    }



    if (formData.unit === 'Kg') {

      return Math.round(formData.quantity * 4);

    }



    if (formData.unit === 'Gram') {

      return Math.max(1, Math.round(formData.quantity * 0.004));

    }



    if (formData.unit === 'Meals') {

      return formData.quantity;

    }



    return Math.round(formData.quantity * 2);

  };



  const getDonationQuantityKg = () => {

    if (formData.unit === 'Kg') return formData.quantity;

    if (formData.unit === 'Gram') return formData.quantity / 1000;



    // Approximate conversion for non-weight units.

    return formData.quantity * 0.25;

  };



  const handleFileSelection = (file?: File) => {

    if (!file) return;



    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {

      toast.error('Upload a JPG, PNG, or WEBP image.');

      return;

    }



    if (file.size > 10 * 1024 * 1024) {

      toast.error('Image size must be 10 MB or less.');

      return;

    }



    setImageFile(file);

    setImagePreview(URL.createObjectURL(file));

  };



  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    handleFileSelection(e.dataTransfer.files?.[0]);

  };



  const handleUseMyAddress = async () => {

    if (!user) return;



    const { data: restaurantData, error: restaurantError } =

      await supabase

        .from('restaurants')

        .select('address, latitude, longitude')

        .eq('user_id', user.uid)

        .maybeSingle();



    if (restaurantError) {

      console.error(restaurantError);

    }



    if (restaurantData?.address) {

      updateForm({

        address: restaurantData.address,

        pin_lat: restaurantData.latitude || formData.pin_lat,

        pin_lng: restaurantData.longitude || formData.pin_lng,

      });



      toast.success('Restaurant address loaded.');

      return;

    }



    const { data: donorData, error: donorError } = await supabase

      .from('donors')

      .select('address, location_lat, location_lng')

      .eq('id', user.uid)

      .maybeSingle();



    if (donorError) {

      console.error(donorError);

    }



    if (donorData?.address) {

      updateForm({

        address: donorData.address,

        pin_lat: donorData.location_lat || formData.pin_lat,

        pin_lng: donorData.location_lng || formData.pin_lng,

      });



      toast.success('Saved address loaded.');

    } else {

      toast.error('No saved restaurant address found.');

    }

  };



  useEffect(() => {

    if (!user) return;



    let cancelled = false;



    const loadDonorProfile = async () => {

      const { data: restaurantData } = await supabase

        .from('restaurants')

        .select('address, latitude, longitude')

        .eq('user_id', user.uid)

        .maybeSingle();



      if (cancelled) return;



      if (restaurantData?.address) {

        setFormData((prev) => ({

          ...prev,

          address: restaurantData.address,

          pin_lat: restaurantData.latitude || prev.pin_lat,

          pin_lng: restaurantData.longitude || prev.pin_lng,

        }));



        return;

      }



      const { data: donorData } = await supabase

        .from('donors')

        .select('address, location_lat, location_lng')

        .eq('id', user.uid)

        .maybeSingle();



      if (cancelled) return;



      if (donorData?.address) {

        setFormData((prev) => ({

          ...prev,

          address: donorData.address,

          pin_lat: donorData.location_lat || prev.pin_lat,

          pin_lng: donorData.location_lng || prev.pin_lng,

        }));

      }

    };



    loadDonorProfile();



    return () => {

      cancelled = true;

    };

  }, [user]);

  const handleSubmit = async () => {

    setTouched({

      title: true,

      dietary: true,

      category: true,

      quantity: true,

      address: true,

      expiry: true,

    });



    const currentErrors = getErrors();



    if (Object.keys(currentErrors).length > 0) {

      toast.error('Please correct the highlighted fields.');

      return;

    }



    setIsSubmitting(true);



    try {

      if (user) {

        const { data: existingDonor, error: donorCheckError } =

          await supabase

            .from('donors')

            .select('id')

            .eq('id', user.uid)

            .maybeSingle();



        if (donorCheckError) throw donorCheckError;



        if (!existingDonor) {

          const { error: donorInsertError } = await supabase

            .from('donors')

            .insert({

              id: user.uid,

              donor_type: 'restaurant',

              organization_name:

                profile?.business_name ||

                profile?.full_name ||

                'Unknown Restaurant',

              address: formData.address,

              location_lat: formData.pin_lat,

              location_lng: formData.pin_lng,

            });



          if (donorInsertError) throw donorInsertError;

        }

      }



      const donationData = {

        title: formData.title.trim(),

        food_category: formData.category,

        quantity_kg: getDonationQuantityKg(),

        estimated_meals: getCalculatedMeals(),

        donor_id: user?.uid || 'unknown',

        status: 'available',

        expiry_time: new Date(

          Date.now() + Number(formData.expiry) * 60 * 60 * 1000

        ).toISOString(),

        pickup_address: formData.address,

        pickup_lat: formData.pin_lat,

        pickup_lng: formData.pin_lng,

        restaurant_id: user?.uid || 'unknown',

        dietary_restrictions: formData.dietary.join(', '),

      };



      const { data: newDoc, error: insertError } = await supabase

        .from('donations')

        .insert(donationData)

        .select()

        .single();



      if (insertError) throw insertError;



      if (imageFile && newDoc?.id) {

        const fileExt = imageFile.name.split('.').pop() || 'jpg';

        const fileName = `${newDoc.id}-${Date.now()}.${fileExt}`;

        const filePath = `${user?.uid || 'unknown'}/${fileName}`;



        const { error: uploadError } = await supabase.storage

          .from('donation-images')

          .upload(filePath, imageFile);



        if (uploadError) {

          console.error('Image upload failed:', uploadError);

          toast.warning('Donation published, but image upload failed.');

        } else {

          const { data: publicUrlData } = supabase.storage

            .from('donation-images')

            .getPublicUrl(filePath);



          const { error: imageRecordError } = await supabase

            .from('donation_images')

            .insert({

              donation_id: newDoc.id,

              image_url: publicUrlData.publicUrl,

              file_name: imageFile.name,

              file_size: imageFile.size,

              mime_type: imageFile.type,

            });



          if (imageRecordError) {

            console.error('Image record insert failed:', imageRecordError);

          }



          // Optional AI vision analysis. Donation creation does not depend on it.

          try {

            const base64Image = await fileToBase64(imageFile);



            const aiResponse = await fetch('/api/ai/vision-verify', {

              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({

                imageBase64: base64Image,

                mimeType: imageFile.type,

              }),

            });



            if (aiResponse.ok) {

              const aiData = await aiResponse.json();



              if (aiData?.result) {

                const result = aiData.result;



                const { error: assessmentError } = await supabase

                  .from('food_quality_assessments')

                  .insert({

                    donation_id: newDoc.id,

                    food_name: result.foodName,

                    food_category: result.foodCategory,

                    freshness_score: result.freshnessScore,

                    spoilage_risk: result.spoilageRisk,

                    visible_mold: result.visibleMold,

                    estimated_age: result.estimatedAge,

                    recommended_donation_time:

                      result.recommendedDonationTime,

                    safe_to_donate: result.safeToDonate,

                    confidence_score: result.confidenceScore,

                    explanation: result.explanation,

                    authenticity_result: aiData.authenticity?.result,

                    authenticity_confidence:

                      aiData.authenticity?.confidence,

                  });



                if (assessmentError) {

                  console.error(assessmentError);

                }

              }

            }

          } catch (aiError) {

            console.error('AI vision analysis failed:', aiError);

          }

        }

      }



      if (user?.uid && newDoc?.id) {

        await createNotification({

          userId: user.uid,

          type: 'general',

          title: 'Donation Created',

          message: `Donation "${formData.title}" published.`,

          relatedEntityType: 'donation',

          relatedEntityId: newDoc.id,

          priority: 'normal',

          actionUrl: '/dashboard/restaurant/active',

        });



        await createAuditLog({

          entityName: 'donations',

          entityId: newDoc.id,

          action: 'created',

          performedBy: user.uid,

        });

      }



      setSuccessData({

        id: newDoc?.id?.split('-')[0].toUpperCase(),

        meals: getCalculatedMeals(),

      });



      setIsSuccess(true);

      toast.success('Donation published successfully!');

    } catch (error: any) {

      console.error(error);

      toast.error(error?.message || 'Failed to create donation.');

    } finally {

      setIsSubmitting(false);

    }

  };



  const resetForAnotherDonation = () => {

    setIsSuccess(false);

    setSuccessData(null);

    setTouched({});



    setFormData((prev) => ({

      ...prev,

      title: '',

      category: 'Cooked',

      quantity: 5,

      unit: 'Kg',

      dietary: [],

      estimated_meals: '',

      expiry: '24',

      notes: '',

      ready_in: 30,

      instructions: '',

    }));



    setImageFile(null);

    setImagePreview(null);



    if (fileInputRef.current) {

      fileInputRef.current.value = '';

    }

  };



  if (isSuccess) {

    return (

      <div className="mx-auto min-h-[calc(100dvh-76px)] w-full max-w-none overflow-hidden bg-[#F8F9F6] px-5 pb-6 pt-4 dark:bg-[#0f1115]">

        <div

          className={`${cardClass} relative w-full max-w-2xl overflow-hidden p-6 text-center shadow-sm sm:p-10`}

        >

          <div className="absolute left-0 top-0 h-1 w-full bg-slate-700 dark:bg-slate-300" />



          <motion.div

            initial={{ scale: 0.8, opacity: 0 }}

            animate={{ scale: 1, opacity: 1 }}

            className="mb-4 flex justify-center"

          >

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">

              <PartyPopper className="h-8 w-8" />

            </div>

          </motion.div>



          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">

            Donation Published!

          </h2>



          <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">

            Thank you for your donation. Your contribution is estimated

            to provide{' '}

            <strong className="text-slate-900 dark:text-white">

              {successData?.meals || 0} meals

            </strong>

            .

          </p>



          <div className="mb-7 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-300">

            Donation ID:

            <span className="font-mono font-semibold">

              {successData?.id}

            </span>

          </div>



          <div className="flex flex-wrap justify-center gap-3">

            <Button

              onClick={resetForAnotherDonation}

              variant="outline"

              className="h-10 border-slate-300 px-5 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"

            >

              Create Another

            </Button>



            <Button

              onClick={() => navigate('/dashboard/restaurant/active')}

              className="h-10 bg-slate-800 px-5 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"

            >

              View Active Donations

            </Button>

          </div>

        </div>

      </div>

    );

  }



  const renderRightColumn = () => (

    <div className="flex h-full flex-col gap-3">

      {/* Landscape image preview */}

      <div className="relative aspect-[16/8] w-full overflow-hidden rounded-xl border border-[#DDE5DD] bg-[#F8F9F6] dark:border-slate-700 dark:bg-[#202226]">

        <img

          src={imagePreview || getPlaceholderImage(formData.category)}

          alt="Donation preview"

          className="absolute inset-0 h-full w-full object-cover"

        />



        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />



        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">

          <span className="rounded-md border border-white/20 bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">

            {CATEGORIES.find((c) => c.id === formData.category)?.title ||

              formData.category}

          </span>



          <span className="rounded-md border border-white/20 bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">

            {formData.quantity} {formData.unit}

          </span>

        </div>



        <div className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-700">

          Live Preview

        </div>



        <div className="absolute bottom-0 left-0 w-full p-3 text-white">

          <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight">

            {formData.title || 'Your donation title'}

          </h3>



          <div className="flex items-center gap-1.5 text-xs text-white/90">

            <MapPin className="h-3.5 w-3.5 shrink-0" />

            <span className="truncate">

              {formData.address || 'Pickup address'}

            </span>

          </div>



          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/90">

            <Clock className="h-3.5 w-3.5 shrink-0" />

            <span>

              {formData.ready_in === 0

                ? 'Ready now'

                : `Ready in ${formData.ready_in} minutes`}

            </span>

          </div>

        </div>

      </div>



      {/* Donation summary */}

      <div className={`${cardClass} p-3`}>

        <div className="mb-3 flex items-center justify-between">

          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">

            Donation Summary

          </p>

          <Utensils className="h-4 w-4 text-slate-500" />

        </div>



        <div className="grid grid-cols-2 gap-x-3 gap-y-3">

          <div className="min-w-0">

            <p className="text-[11px] text-slate-500 dark:text-slate-400">

              Food type

            </p>

            <p className="mt-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">

              {formData.dietary.join(', ') || 'Not selected'}

            </p>

          </div>



          <div className="min-w-0">

            <p className="text-[11px] text-slate-500 dark:text-slate-400">

              Estimated meals

            </p>

            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100">

              \~{getCalculatedMeals()} meals

            </p>

          </div>



          <div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">

              Quantity

            </p>

            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100">

              {formData.quantity} {formData.unit}

            </p>

          </div>



          <div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">

              Expires in

            </p>

            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100">

              {formData.expiry} hours

            </p>

          </div>

        </div>

      </div>



      <div className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-[#111317]/70">

        <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">

          Please ensure the food is suitable for donation and the

          pickup details are accurate.

        </p>

      </div>

    </div>

  );



  return (

    <main className="min-h-[calc(100dvh-76px)] w-full bg-[#F8F9F6] px-3 pt--6 pb--4 sm:px-5 lg:px-6 xl:px-8 dark:bg-[#0f1115]">

      <div className="mx-auto w-full max-w-[1320px]">

        {/* Page heading */}

        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">

          <div className="min-w-0">

            <button

              type="button"

              onClick={() => navigate('/dashboard/restaurant')}

              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"

            >

              <ArrowLeft className="h-4 w-4" />

              Back to Home

            </button>





            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">

              Share surplus food with people who need it.

            </p>

          </div>



          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#111317] dark:text-slate-300">

            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            New donation

          </span>

        </div>


{/* Main horizontal rectangular card */}
        <div className="grid w-full grid-cols-1 items-stretch overflow-hidden rounded-2xl border border-[#DDE5DD] bg-white shadow-sm lg:grid-cols-[1fr_310px] dark:border-slate-800 dark:bg-[#111317]">
          {/* LEFT: FORM */}
          <section className="flex min-w-0 flex-col justify-between p-4 lg:p-5">
            <div>
              {/* Header */}
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Donation Details
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fields marked * are required.
                  </p>
                </div>

                <span className="rounded-full border border-[#E1E7E1] bg-[#F8F9F6] px-2.5 py-1 text-[10px] font-semibold text-[#59665F] dark:border-slate-700 dark:bg-[#202226] dark:text-slate-300">
                  Food listing
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                {/* Food Name (Full Row) */}
                <div className="sm:col-span-2">
                  <Label className={labelClass}>Food Name *</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={formData.title}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, title: true }))
                      }
                      onChange={(e) => updateForm({ title: e.target.value })}
                      placeholder="e.g. Chicken Biryani"
                      className={`${inputClass} h-8.5 pl-8 text-xs`}
                    />
                  </div>
                  {touched.title && errors.title && (
                    <p className="mt-1 text-[10px] font-medium text-red-600">
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Food Type */}
                <div>
                  <Label className={labelClass}>Food Type *</Label>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {DIETARY_TYPES.map((type) => {
                      const selected = formData.dietary.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setTouched((prev) => ({ ...prev, dietary: true }));
                            updateForm({
                              dietary: selected ? [] : [type],
                            });
                          }}
                          className={`rounded-md border px-2 py-1 text-[10px] font-medium transition ${
                            selected
                              ? 'border-[#059669] bg-[#ECFDF5] text-[#047857] dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-[#E1E7E1] bg-white text-[#59665F] hover:border-[#059669] hover:bg-[#F8F9F6] dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  {touched.dietary && errors.dietary && (
                    <p className="mt-1 text-[10px] font-medium text-red-600">
                      {errors.dietary}
                    </p>
                  )}
                </div>

                {/* Food Category */}
                <div>
                  <Label className={labelClass}>Food Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateForm({ category: e.target.value })}
                    className={`${inputClass} mt-1 h-8.5 py-1 text-xs`}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <Label className={labelClass}>Quantity *</Label>
                  <div className="mt-1 flex h-8.5 overflow-hidden rounded-lg border border-[#DDE5DD] bg-[#F8F9F6] dark:border-slate-700 dark:bg-[#17191d]">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateForm({
                          quantity: Math.max(1, formData.quantity - 1),
                        })
                      }
                      className="w-8 shrink-0 text-xs text-slate-600 transition hover:bg-slate-200/50 dark:text-slate-300"
                    >
                      −
                    </button>
                    <div className="flex min-w-0 flex-1 items-center justify-center text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {formData.quantity}
                    </div>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        updateForm({ quantity: formData.quantity + 1 })
                      }
                      className="w-8 shrink-0 text-xs text-slate-600 transition hover:bg-slate-200/50 dark:text-slate-300"
                    >
                      +
                    </button>
                    <div className="my-1.5 w-px bg-slate-200 dark:bg-slate-700" />
                    <select
                      aria-label="Quantity unit"
                      value={formData.unit}
                      onChange={(e) => updateForm({ unit: e.target.value })}
                      className="w-18 shrink-0 bg-transparent px-1 text-xs text-slate-700 outline-none dark:text-slate-200"
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estimated Meals */}
                <div>
                  <Label className={labelClass}>Estimated Meals</Label>
                  <div className="mt-1 flex h-8.5 items-center justify-between rounded-lg border border-slate-200 bg-[#F8F9F6] px-3 dark:border-slate-700 dark:bg-[#202226]">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Utensils className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Approx.</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {getCalculatedMeals()} meals
                    </span>
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <Label className={labelClass}>Expiry Time *</Label>
                  <select
                    value={formData.expiry}
                    onBlur={() => setTouched((prev) => ({ ...prev, expiry: true }))}
                    onChange={(e) => updateForm({ expiry: e.target.value })}
                    className={`${inputClass} mt-1 h-8.5 py-1 text-xs`}
                  >
                    {EXPIRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ready for Pickup */}
                <div>
                  <Label className={labelClass}>Ready for Pickup</Label>
                  <select
                    value={formData.ready_in}
                    onChange={(e) => updateForm({ ready_in: Number(e.target.value) })}
                    className={`${inputClass} mt-1 h-8.5 py-1 text-xs`}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option.val} value={option.val}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pickup Address */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className={labelClass}>Pickup Address *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        if (useRestaurantAddress) {
                          setUseRestaurantAddress(false);
                        } else {
                          setUseRestaurantAddress(true);
                          handleUseMyAddress();
                        }
                      }}
                      className="text-[10px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {useRestaurantAddress ? 'Change' : 'Use default'}
                    </button>
                  </div>

                  {useRestaurantAddress ? (
                    <div className="mt-1 flex h-8.5 items-center gap-1.5 truncate rounded-lg border border-slate-200 bg-[#F8F9F6] px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-200">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-[11px]">
                        {formData.address || 'Loading restaurant address...'}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <AddressAutocompleteInput
                        value={formData.address}
                        onChange={(value) => updateForm({ address: value })}
                        onPlaceSelect={(place) =>
                          updateForm({
                            address: place.formattedAddress || place.displayName,
                            pin_lat: place.location.lat(),
                            pin_lng: place.location.lng(),
                          })
                        }
                        className={`${inputClass} h-8.5 text-xs`}
                      />
                    </div>
                  )}
                </div>

                {/* Special Instructions */}
                <div>
                  <Label className={labelClass}>
                    Instructions <span className="text-slate-400">(Optional)</span>
                  </Label>
                  <Input
                    value={formData.instructions}
                    onChange={(e) => updateForm({ instructions: e.target.value })}
                    placeholder="e.g. Ring back doorbell"
                    className={`${inputClass} mt-1 h-8.5 text-xs`}
                  />
                </div>

                {/* Food Image Upload (Compact Full Row) */}
                <div className="sm:col-span-2">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-[#F8F9F6] px-3 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#17191d]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ImagePlus className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                        {imageFile ? imageFile.name : 'Upload food photo (JPG, PNG · Max 10MB)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {imageFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-[10px] font-medium text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-[#202226] dark:text-slate-300">
                        Browse
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileSelection(e.target.files?.[0])}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Publish button */}
            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-9 w-full rounded-lg bg-[#059669] text-xs font-semibold text-white shadow transition hover:bg-[#047857]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Donation
                    <CheckCircle2 className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* RIGHT: PREVIEW PANEL */}
          <aside className="flex min-w-0 flex-col border-t border-[#DDE5DD] bg-[#FAFBF9] p-4 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-[#15171c]">
            <div className="mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Live Preview
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Preview how your donation appears.
              </p>
            </div>

            <div className="flex-1">{renderRightColumn()}</div>
          </aside>
        </div>

        <p className="mt-2 px-1 text-center text-[10px] leading-4 text-slate-500 dark:text-slate-400">

          Information is provided for guidance. Please ensure the food

          is suitable for donation and the pickup details are accurate.

        </p>

      </div>

    </main>

  );

}



export default function CreateDonation() {

  return <CreateDonationContent />;

}
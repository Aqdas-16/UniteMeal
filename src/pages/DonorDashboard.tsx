import { useEffect, useState } from 'react';
import {
   Plus,
   Truck,
   Box,
   FileText,
   HeartHandshake,
   Users,
   Leaf,
   Heart,
   Shield,
   ShieldCheck,
   ChevronRight,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from '@/components/ui/accordion';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

import { DonorLiveMap } from '../components/dashboard/DonorLiveMap';
import { Footer } from '../components/layout/Footer';


/* -------------------------------------------
   ACTION CARD
-------------------------------------------- */

function ActionCard({
   title,
   desc,
   icon: Icon,
   onClick,
}: {
   title: string;
   desc: string;
   icon: any;
   onClick: () => void;
}) {
   return (
      <Card
         onClick={onClick}
         className="group h-full cursor-pointer rounded-xl
  border border-[#E5E0D5] bg-[#FFFFFF]
  shadow-[0_1px_2px_rgba(35,42,33,0.03)]
  transition-all duration-200
  hover:-translate-y-0.5
  hover:border-[#C6D3C3]
  hover:shadow-[0_5px_16px_rgba(35,65,45,0.07)]
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-[#315D43]
  dark:border-[#394339] dark:bg-[#202720]"
      >
         <CardContent className="flex h-full items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center
  justify-center rounded-lg bg-[#E8EDE3]
  text-[#315D43] transition-colors
  group-hover:bg-[#DDE7D9]
  dark:bg-[#2B342C] dark:text-[#A9D0B5]">

               <Icon className="h-[19px] w-[19px]" />
            </div>

            <div className="min-w-0 flex-1">
               <h3
                  className="
              text-sm font-semibold leading-5
              text-[#252922]
              dark:text-[#F1F2EC]
            "
               >
                  {title}
               </h3>

               <p
                  className="
              mt-1.5 text-xs leading-[1.65]
              text-[#777B73]
              dark:text-[#AEB5AC]
            "
               >
                  {desc}
               </p>
            </div>

            <ChevronRight
               className="
            mt-0.5 h-4 w-4 shrink-0
            text-[#A3A79F]
            transition-all duration-200
            group-hover:translate-x-0.5
            group-hover:text-[#286044]
          "
            />
         </CardContent>
      </Card>
   );
}


/* -------------------------------------------
   KPI CARD
-------------------------------------------- */

function KPICard({
   label,
   value,
   icon: Icon,
}: {
   label: string;
   value: string;
   icon: any;
}) {
   return (
      <Card
         className="rounded-xl border border-[#E5E0D5]
  bg-[#FFFFFF]
  shadow-[0_1px_2px_rgba(35,42,33,0.03)]
  transition-all duration-200
  hover:border-[#C6D3C3]
  hover:shadow-[0_4px_12px_rgba(35,65,45,0.05)]
  dark:border-[#394339] dark:bg-[#202720]"
      >
         <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
               <p
                  className="
              text-xs font-medium leading-5
              text-[#777B73]
              dark:text-[#AEB5AC]
            "
               >
                  {label}
               </p>

               <p className="mt-1.5 text-2xl font-semibold
  tracking-tight text-[#292D27]
  dark:text-[#F5F0E8]">
                  {value}
               </p>
            </div>

            <div
               className="
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-lg bg-[#EAF1E9] text-[#286044]
            dark:bg-[#2B382E] dark:text-[#A8D0B4]
          "
            >
               <Icon className="h-[18px] w-[18px]" />
            </div>
         </CardContent>
      </Card>
   );
}


/* -------------------------------------------
   DONOR DASHBOARD
-------------------------------------------- */

export function DonorDashboard() {
   const { user, profile } = useAuth();
   const navigate = useNavigate();

   const [activeDonations, setActiveDonations] = useState<any[]>([]);
   const [recentDonations, setRecentDonations] = useState<any[]>([]);

   const [mealsDonated, setMealsDonated] = useState(0);
   const [totalFood, setTotalFood] = useState(0);
   const [carbonSaved, setCarbonSaved] = useState(0);
   const [pickupsCompleted, setPickupsCompleted] = useState(0);
   const [ngosSupported, setNgosSupported] = useState(0);

   const [metricsLoading, setMetricsLoading] = useState(true);

   /* -------------------------------------------
        FETCH DONATION DATA
     -------------------------------------------- */

   useEffect(() => {
      if (!user) {
         setMetricsLoading(false);
         return;
      }

      setMetricsLoading(true);

      const fetchDashboardData = async () => {
         const { data: donations, error } = await supabase
            .from('donations')
            .select('*, deliveries(ngo_id)')
            .eq('donor_id', user.uid);

         if (error || !donations) {
            if (error && !['42P01', '42501'].includes(error.code)) {
               console.error('Error fetching donations:', error);
            }

            setMetricsLoading(false);
            return;
         }

         const sortedDonations = [...donations].sort(
            (a: any, b: any) => {
               const dateA = a.created_at
                  ? new Date(a.created_at).getTime()
                  : 0;

               const dateB = b.created_at
                  ? new Date(b.created_at).getTime()
                  : 0;

               return dateB - dateA;
            }
         );

         const active = sortedDonations.filter(
            (donation: any) => donation.status === 'available'
         );

         setActiveDonations(active);
         setRecentDonations(sortedDonations);

         let totalMeals = 0;
         let totalKg = 0;
         let pickups = 0;

         const uniqueNgos = new Set<string>();

         sortedDonations.forEach((donation: any) => {
            if (donation.status !== 'cancelled') {
               totalMeals += Number(donation.estimated_meals || 0);
               totalKg += Number(donation.quantity_kg || 0);
            }

            if (
               donation.status === 'completed' ||
               donation.status === 'delivered'
            ) {
               pickups++;

               const deliveries = Array.isArray(donation.deliveries)
                  ? donation.deliveries
                  : [];

               const ngoId = deliveries.find(
                  (delivery: any) => delivery.ngo_id
               )?.ngo_id;

               if (ngoId) {
                  uniqueNgos.add(ngoId);
               }
            }
         });

         setMealsDonated(totalMeals);
         setTotalFood(totalKg);
         setPickupsCompleted(pickups);
         setCarbonSaved(Number((totalKg * 2.5).toFixed(1)));
         setNgosSupported(uniqueNgos.size);

         setMetricsLoading(false);
      };

      fetchDashboardData();

      const channel = supabase
         .channel('donor_dashboard_changes')
         .on(
            'postgres_changes',
            {
               event: '*',
               schema: 'public',
               table: 'donations',
               filter: `donor_id=eq.${user.uid}`,
            },
            () => {
               fetchDashboardData();
            }
         )
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, [user]);


   /* -------------------------------------------
      PAGE LAYOUT
   -------------------------------------------- */

   return (
      <div className="flex min-h-screen w-full flex-col bg-[#F8F9F6] font-sans text-[#252922] dark:bg-[#171C18]">

         {/* HERO SECTION */}

         <section
            className="
          relative isolate flex min-h-[440px]
          items-center overflow-hidden
          bg-[#17231B]
          sm:min-h-[470px]
        "
         >
            <div
               className="
            absolute inset-0 -z-20
            bg-cover bg-[65%_center]
            bg-no-repeat sm:bg-center
          "
               style={{
                  backgroundImage: "url('/restaurant_bg.jpeg')",
               }}
            />

            <div
               className="
            absolute inset-0 -z-10
            bg-gradient-to-r
            from-[#101812]/95
            via-[#101812]/75
            to-[#101812]/25
          "
            />

            <div
               className="
            absolute inset-0 -z-10
            bg-black/10
          "
            />

            <div
               className="
            mx-auto w-full max-w-[1320px]
            px-5 py-14
            sm:px-8 sm:py-16
            lg:px-12
          "
            >
               <div className="max-w-[590px]">

                  <Badge
                     variant="outline"
                     className="
                mb-5 rounded-full
                border-white/30
                bg-white/[0.06]
                px-3 py-1
                text-[10px] font-semibold
                uppercase tracking-[0.16em]
                text-[#D6E5D5]
              "
                  >
                     Restaurant Partner
                  </Badge>

                  <h1
                     className="
                text-4xl font-bold
                leading-[1.08] tracking-tight
                text-white
                sm:text-5xl
                lg:text-[3.6rem]
              "
                  >
                     Good Food
                     <br />

                     <span className="text-[#A9CDAA]">
                        Deserves a
                     </span>

                     <br />

                     Second Chance
                  </h1>

                  <p
                     className="
                mt-5 max-w-[500px]
                text-sm leading-7
                text-white/80
                sm:text-base
              "
                  >
                     Donate surplus food, reduce waste, and help
                     deliver fresh meals to people in your community.
                  </p>

                  <div
                     className="
                mt-7 flex flex-col gap-3
                sm:flex-row sm:items-center
              "
                  >
                     <Button
                        className="
                  h-11 rounded-lg
                  bg-[#286044] px-5
                  text-sm font-semibold text-white
                  shadow-sm
                  hover:bg-[#204D36]
                "
                        onClick={() =>
                           navigate('/dashboard/restaurant/create')
                        }
                     >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Donation
                     </Button>

                     <Button
                        variant="outline"
                        className="
                  h-11 rounded-lg
                  border-white/35
                  bg-white/5 px-5
                  text-sm font-semibold text-white
                  hover:bg-white/15 hover:text-white
                "
                        onClick={() =>
                           navigate('/dashboard/restaurant/active')
                        }
                     >
                        View Donations
                     </Button>
                  </div>

                  <div
                     className="
                mt-6 flex items-center gap-2
                text-xs font-medium text-white/75
              "
                  >
                     <ShieldCheck className="h-4 w-4 text-[#A9CDAA]" />
                     Helping restaurants make a difference
                  </div>

               </div>
            </div>
         </section>


         {/* COMPACT HIGHLIGHT STRIP */}

         {/* MARQUEE STRIP */}
         <div className="w-full overflow-hidden flex bg-[#E8E8E3] border-y border-[#E5DED2]/30 dark:border-[#D4AF37]/30 py-3">
            <div className="animate-marquee flex w-max items-center whitespace-nowrap">
               {[0, 1].map((idx) => (
                  <div
                     key={idx}
                     className="flex shrink-0 items-center"
                     aria-hidden={idx === 1}
                  >
                     {[
                        "Food Recovery",
                        "Reliable Pickups",
                        "Community Impact",
                        "Less Food Waste",
                        "Verified Restaurant Partners",
                        "Sustainable Food Distribution",
                     ].map((item) => (
                        <span
                           key={item}

                           className="text-[#245C43] text-xs font-bold uppercase tracking-[0.2em] mx-8"
                        >
                           {item}
                           <span className="text-[#C9C1B4]/60 dark:text-[#D4AF37]/60">
                              •
                           </span>
                        </span>
                     ))}
                  </div>
               ))}
            </div>
         </div>
         {/* MAIN DASHBOARD CONTENT */}
         <main
            className="
    mx-auto w-full max-w-[1320px]
    space-y-6 px-5 pt-2 pb-8
    sm:px-8 sm:pt-3 sm:pb-9
    lg:space-y-7 lg:px-12
  "
         >
            {/* WELCOME */}
            <section
               className="
      flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between
    "
            >
               {/* Welcome message */}
               <div className="min-w-0">
                  <h2
                     className="
          text-2xl font-semibold
          tracking-tight text-[#252922]
          sm:text-[1.75rem]
          dark:text-[#F1F2EC]
        "
                  >
                     Welcome back,{' '}
                     {profile?.business_name ||
                        profile?.full_name ||
                        profile?.name ||
                        'Restaurant'}
                  </h2>
               </div>

               {/* Donation status and action */}
               <div
                  className="
        flex flex-wrap items-center gap-3
        sm:shrink-0 sm:justify-end
      "
               >
                  {/* Active donations pill */}
                  <div
                     className="
          inline-flex h-9 items-center gap-2
          rounded-full border border-[#DCE4D9]
          bg-[#F1F5EF] px-3.5
          dark:border-[#39483A]
          dark:bg-[#222B22]
        "
                  >
                     <span
                        className="
            h-2 w-2 rounded-full
            bg-[#4F8059]
          "
                     />

                     <span
                        className="
            text-xs font-medium
            text-[#405B46]
            dark:text-[#C4D8C5]
          "
                     >
                        {activeDonations.length}{' '}
                        Active{' '}
                        {activeDonations.length === 1
                           ? 'Donation'
                           : 'Donations'}
                     </span>
                  </div>

                  {/* New donation button */}
                  <Button
                     variant="outline"
                     className="
          h-9 w-fit rounded-lg
          border-[#DADFD6]
          bg-white px-3.5
          text-xs font-semibold
          text-[#405B46]
          shadow-sm shadow-[#252922]/5
          transition-colors
          hover:bg-[#F0F4EF]
          dark:border-[#394339]
          dark:bg-[#202620]
          dark:text-[#C4D8C5]
          dark:hover:bg-[#293329]
        "
                     onClick={() =>
                        navigate('/dashboard/restaurant/create')
                     }
                  >
                     <Plus className="mr-1.5 h-4 w-4" />
                     New donation
                  </Button>
               </div>
            </section>


            {/* QUICK ACTIONS */}

            <section>
               <div className="mb-3.5 flex items-center justify-between">
                  <h3
                     className="
                text-base font-semibold
                text-[#252922]
                dark:text-[#F1F2EC]
              "
                  >
                     Quick actions
                  </h3>
               </div>

               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <ActionCard
                     title="Create Donation"
                     desc="List surplus food for collection."
                     icon={Plus}
                     onClick={() =>
                        navigate('/dashboard/restaurant/create')
                     }
                  />

                  <ActionCard
                     title="Track Delivery"
                     desc="Follow active pickups and deliveries."
                     icon={Truck}
                     onClick={() =>
                        navigate('/dashboard/restaurant/track')
                     }
                  />

                  <ActionCard
                     title="View Donations"
                     desc="Manage your donation history."
                     icon={FileText}
                     onClick={() =>
                        navigate('/dashboard/restaurant/active')
                     }
                  />

                  <ActionCard
                     title="NGO Requests"
                     desc="Review food requests from NGOs."
                     icon={HeartHandshake}
                     onClick={() =>
                        navigate('/dashboard/restaurant/requests')
                     }
                  />
               </div>
            </section>


            {/* IMPACT METRICS */}

            <section>
               <div
                  className="
              mb-3.5 flex flex-wrap
              items-end justify-between gap-2
            "
               >
                  <div>
                     <h3
                        className="
                  text-base font-semibold
                  text-[#252922]
                  dark:text-[#F1F2EC]
                "
                     >
                        Your impact
                     </h3>

                     <p
                        className="
                  mt-1 text-xs
                  text-[#858980]
                  dark:text-[#AEB5AC]
                "
                     >
                        A summary of your contribution
                     </p>
                  </div>

                  {metricsLoading && (
                     <span className="text-xs text-[#858980]">
                        Updating...
                     </span>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  <KPICard
                     label="Meals Shared"
                     value={mealsDonated.toLocaleString()}
                     icon={HeartHandshake}
                  />

                  <KPICard
                     label="Food Donated"
                     value={`${totalFood.toLocaleString()} kg`}
                     icon={Box}
                  />

                  <KPICard
                     label="Pickups Completed"
                     value={pickupsCompleted.toLocaleString()}
                     icon={Truck}
                  />

                  <KPICard
                     label="NGO Partners"
                     value={ngosSupported.toLocaleString()}
                     icon={Users}
                  />

                  <KPICard
                     label="CO₂e Prevented"
                     value={`${carbonSaved.toLocaleString()} kg`}
                     icon={Leaf}
                  />
               </div>
            </section>


            {/* LIVE DELIVERIES */}

            <section>
               <div
                  className="
              mb-3.5 flex items-center
              justify-between gap-3
            "
               >
                  <div>
                     <h3
                        className="
                  text-base font-semibold
                  text-[#252922]
                  dark:text-[#F1F2EC]
                "
                     >
                        Live deliveries
                     </h3>

                     <p
                        className="
                  mt-1 text-xs
                  text-[#858980]
                  dark:text-[#AEB5AC]
                "
                     >
                        Track ongoing food pickups
                     </p>
                  </div>

                  <Button
                     variant="ghost"
                     className="
                h-9 rounded-lg px-3
                text-xs font-semibold
                text-[#286044]
                hover:bg-[#EAF1E9]
                dark:text-[#A9CDAA]
                dark:hover:bg-[#2B382E]
              "
                     onClick={() =>
                        navigate('/dashboard/restaurant/track')
                     }
                  >
                     View all
                     <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
               </div>

               <div
                  className="
              overflow-hidden rounded-xl
              border border-[#E5E2D9]
              bg-white shadow-sm
              dark:border-[#343B35]
              dark:bg-[#202620]
            "
               >
                  <DonorLiveMap userId={user?.uid} />
               </div>
            </section>

            {/* WHY PARTNER WITH UNITEMEAL */}

            <section>
               <div className="mb-4">
                  <h3
                     className="
                text-base font-semibold
                text-[#252922]
                dark:text-[#F1F2EC]
              "
                  >
                     Why partner with UniteMeal?
                  </h3>

                  <p
                     className="
                mt-1 text-xs
                text-[#858980]
                dark:text-[#AEB5AC]
              "
                  >
                     Make surplus food count for more.
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                  {/* BENEFIT 1 */}

                  <div
                     className="
                rounded-xl border border-[#E5E2D9]
                bg-white p-4
                dark:border-[#343B35]
                dark:bg-[#202620]
              "
                  >
                     <div
                        className="
                  mb-3 flex h-9 w-9
                  items-center justify-center
                  rounded-lg bg-[#F9EDE7]
                  text-[#A65F43]
                  dark:bg-[#3B2D27]
                  dark:text-[#E0A58B]
                "
                     >
                        <Heart className="h-[18px] w-[18px]" />
                     </div>

                     <h4
                        className="
                  text-sm font-semibold
                  text-[#252922]
                  dark:text-[#F1F2EC]
                "
                     >
                        Reduce food waste
                     </h4>

                     <p
                        className="
                  mt-1.5 text-xs leading-[1.7]
                  text-[#777B73]
                  dark:text-[#AEB5AC]
                "
                     >
                        Turn surplus food into meals for people
                        who need them.
                     </p>
                  </div>


                  {/* BENEFIT 2 */}

                  <div
                     className="
                rounded-xl border border-[#E5E2D9]
                bg-white p-4
                dark:border-[#343B35]
                dark:bg-[#202620]
              "
                  >
                     <div
                        className="
                  mb-3 flex h-9 w-9
                  items-center justify-center
                  rounded-lg bg-[#EAF0F8]
                  text-[#456D9A]
                  dark:bg-[#283545]
                  dark:text-[#A7C7EB]
                "
                     >
                        <Users className="h-[18px] w-[18px]" />
                     </div>

                     <h4
                        className="
                  text-sm font-semibold
                  text-[#252922]
                  dark:text-[#F1F2EC]
                "
                     >
                        Support communities
                     </h4>

                     <p
                        className="
                  mt-1.5 text-xs leading-[1.7]
                  text-[#777B73]
                  dark:text-[#AEB5AC]
                "
                     >
                        Connect with NGOs and help deliver food
                        to local communities.
                     </p>
                  </div>


                  {/* BENEFIT 3 */}

                  <div
                     className="
                rounded-xl border border-[#E5E2D9]
                bg-white p-4
                dark:border-[#343B35]
                dark:bg-[#202620]
              "
                  >
                     <div
                        className="
                  mb-3 flex h-9 w-9
                  items-center justify-center
                  rounded-lg bg-[#EAF1E9]
                  text-[#286044]
                  dark:bg-[#2B382E]
                  dark:text-[#A8D0B4]
                "
                     >
                        <Leaf className="h-[18px] w-[18px]" />
                     </div>

                     <h4
                        className="
                  text-sm font-semibold
                  text-[#252922]
                  dark:text-[#F1F2EC]
                "
                     >
                        Build a greener future
                     </h4>

                     <p
                        className="
                  mt-1.5 text-xs leading-[1.7]
                  text-[#777B73]
                  dark:text-[#AEB5AC]
                "
                     >
                        Help reduce food waste and its
                        environmental impact.
                     </p>
                  </div>


                  {/* BENEFIT 4 */}

                  <div
                     className="
                rounded-xl border border-[#E5E2D9]
                bg-white p-4
                dark:border-[#343B35]
                dark:bg-[#202620]
              "
                  >
                     <div
                        className="
                  mb-3 flex h-9 w-9
                  items-center justify-center
                  rounded-lg bg-[#F4EFE0]
                  text-[#8B7135]
                  dark:bg-[#393323]
                  dark:text-[#D7C184]
                "
                     >
                        <Shield className="h-[18px] w-[18px]" />
                     </div>

                     <h4
                        className="
                  text-sm font-semibold
                  text-[#252922]
                  dark:text-[#F1F2EC]
                "
                     >
                        Promote safe handling
                     </h4>

                     <p
                        className="
                  mt-1.5 text-xs leading-[1.7]
                  text-[#777B73]
                  dark:text-[#AEB5AC]
                "
                     >
                        Encourage responsible food handling
                        and transparent coordination.
                     </p>
                  </div>

               </div>
            </section>


            {/* FREQUENTLY ASKED QUESTIONS */}

            <section className="border-t border-[#E5E2D9] pt-7 dark:border-[#343B35]">
               <div
                  className="
              mb-3.5 flex items-center
              justify-between gap-3
            "
               >
                  <div>
                     <h3
                        className="
                  text-base font-semibold
                  text-[#252922]
                  dark:text-[#F1F2EC]
                "
                     >
                        Frequently asked questions
                     </h3>

                     <p
                        className="
                  mt-1 text-xs
                  text-[#858980]
                  dark:text-[#AEB5AC]
                "
                     >
                        Helpful information for restaurant partners
                     </p>
                  </div>

                  <Button
                     variant="ghost"
                     className="
                h-9 shrink-0 rounded-lg
                px-2.5 text-xs font-semibold
                text-[#286044]
                hover:bg-[#EAF1E9]
                dark:text-[#A9CDAA]
                dark:hover:bg-[#2B382E]
              "
                     onClick={() => navigate('/faq')}
                  >
                     View all
                     <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
               </div>

               <div
                  className="
              overflow-hidden rounded-xl
              border border-[#E5E2D9]
              bg-white px-4
              dark:border-[#343B35]
              dark:bg-[#202620]
            "
               >
                  <Accordion type="single" collapsible className="w-full">
                     {[
                        {
                           q: 'What types of food can I donate?',
                           a: 'You can donate suitable surplus food, freshly prepared meals, or packaged goods that are within their expiry date and safe to consume.',
                        },
                        {
                           q: 'How does the pickup process work?',
                           a: 'Once an NGO accepts your donation, a volunteer can be assigned for collection. You can check delivery progress from the tracking page.',
                        },
                        {
                           q: 'How is food safety ensured?',
                           a: 'Donors should ensure that food is handled, stored, packaged, and labelled responsibly. Follow applicable food safety requirements.',
                        },
                        {
                           q: 'Can I schedule a recurring donation?',
                           a: 'If recurring donations are enabled in your donation form, you can use that option to plan regular surplus food donations.',
                        },
                        {
                           q: 'Is there any cost involved?',
                           a: 'Check the current UniteMeal donation and platform terms for any applicable charges.',
                        },
                     ].map((faq, index) => (
                        <AccordionItem
                           value={`faq-${index}`}
                           key={index}
                           className="border-b border-[#EAE8E1] last:border-0 dark:border-[#343B35]"
                        >
                           <AccordionTrigger
                              className="
                      py-4 text-left text-sm
                      font-medium text-[#30352E]
                      hover:no-underline
                      hover:text-[#286044]
                      dark:text-[#E8EAE3]
                      dark:hover:text-[#A9CDAA]
                    "
                           >
                              {faq.q}
                           </AccordionTrigger>

                           <AccordionContent
                              className="
                      pb-4 text-sm leading-6
                      text-[#777B73]
                      dark:text-[#AEB5AC]
                    "
                           >
                              {faq.a}
                           </AccordionContent>
                        </AccordionItem>
                     ))}
                  </Accordion>
               </div>
            </section>

         </main>


         {/* FOOTER */}

         <Footer />

      </div>
   );
}
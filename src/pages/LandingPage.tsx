import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView, useSpring, useTransform } from "motion/react";
import {
  Truck,
  BarChart3,
  Brain,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  Search,
  CheckCircle,
  Store,
  Network,
  Building2,
  ListPlus,
  Wand2,
  UserPlus,
  Route,
  BrainCircuit,
  Bell,
  LayoutDashboard,
  Navigation,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { UniteMealLogo } from "../components/UniteMealLogo";

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const springValue = useSpring(0, {
    bounce: 0,
    duration: 1500,
  });

  useEffect(() => {
    if (inView) {
      springValue.set(value);
    }
  }, [inView, value, springValue]);

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}
      {suffix && <span className="text-secondary">{suffix}</span>}
    </span>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.15 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(5px)", letterSpacing: "0.05em" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    letterSpacing: "0em",
    transition: { duration: 0.5, ease: "easeOut" },
  },
};


const HeroBackground = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="absolute inset-0 z-0">
      {/* Fallback Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1A202C] to-[#0F172A] z-0" />
      
      {/* Blur-up Skeleton Placeholder */}
      <div className={`absolute inset-0 bg-slate-800 animate-pulse z-10 transition-opacity duration-700 ${loaded || error ? 'opacity-0' : 'opacity-100'}`} />
      
      {/* Actual Image */}
      {!error && (
        <img 
          src="/hero-background.jpeg" 
          alt="Restaurant Background" 
          fetchPriority="high"
          loading="eager"
          className={`absolute inset-0 w-full h-full object-cover object-[75%_center] md:object-center z-20 transition-opacity duration-1000 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 dark:bg-black/60 z-30 pointer-events-none transition-colors duration-300" />
    </div>
  );
};

export function LandingPage() {
  const { session, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && session && profile) {
      const rolePath = profile.role === 'donor' ? 'restaurant' : profile.role;
      navigate('/dashboard/' + rolePath, { replace: true });
    }
  }, [session, profile, authLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("analytics_summary")
          .select('*')
          .order("last_aggregated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) setStats(data);
      } catch (e) {
        console.error("Error in fetchStats:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const channel = supabase
      .channel("analytics-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_summary" },
        fetchStats,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const kpis = stats
    ? [
        {
          label: "VERIFIED NGOs",
          value: stats.total_active_ngos || 0,
          suffix: (stats.total_active_ngos || 0) > 0 ? "+" : "",
        },
        {
          label: "FOOD CONTRIBUTORS",
          value: stats.total_active_donors || 0,
          suffix: (stats.total_active_donors || 0) > 0 ? "+" : "",
        },
        {
          label: "NGO VOLUNTEERS",
          value: stats.total_active_volunteers || 0,
          suffix: (stats.total_active_volunteers || 0) > 0 ? "+" : "",
        },
        {
          label: "TOTAL DONATIONS",
          value: stats.total_donations || 0,
          suffix: (stats.total_donations || 0) > 0 ? "+" : "",
        },
      ]
    : [];

  return (
    <div className="w-full relative min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Global Background Layer */}
      <div className="fixed inset-0 z-0 bg-theme-bg transition-colors duration-500" />

      {/* Dark Mode Overlay */}
      <div
        className="fixed inset-0 z-0 hidden dark:block pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at top center, rgba(255,255,255,0.025), transparent 60%)",
        }}
      />

      {/* Radial Accents (Light Mode) */}
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] z-0 dark:hidden pointer-events-none"
        style={{ backgroundColor: "rgba(34,197,94,0.03)" }}
      />
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] z-0 dark:hidden pointer-events-none"
        style={{ backgroundColor: "rgba(249,115,22,0.025)" }}
      />
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full mix-blend-multiply filter blur-[150px] z-0 dark:hidden pointer-events-none"
        style={{ backgroundColor: "rgba(59,130,246,0.02)" }}
      />

      <div className="relative z-10 w-full flex flex-col">
        {/* Hero Section */}
        <section
          id="home"
          style={{
            position: "relative",
            overflow: "hidden",
            isolation: "isolate",
          }}
        >
          <HeroBackground />

          <div
            className="hero-content min-h-[100svh] sm:min-h-[85vh] flex items-center w-full pt-[80px] sm:pt-[100px] pb-10 sm:pb-14 px-4 sm:px-6 lg:px-12 xl:px-16"
            style={{ position: "relative", zIndex: 2 }}
          >
            <div className="w-full max-w-[1400px] mx-auto relative flex">
              <div className="w-full lg:w-[50%] xl:w-[45%] text-left">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 md:mb-10 flex flex-col w-max relative scale-[0.80] md:scale-[0.90] origin-left"
                >
                  {/* Soft backdrop glow to ensure dark navy readability over darkened hero (light mode only) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[140%] bg-white/70 blur-[45px] rounded-full z-0 pointer-events-none dark:hidden" />

                  <div className="relative z-10 flex flex-col items-center sm:items-start">
                    <div className="flex items-center mb-3">
                      <svg
                        viewBox="0 0 100 100"
                        className="w-[42px] h-[42px] md:w-[54px] md:h-[54px] mr-4 shrink-0 drop-shadow-sm"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Left Person (Green) */}
                        <circle cx="30" cy="22" r="10" fill="#3FAE49" />
                        <path d="M 30 32 C 5 18 5 60 50 92" stroke="#3FAE49" strokeWidth="10" strokeLinecap="round" fill="none" />

                        {/* Right Person (Orange) */}
                        <circle cx="70" cy="22" r="10" fill="#F97316" />
                        <path d="M 70 32 C 95 18 95 60 50 92" stroke="#F97316" strokeWidth="10" strokeLinecap="round" fill="none" />

                        {/* Bowl (Black/White) */}
                        <path d="M 32 70 C 32 88 68 88 68 70 Z" fill="#0F172A" className="dark:fill-white" />

                        {/* Food (Yellow) */}
                        <path d="M 32 70 Q 50 62 68 70 Z" fill="#FBBF24" />

                        {/* Leaves (Green) */}
                        <path d="M 48 70 C 38 58 34 50 40 42 C 46 46 48 58 50 68 Z" fill="#3FAE49" />
                        <path d="M 52 70 C 62 58 66 50 60 42 C 54 46 52 58 50 68 Z" fill="#3FAE49" />
                      </svg>
                      <div className="text-[38px] md:text-[48px] font-[900] tracking-tighter leading-none mt-1">
                        <span className="text-theme-text">Unite</span>
                        <span className="text-primary">Meal</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-4 w-full ml-1">
                      <div className="h-[2px] w-8 md:w-12 rounded-full bg-primary" />
                      <span className="text-slate-800 dark:text-slate-200 font-semibold tracking-widest text-[10px] sm:text-[12px] md:text-[14px] uppercase">
                        Uniting Food. Uplifting Lives.
                      </span>
                      <div className="h-[2px] w-8 md:w-12 rounded-full bg-secondary" />
                    </div>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-[38px] sm:text-[44px] md:text-[60px] font-extrabold tracking-tight text-[#FFFFFF] mb-6 leading-[1.1] md:leading-[1.15]"
                >
                  <span className="text-[#FFFFFF]">Fight Against</span>{" "}
                  <span className="text-primary">Hunger.</span>
                  <br className="hidden md:block" />
                  <span className="text-secondary">Donate Food</span>{" "}
                  <span className="text-[#FFFFFF]">Today.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-[18px] sm:text-[20px] leading-[1.7] max-w-[560px] mb-10 font-medium"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Intelligent routing and transport to rescue surplus food from
                  restaurants and hotels, delivering it directly to verified
                  community NGOs.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  {session ? (
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto h-14 px-8 rounded-xl shadow-md font-semibold transition-transform hover:-translate-y-0.5"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  ) : (
                    <>
                      <Link to="/auth?role=donor">
                        <Button
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto h-14 px-8 rounded-xl shadow-md font-semibold transition-transform hover:-translate-y-0.5"
                        >
                          Donate Food
                        </Button>
                      </Link>
                      <Link to="/auth?role=ngo">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto h-14 px-8 bg-theme-surface dark:bg-theme-surface-2 text-theme-text font-semibold shadow-sm transition-transform hover:-translate-y-0.5 rounded-xl border border-theme-border "
                        >
                          Become Partner
                        </Button>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Ticker */}
        <div className="w-full h-[40px] md:h-[44px] flex items-center overflow-hidden border-y-0 relative bg-gradient-to-r from-[#101418] via-[#171C22] to-[#101418] dark:from-[#070A0E] dark:via-[#0F141B] dark:to-[#070A0E]">
          <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap min-w-max">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center">
                {[
                  "REAL-TIME DELIVERY TRACKING",
                  "VERIFIED COMMUNITY NGOS",
                  "AI ROUTING ENGINE",
                  "ZERO FOOD WASTE",
                  "LIVE IMPACT ANALYTICS",
                  "BUILT FOR INDIA",
                  "MUMBAI",
                  "DELHI",
                  "BENGALURU",
                  "HYDERABAD",
                  "CHENNAI",
                  "24×7 PLATFORM",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="font-mono text-[13px] font-semibold tracking-[0.08em] uppercase text-[rgba(255,255,255,0.82)] select-none px-6">
                      {text}
                    </span>
                    <span className="text-secondary select-none text-[13px] shrink-0 block">
                      &#8226;
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Community Impact Stats */}
        <section className="my-10 mx-auto w-full">
          <div className="container mx-auto max-w-[800px] px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              className="mb-4 text-center"
            >
              <motion.div
                variants={childVariants}
                className="text-[11px] font-medium tracking-[0.2em] text-theme-text-secondary uppercase mb-2"
              >
                COMMUNITY IMPACT
              </motion.div>
              <motion.h2
                variants={childVariants}
                className="text-2xl md:text-3xl font-bold tracking-tight text-theme-text"
              >
                Platform activity at a glance.
              </motion.h2>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 lg:gap-y-0 text-center items-center">
                {[1, 2, 3, 4].map((i, idx) => (
                  <div
                    key={i}
                    className="relative flex-1 flex flex-col items-center justify-center"
                  >
                    <div className="animate-pulse w-full">
                      <div className="h-12 md:h-14 bg-slate-200 dark:bg-slate-700/50 rounded w-24 md:w-32 mb-2 mx-auto" />
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20 md:w-24 mx-auto" />
                    </div>
                    {idx !== 3 && (
                      <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-[40px] bg-theme-border" />
                    )}
                    {idx % 2 === 0 && (
                      <div className="block lg:hidden absolute right-0 top-1/2 -translate-y-1/2 w-px h-[40px] bg-theme-border" />
                    )}
                  </div>
                ))}
              </div>
            ) : !stats ? (
              <div className="text-center py-6 text-theme-text-secondary">
                <BarChart3 className="mx-auto w-8 h-8 text-theme-border mb-4" />
                <p className="text-lg font-medium">No Data Available Yet</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 lg:gap-y-0 text-center items-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={sectionVariants}
              >
                {kpis.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    variants={childVariants}
                    className="relative group w-full transition-all duration-300"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl md:text-[54px] font-[800] text-theme-text mb-1 tracking-tighter transition-colors duration-300 leading-none">
                        <AnimatedCounter
                          value={stat.value}
                          suffix={stat.suffix}
                        />
                      </div>
                      <div className="text-[10px] md:text-[12px] font-medium tracking-[0.05em] text-theme-text-secondary mt-1.5 uppercase">
                        {stat.label}
                      </div>
                    </div>
                    {idx !== kpis.length - 1 && (
                      <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-[40px] bg-theme-border" />
                    )}
                    {idx % 2 === 0 && (
                      <div className="block lg:hidden absolute right-0 top-1/2 -translate-y-1/2 w-px h-[40px] bg-theme-border" />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="pt-[56px] pb-[32px] mx-auto w-full bg-theme-surface-2 overflow-hidden">
          <div className="container mx-auto max-w-[1080px] px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              className="mb-10 text-center"
            >
              <motion.div
                variants={childVariants}
                className="text-[11px] font-semibold tracking-[0.2em] text-theme-text-secondary uppercase mb-2"
              >
                HOW UNITEMEAL WORKS
              </motion.div>
              <motion.h2
                variants={childVariants}
                className="text-3xl md:text-3xl leading-[1.2] font-[800] tracking-tight text-theme-text"
              >
                The food rescue journey
              </motion.h2>
            </motion.div>

            <div className="flex flex-row overflow-x-auto no-scrollbar md:overflow-visible pb-8 pt-4 w-full justify-start md:justify-between items-start mt-2 gap-x-4 md:gap-x-0 snap-x">
              {[
                {
                  title: "Restaurant",
                  desc: "Registers as a verified food donor.",
                  icon: Building2,
                  color: "#22C55E",
                },
                {
                  title: "Food Listed",
                  desc: "Lists extra food available for donation.",
                  icon: ListPlus,
                  color: "#F97316",
                },
                {
                  title: "Smart Match",
                  desc: "Finds the nearest NGO.",
                  icon: BrainCircuit,
                  color: "#22C55E",
                },
                {
                  title: "NGO Accepts",
                  desc: "Accepts the food pickup.",
                  icon: HeartHandshake,
                  color: "#F97316",
                },
                {
                  title: "Delivery",
                  desc: "NGO assigns team member to collect food.",
                  icon: Truck,
                  color: "#22C55E",
                },
                {
                  title: "Impact",
                  desc: "Food safely delivered.",
                  icon: CheckCircle,
                  color: "#F97316",
                },
              ].map((step, index, arr) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="relative group shrink-0 w-[220px] md:w-auto md:flex-1 flex flex-col items-center text-center snap-center hover:-translate-y-1 transition-transform duration-250 cursor-default"
                >
                  {/* Connector */}
                  {index !== arr.length - 1 && (
                    <div className="absolute top-[20px] left-[calc(50%+24px)] w-[calc(100%-48px)] h-[1.5px] bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.06)] -z-10 flex items-center justify-end group-hover:bg-primary transition-colors duration-250">
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[5px] border-l-[rgba(0,0,0,0.08)] dark:border-l-[rgba(255,255,255,0.08)] group-hover:border-l-[#22C55E] transition-colors duration-250 -mr-[4px]" />
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-full border border-theme-border bg-theme-surface flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] group-hover:border-transparent transition-all duration-250 z-10">
                    <step.icon
                      className="w-4 h-4 transition-colors duration-250"
                      style={{ color: step.color }}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div className="mt-4 md:mt-5 pb-2 md:pb-0 px-2 lg:px-4">
                    <h3 className="text-[17px] font-semibold text-theme-text tracking-tight mb-1">
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-theme-text-secondary leading-snug mx-auto text-balance">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section className="pt-[36px] pb-[72px] mx-auto w-full bg-theme-surface-2">
          <div className="container mx-auto max-w-4xl px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              className="text-center mb-[40px]"
            >
              <motion.div
                variants={childVariants}
                className="text-[11px] font-medium tracking-[0.2em] text-theme-text-secondary uppercase mb-2"
              >
                PLATFORM CAPABILITIES
              </motion.div>
              <motion.h2
                variants={childVariants}
                className="text-3xl md:text-4xl font-[800] tracking-tight text-theme-text"
              >
                Built for speed and reliability.
              </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {[
                {
                  title: "Smart Matching",
                  desc: "Smart matching system pairs food with registered NGOs.",
                  icon: BrainCircuit,
                },
                {
                  title: "Live Tracking",
                  desc: "Track food delivery from pickup to destination.",
                  icon: Navigation,
                },
                {
                  title: "Smart Routing",
                  desc: "Faster routes help food reach people quickly.",
                  icon: Route,
                },
                {
                  title: "Notifications",
                  desc: "Get updates during every step of the delivery.",
                  icon: Bell,
                },
                {
                  title: "Admin Dashboard",
                  desc: "Powerful analytics and reporting for complete fleet oversight.",
                  icon: LayoutDashboard,
                },
                {
                  title: "Verification",
                  desc: "Secure role-based access ensuring food is delivered safely and legally.",
                  icon: ShieldCheck,
                },
              ].map((feature, index) => {
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="flex flex-col w-full"
                  >
                    <div className="flex flex-col items-start text-left pb-4">
                      <feature.icon
                        className="w-[22px] h-[22px] text-theme-text mb-3"
                        strokeWidth={1.5}
                      />
                      <h3 className="text-[15px] font-bold text-theme-text tracking-tight mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-theme-text-secondary text-sm leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                    <div className="w-full h-[1px] bg-theme-border mt-auto" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="my-14 mx-auto w-full">
          <div className="container mx-auto max-w-5xl px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-4 lg:gap-6 items-center"
            >
              <div>
                <motion.div
                  variants={childVariants}
                  className="text-[11px] font-medium tracking-[0.2em] text-theme-text-secondary uppercase mb-2"
                >
                  OUR MISSION
                </motion.div>
                <motion.h2
                  variants={childVariants}
                  className="text-3xl md:text-4xl font-bold tracking-tight text-theme-text mb-6"
                >
                  Connecting restaurants with NGOs to reduce food waste.
                </motion.h2>
                <motion.p
                  variants={childVariants}
                  className="text-[16px] text-theme-text-secondary leading-[1.6] mb-6"
                >
                  UniteMeal helps restaurants, hotels, bakeries, and catering
                  businesses donate extra food instead of throwing it away.
                </motion.p>
                <motion.p
                  variants={childVariants}
                  className="text-[16px] text-theme-text-secondary leading-[1.6] mb-6"
                >
                  Registered NGOs can request available food and directly assign
                  their own internal team members to safely transport it back
                  to their facility. The platform makes the entire process simple,
                  transparent, and easy to track.
                </motion.p>
                <motion.p
                  variants={childVariants}
                  className="text-[16px] text-theme-text-secondary leading-[1.6] mb-8"
                >
                  Our goal is to reduce food waste while helping local
                  communities. By connecting food contributors with NGOs through
                  one platform, we make food donation faster and more organized.
                </motion.p>
              </div>

              <motion.div
                variants={childVariants}
                className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] w-full premium-card flex items-center justify-center"
              >
                <video
                  src="/animated.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  disablePictureInPicture
                  disableRemotePlayback
                  controlsList="nodownload nofullscreen noremoteplayback"
                  className="w-full h-full object-contain pointer-events-none"
                />
                <div className="absolute inset-0 bg-slate-900/5 mix-blend-multiply pointer-events-none rounded-2xl dark:hidden" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="my-14 mx-auto w-full">
          <div className="container mx-auto max-w-3xl px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              className="text-center mb-6"
            >
              <motion.div
                variants={childVariants}
                className="text-[11px] font-medium tracking-[0.2em] text-theme-text-secondary uppercase mb-2"
              >
                FREQUENTLY ASKED QUESTIONS
              </motion.div>
              <motion.h2
                variants={childVariants}
                className="text-3xl md:text-4xl font-bold tracking-tight text-theme-text"
              >
                Common questions.
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={sectionVariants}
              className="flex flex-col gap-4"
            >
              {[
                {
                  q: "How do restaurants donate food?",
                  a: "Simply sign up as a Donor, log your extra food details including quantity_kg and type, and the platform will find the nearest NGO automatically.",
                },
                {
                  q: "How are NGOs verified?",
                  a: "All NGOs undergo a strict verification process including document checks and facility inspections before they can receive ongoing food donations.",
                },
                {
                  q: "Who handles deliveries?",
                  a: "NGOs assign pickups directly to their own internal staff or verified team members, who use the app to track and transport the food safely.",
                },
                {
                  q: "Is UniteMeal free?",
                  a: "Yes, connecting restaurants and NGOs through the UniteMeal platform is entirely free to help reduce food waste.",
                },
                {
                  q: "Are there third-party delivery partners?",
                  a: "No. For safety and accountability, we do not use crowdsourced outsider fleets. All food pickups are handled strictly by the verified team of the receiving NGO.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group premium-card premium-card-hover rounded-[18px] overflow-hidden transition-all duration-300"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-[15px] text-theme-text">
                    <span>{faq.q}</span>
                    <div className="w-6 h-6 rounded-full border border-theme-border flex items-center justify-center shrink-0 transition-colors">
                      <span className="text-theme-text-secondary font-medium text-lg leading-none transform group-open:rotate-45 transition-transform duration-300">
                        +
                      </span>
                    </div>
                  </summary>
                  <div className="px-6 pb-6 pt-0 text-theme-text-secondary text-sm leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Call To Action Section */}
        <section className="relative overflow-hidden w-full pt-14 pb-8 mx-auto bg-gradient-to-b from-transparent to-slate-50/80 dark:from-transparent dark:to-[#171F2B]">
          <div className="relative z-10 container mx-auto text-center flex flex-col items-center">
            <h2 className="text-4xl md:text-[56px] leading-[1.1] font-[800] tracking-[-0.02em] text-theme-text mb-6">
              Ready to make a difference?
            </h2>
            <p className="text-lg md:text-xl text-theme-text-secondary mb-8 max-w-2xl mx-auto font-medium">
              Join restaurants and NGOs helping reduce food
              waste across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 font-semibold text-white w-full sm:w-auto h-14 px-10 rounded-[14px] transition-all duration-300 hover:scale-[1.02]"
                >
                  Donate Food
                </Button>
              </Link>
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-10 font-semibold bg-theme-surface dark:bg-theme-surface-2 text-theme-text border border-theme-border  shadow-sm transition-all duration-300 hover:scale-[1.02] rounded-[14px]"
              >
                Become a Partner
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

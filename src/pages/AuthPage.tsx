import { createNotification, createAuditLog } from '@/lib/notifications';
import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import { auth } from "@/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import { UniteMealLogo } from "../components/UniteMealLogo";
import { cn } from "@/lib/utils";

export function AuthPage() {
  const { session, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<"donor" | "ngo" | "volunteer">("donor");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    localStorage.setItem("pendingRole", selectedRole);
    if (selectedRole === 'volunteer') setIsLogin(true);
  }, [selectedRole]);

  if (isLoading) return null;

  if (session && profile) {
    if (profile.role === "admin")
      return <Navigate to="/dashboard/admin" replace />;
    if (profile.role === "donor")
      return <Navigate to="/dashboard/restaurant" replace />;
    if (profile.role === "ngo") return <Navigate to="/dashboard/ngo" replace />;
    if (profile.role === "volunteer") return <Navigate to="/dashboard/volunteer" replace />;
    
    return <Navigate to="/" replace />;
  }

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let authEmail = email;
    if (selectedRole === 'volunteer' && !email.includes('@')) {
        authEmail = `${email}@volunteer.unitemeal.org`;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, authEmail, password);
        await createAuditLog({
            entityName: 'profiles',
            entityId: cred.user.uid,
            action: 'updated',
            performedBy: cred.user.uid,
            changes: { event: 'login_success' }
        });
        await createNotification({
            userId: cred.user.uid,
            type: 'system_alert',
            title: 'Login Successful',
            message: 'You have successfully logged into your account.',
            relatedEntityType: 'profile',
            relatedEntityId: cred.user.uid
        });
      } else {
        localStorage.setItem("pendingFullName", fullName);
        const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
        
        await createAuditLog({
            entityName: 'profiles',
            entityId: cred.user.uid,
            action: 'created',
            performedBy: cred.user.uid,
            changes: { event: 'signup_success' }
        });
        await createNotification({
            userId: cred.user.uid,
            type: 'system_alert',
            title: 'Welcome to UniteMeal',
            message: 'Your account has been successfully created.',
            relatedEntityType: 'profile',
            relatedEntityId: cred.user.uid,
            actionUrl: '/dashboard'
        });
        
        setErrorMsg("Signed up successfully!");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
      
      // We can't log auth failure to a specific user easily since we don't have their UID on failed login,
      // but we can at least write an audit log for the system.
      await createAuditLog({
          entityName: 'profiles',
          entityId: 'unknown',
          action: 'updated',
          performedBy: 'system',
          changes: { event: 'auth_failure', email: email, error: error.message }
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-[100px] pb-6 px-4 md:px-8 bg-[#F7F8FA] dark:bg-[#0B0F14] min-h-screen overflow-hidden">
      <div className="w-full max-w-[900px] h-auto flex flex-col md:flex-row bg-[#FFFFFF] dark:bg-[#111827] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
        {/* Left Panel */}
        <div className="relative w-full md:w-[42%] h-40 md:h-auto shrink-0 flex flex-col justify-end p-6 md:p-8 overflow-hidden bg-slate-900">
          <img
            src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=1280"
            alt="Food Delivery"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 text-white mt-auto">
            <h2 className="text-2xl font-bold tracking-tight mb-1.5 text-[#3FAE49]">
              UNITEMEAL
            </h2>
            <p className="text-[16px] font-medium text-white/95 mb-2 tracking-tight leading-snug">
              Connecting Extra Food.
              <br />
              Helping Communities.
            </p>
            <p className="text-[13px] text-white/80 max-w-[95%] leading-relaxed hidden md:block">
              Making it easy for restaurants and NGOs to
              share extra food with people who need it.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-[58%] px-6 py-4 md:px-10 md:py-5 overflow-y-auto custom-scrollbar flex flex-col justify-center bg-[#FFFFFF] dark:bg-[#111827]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[400px] mx-auto flex flex-col"
          >
            <div className="flex flex-col mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 flex items-center justify-center bg-[#3FAE49]/10 rounded-lg">
                  <UniteMealLogo className="w-4 h-4 text-[#3FAE49]" />
                </div>
                <span className="text-[15px] font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
                  UniteMeal
                </span>
              </div>
              <h1 className="text-[22px] font-[800] tracking-tight text-[#111827] dark:text-[#F8FAFC]">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[14px] mt-0.5">
                {isLogin
                  ? "Sign in to continue your impact."
                  : "Join the mission to end food waste."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col"
              >
                {/* Role Selector */}
                <div className="flex bg-[#F3F4F6] dark:bg-[#1F2937] p-1 rounded-[12px] mb-3 relative border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
                  {[
                    { id: "donor", label: "Restaurant" },
                    { id: "ngo", label: "NGO" },
                    { id: "volunteer", label: "NGO Team" },
                    
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id as any)}
                      className={cn(
                        "flex-1 py-1.5 text-[13px] font-semibold rounded-[8px] transition-all duration-300 relative z-10",
                        selectedRole === role.id
                          ? "bg-[#3FAE49] text-white shadow-sm"
                          : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5",
                      )}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>

                {errorMsg && (
                  <div
                    className={cn(
                      "p-2.5 rounded-[10px] mb-3 text-[13px] font-medium text-center",
                      errorMsg.includes("successfully")
                        ? "bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] dark:bg-[#1C2C22] dark:border-[#16A34A] dark:text-[#4ADE80]"
                        : "bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/30 dark:border-red-900",
                    )}
                  >
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-2">
                  {!isLogin && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="fullName"
                        className="text-[12px] font-semibold text-[#374151] dark:text-[#D1D5DB]"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="h-[40px] rounded-[10px] bg-[#FFFFFF] dark:bg-[#111827] border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] focus-visible:ring-1 focus-visible:ring-[#3FAE49] focus-visible:border-[#3FAE49] transition-colors shadow-none text-[13px] placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label
                      htmlFor="email"
                      className="text-[12px] font-semibold text-[#374151] dark:text-[#D1D5DB]"
                    >
                      {selectedRole === 'volunteer' ? 'Username' : 'Email'}
                    </Label>
                    <Input
                      id="email"
                      type={selectedRole === 'volunteer' ? 'text' : 'email'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={selectedRole === 'volunteer' ? "e.g. john123" : "name@company.com"}
                      className="h-[40px] rounded-[10px] bg-[#FFFFFF] dark:bg-[#111827] border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] focus-visible:ring-1 focus-visible:ring-[#3FAE49] focus-visible:border-[#3FAE49] transition-colors shadow-none text-[13px] placeholder:text-[#9CA3AF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-[12px] font-semibold text-[#374151] dark:text-[#D1D5DB]"
                      >
                        Password
                      </Label>
                      {isLogin && (
                        <button
                          type="button"
                          className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="h-[40px] rounded-[10px] bg-[#FFFFFF] dark:bg-[#111827] border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] focus-visible:ring-1 focus-visible:ring-[#3FAE49] focus-visible:border-[#3FAE49] transition-colors shadow-none text-[13px] placeholder:text-[#9CA3AF]"
                    />
                  </div>

                  {!isLogin && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-[12px] font-semibold text-[#374151] dark:text-[#D1D5DB]"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="h-[40px] rounded-[10px] bg-[#FFFFFF] dark:bg-[#111827] border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] focus-visible:ring-1 focus-visible:ring-[#3FAE49] focus-visible:border-[#3FAE49] transition-colors shadow-none text-[13px] placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  )}

                  <div className="pt-1.5">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#3FAE49] to-[#34943E] hover:from-[#359B3F] hover:to-[#2A7D31] text-white h-[40px] rounded-[10px] shadow-sm font-semibold text-[13px] transition-all duration-150 border border-transparent"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isLogin ? (
                        "Sign In"
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </form>

                                {selectedRole !== 'volunteer' && (
                  <>
                    <div className="mt-3 mb-3 relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#E5E7EB] dark:border-[#374151]" />
                      </div>
                      <span className="relative bg-[#FFFFFF] dark:bg-[#111827] px-3 text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                        Or
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full h-[40px] rounded-[10px] bg-white dark:bg-[#111827] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] hover:bg-slate-50 dark:hover:bg-slate-900 shadow-none font-medium text-[#111827] dark:text-[#F8FAFC] transition-all duration-150 text-[13px]"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                    >
                      <span className="w-4 h-4 mr-2 flex items-center justify-center"><FcGoogle size={16} /></span>
                      Continue with Google
                    </Button>
                  </>
                )}

                <div className="mt-3 text-center text-[13px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrorMsg(null);
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-[#111827] dark:text-[#F8FAFC] font-semibold hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors ml-1"
                  >
                    {selectedRole === 'volunteer' ? "" : isLogin ? "Create Account" : "Sign In"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

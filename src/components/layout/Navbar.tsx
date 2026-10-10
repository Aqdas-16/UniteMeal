import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Bell,
  LogOut,
  LayoutDashboard,
  Settings,
  Check,
  CheckCircle2,
  Menu,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "../ThemeToggle";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, useScroll, useTransform } from "motion/react";
import { UniteMealLogo } from "../UniteMealLogo";

export function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (["home", "about", "faq"].includes(hash)) return hash;
    }
    return "home";
  });

  useEffect(() => {
    if (location.pathname !== "/") return;

    const handleScroll = () => {
      const sections = ["home", "about", "faq"];

      let currentSection = "home";
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Element is considered active if its top is above the middle of viewport
          // and its bottom is below the top of viewport (meaning it is visible in the top half)
          if (rect.top <= window.innerHeight / 2 && rect.bottom > 0) {
            currentSection = section;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select('*')
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifs();

    const channel = supabase
      .channel("navbar-notifs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        fetchNotifs,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleMarkAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
  };

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => {
    if (path.startsWith("/#")) {
      const targetSection = path.substring(2);
      if (location.pathname === "/") {
        return activeSection === targetSection;
      }
      return location.hash === path.substring(1);
    }
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path) && path !== "/";
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    if (path.startsWith("/#") && location.pathname === "/") {
      e.preventDefault();
      const targetId = path.substring(2);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${targetId}`);
        setActiveSection(targetId);
      } else {
        navigate(path);
      }
    }
  };

  const NavLink = ({
    to,
    children,
    mobile = false,
  }: {
    to: string;
    children: React.ReactNode;
    mobile?: boolean;
  }) => {
    const active = isActive(to);
    const Element = to.startsWith("/#") ? "a" : Link;

    return (
      <Element
        to={to.startsWith("/#") ? undefined : to}
        href={to.startsWith("/#") ? to : undefined}
        onClick={(e) => handleNavClick(e as any, to)}
        className={`relative font-medium transition-all duration-[250ms] ${mobile ? "text-lg py-2" : "text-[14px]"} ${active ? "text-primary" : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"}`}
      >
        {children}
        {!mobile && (
          <span
            className={`absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-primary rounded-full transition-transform duration-[250ms] origin-left ${active ? "scale-x-100" : "scale-x-0"}`}
          />
        )}
      </Element>
    );
  };

  return (
    <motion.header
      layout
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 w-full px-4 pt-2 md:pt-4 transition-all duration-300 ${isScrolled ? "pt-1 md:pt-2" : ""}`}
    >
      <div
        className={`mx-auto max-w-5xl rounded-[28px] border transition-all duration-300 backdrop-blur-[18px] bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(23,28,36,0.92)] border-transparent dark:border-theme-border flex h-[52px] items-center justify-between px-4 md:px-6 ${isScrolled ? "shadow-sm dark:shadow-none border-theme-border" : "shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none"}`}
      >
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-slate-600 dark:text-slate-300"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLink to="/#home" mobile>
                  Home
                </NavLink>
                <NavLink to="/#about" mobile>
                  About Us
                </NavLink>
                <NavLink to="/dashboard" mobile>
                  Dashboard
                </NavLink>
                <NavLink to="/#faq" mobile>
                  FAQ
                </NavLink>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center">
            <UniteMealLogo className="text-2xl" />
          </Link>
          <nav className="hidden md:ml-10 md:flex gap-8 items-center h-full">
            <NavLink to="/#home">Home</NavLink>
            <NavLink to="/#about">About Us</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/#faq">FAQ</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium w-9 h-9 border-none shadow-none text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3FAE49] relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex w-3 h-3 text-[8px] items-center justify-center font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-slate-950">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[300px] sm:w-80 p-0 overflow-hidden dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-sm">Notifications</div>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnreadCount(0);
                          handleMarkAllRead();
                        }}
                        className="h-auto p-0 text-xs text-primary hover:text-[#328f3a] bg-transparent hover:bg-transparent tracking-tight"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
                        <Bell className="w-8 h-8 mb-3 opacity-20" />
                        <p className="text-sm font-medium">
                          No notifications yet
                        </p>
                        <p className="text-xs max-w-[200px] mt-1">
                          We'll let you know when there's an update for you.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id || notif.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notif.is_read)
                                handleMarkAsRead(
                                  notif.id || notif.id,
                                );
                            }}
                            className={`flex items-start gap-4 p-4 border-b border-slate-100 dark:border-slate-800 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${notif.is_read ? "opacity-70" : "bg-primary/5 dark:bg-primary/10"}`}
                          >
                            <div
                              className={`mt-1 p-1.5 rounded-full ${notif.is_read ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-primary/10 text-primary"}`}
                            >
                              {notif.is_read ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none text-slate-900 dark:text-white">
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                {notif.created_at
                                  ? new Date(
                                      notif.created_at,
                                    ).toLocaleDateString()
                                  : ""}{" "}
                                at{" "}
                                {notif.created_at
                                  ? new Date(
                                      notif.created_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      className="w-full text-xs font-semibold h-8"
                      onClick={() =>
                        navigate(
                          profile?.role
                            ? `/dashboard/${profile.role}/notifications`
                            : "/dashboard",
                        )
                      }
                    >
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer border-0 ring-0 hover:ring-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {profile?.full_name?.charAt(0) ||
                        session.email?.charAt(0) ||
                        "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:block text-slate-900 dark:text-slate-100">
                    {profile?.business_name || profile?.full_name || "User"}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 dark:bg-slate-900"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.business_name || profile?.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-slate-500">
                        {session.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        profile?.role
                          ? `/dashboard/${profile.role}/profile`
                          : "/dashboard",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        profile?.role
                          ? `/dashboard/${profile.role}/history`
                          : "/dashboard",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>My Activity</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        profile?.role
                          ? `/dashboard/${profile.role}/track`
                          : "/dashboard",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span>My Deliveries</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        profile?.role
                          ? `/dashboard/${profile.role}/notifications`
                          : "/dashboard",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        profile?.role
                          ? `/dashboard/${profile.role}`
                          : "/dashboard",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        profile?.role
                          ? `/dashboard/${profile.role}/settings`
                          : "/dashboard",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Check className="mr-2 h-4 w-4" />
                    <span>Help</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Login
                </Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white shadow-sm"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

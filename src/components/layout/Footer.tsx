import { Link } from "react-router-dom";
import { Globe, Mail, Link as LinkIcon, Share2 } from "lucide-react";
import { UniteMealLogo } from "../UniteMealLogo";

export function Footer() {
  return (
    <footer className="relative z-10 w-full px-4 md:px-6 pb-6 pt-0">
      <div className="container mx-auto">
        <div className="bg-theme-surface border border-theme-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.20)] rounded-[24px] p-6 md:p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 mb-8">
            {/* Left Section */}
            <div className="lg:col-span-5 flex flex-col items-start gap-4">
              <UniteMealLogo className="text-xl" />
              <p className="text-[13px] text-theme-text-secondary max-w-[320px] leading-relaxed">
                Helping restaurants share extra food with trusted NGOs across
                India.
              </p>

              <div className="flex items-center gap-3 mt-1">
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-theme-bg dark:bg-theme-surface hover:text-[#3FAE49] dark:hover:text-[#3FAE49] hover:bg-theme-surface-2 transition-colors border border-theme-border text-theme-text-secondary"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-theme-bg dark:bg-theme-surface hover:text-[#3FAE49] dark:hover:text-[#3FAE49] hover:bg-theme-surface-2 transition-colors border border-theme-border text-theme-text-secondary"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-theme-bg dark:bg-theme-surface hover:text-[#3FAE49] dark:hover:text-[#3FAE49] hover:bg-theme-surface-2 transition-colors border border-theme-border text-theme-text-secondary"
                >
                  <Share2 className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-theme-bg dark:bg-theme-surface hover:text-[#3FAE49] dark:hover:text-[#3FAE49] hover:bg-theme-surface-2 transition-colors border border-theme-border text-theme-text-secondary"
                >
                  <LinkIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Section */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-[13px] font-semibold text-theme-text mb-1">
                  Platform
                </span>
                <Link
                  to="/"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  Home
                </Link>
                <a
                  href="/#about"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  About
                </a>
                <Link
                  to="/dashboard"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  Dashboard
                </Link>
                <a
                  href="/#faq"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  FAQ
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[13px] font-semibold text-theme-text mb-1">
                  Resources
                </span>
                <Link
                  to="/privacy"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  Terms
                </Link>
                <Link
                  to="/contact"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  Contact
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[13px] font-semibold text-theme-text mb-1">
                  Community
                </span>
                <Link
                  to="/auth"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  Donate Food
                </Link>
                <Link
                  to="/auth"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  Become Partner
                </Link>
                <Link
                  to="/auth"
                  className="text-[13px] font-medium text-theme-text-secondary hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
                >
                  
                </Link>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-theme-border mb-4" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[12px] font-medium text-theme-text-secondary">
              &copy; {new Date().getFullYear()} UniteMeal. All rights reserved.
            </span>
            <div className="flex items-center gap-4 text-[12px] font-medium text-theme-text-secondary">
              <Link
                to="/privacy"
                className="hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/contact"
                className="hover:text-[#3FAE49] dark:hover:text-[#3FAE49] transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

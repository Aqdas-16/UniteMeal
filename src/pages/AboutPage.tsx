import { Users, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UniteMealLogo } from "../components/UniteMealLogo";

export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#09090b] text-theme-text dark:text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Our Mission
          </h1>
          <p className="text-xl text-theme-text-secondary dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            We're building a simpler way to rescue food. By using smart matching
            and fast delivery tracking, we aim to reduce food waste and help
            communities.
          </p>
        </div>

        {/* Story section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-bold mb-4">The Story</h2>
          <p className="text-theme-text-secondary dark:text-slate-300 mb-4 leading-relaxed">
            Food waste is an ongoing problem, while many people still lack
            access to good meals. Our platform was born from the idea that
            connecting extra food to those in need should be easy. We saw that
            communication between restaurants and NGOs was
            often slow and disconnected.
          </p>
          <p className="text-theme-text-secondary dark:text-slate-300 leading-relaxed">
            UniteMeal fixes this by bringing everyone together on one platform.
            We match extra food to the nearest registered NGOs so it gets
            delivered quickly.
          </p>
        </div>

        {/* Values section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Our Core Values</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UniteMealLogo className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
                <p className="text-theme-text-secondary dark:text-theme-text-secondary text-sm">
                  We are committed to reducing greenhouse gas emissions by
                  diverting organic waste away from landfills.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Community First</h3>
                <p className="text-theme-text-secondary dark:text-theme-text-secondary text-sm">
                  Our primary goal is to support local communities, empowering
                  NGOs to focus on distribution rather than sourcing.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Efficiency</h3>
                <p className="text-theme-text-secondary dark:text-theme-text-secondary text-sm">
                  We value speed. Instant notifications and smart matching
                  ensure food reaches people while it's still fresh.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Trust & Safety</h3>
                <p className="text-theme-text-secondary dark:text-theme-text-secondary text-sm">
                  All our NGOs and Donors undergo verification processes to
                  guarantee food safety and reliable distribution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold mb-4">Join the Movement</h2>
          <p className="text-theme-text-secondary dark:text-theme-text-secondary mb-6">
            Whether you are a donor or organization, there is
            a place for you.
          </p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12"
            onClick={() => navigate("/auth")}
          >
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}

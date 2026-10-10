export function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#09090b] text-theme-text dark:text-slate-100 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-sm text-theme-text-secondary">Last updated: June 2, 2026</p>
        </div>
        
        <div className="prose dark:prose-invert prose-slate max-w-none">
          <p>
            Please read these Terms of Service carefully before using the UniteMeal platform. By accessing or using our service, you agree to be bound by these terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By using our Platform, you agree to be bound by these Terms. If you don't agree to be bound by these Terms, do not use the Platform.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Food Safety Obligations</h2>
          <p>
            Donors are solely responsible for ensuring that all food placed on the platform is safe for consumption and adheres to local health and safety regulations at the time of handoff. NGOs agree to inspect all food items upon collection.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. User Accounts</h2>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Limitation of Liability</h2>
          <p>
            In no event shall UniteMeal, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Modifications</h2>
          <p>
            We may modify the Terms at any time, in our sole discretion. If we do so, we'll let you know either by posting the modified Terms on the Platform or through other communications.
          </p>
        </div>
      </div>
    </div>
  );
}

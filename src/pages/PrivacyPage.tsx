export function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-[#09090b] text-theme-text dark:text-slate-100 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-theme-text-secondary">
            Last updated: June 2, 2026
          </p>
        </div>

        <div className="prose dark:prose-invert prose-slate max-w-none">
          <p>
            At UniteMeal, protecting your privacy is fundamental to the way our
            platform operates. This Privacy Policy outlines how your data is
            collected, processed, and safeguarded.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as when you
            create or modify your account, request services, contact customer
            support, or otherwise communicate with us. This information may
            include: name, email, phone number, postal address, profile picture,
            payment method, items requested, and other information you choose to
            provide.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            2. How We Use Information
          </h2>
          <p>We may use the information we collect about you to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-theme-text-secondary dark:text-slate-300">
            <li>Provide, maintain, and improve our food recovery services.</li>
            <li>
              Perform internal operations, including troubleshooting, data
              analysis, testing, and research.
            </li>
            <li>
              Send you communications we think will be of interest to you,
              including information about platform updates.
            </li>
            <li>Personalize and improve the Services.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Security</h2>
          <p>
            We take reasonable measures to help protect information about you
            from loss, theft, misuse and unauthorized access, disclosure,
            alteration and destruction.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            4. Location Information
          </h2>
          <p>
            When you use the Services, we may collect precise location data
            about the route of a delivery to coordinate food distribution. We
            only collect this data from volunteers when they have given
            us permissions through their device's operating system.
          </p>
        </div>
      </div>
    </div>
  );
}

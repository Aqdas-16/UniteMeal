import { HelpCircle } from "lucide-react";

export function FAQPage() {
  const faqs = [
    {
      question: "How does UniteMeal work?",
      answer:
        "We connect food donors (restaurants, caterers, grocery stores) with nearby registered NGOs through an easy matching system. When extra food is posted, our system alerts the most suitable NGO and coordinates the pickup.",
    },
    {
      question: "Who can register as a Donor?",
      answer:
        "Any business with extra food that is safe for human consumption can register. This includes restaurants, supermarkets, event caterers, corporate cafeterias, and bakeries.",
    },
    {
      question: "How do you ensure food safety?",
      answer:
        "Food safety is our top priority. We verify all NGOs prior to onboarding. Donors are also guided by strict packaging and quality guidelines before any item can be listed for pickup.",
    },
    {
      question: "Is there a fee to use the platform?",
      answer:
        "No, UniteMeal is completely free for donors and NGOs. Our mission is to eliminate food waste and support communities without imposing financial barriers.",
    },
    {
      question: "How can I deliver food?",
      answer:
        "You can join a registered NGO's volunteer fleet. Once background-verified, you will start receiving notifications for food rescues in your local area.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#09090b] text-theme-text dark:text-slate-100 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 mx-auto rounded-full flex items-center justify-center mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-theme-text-secondary dark:text-theme-text-secondary">
            Find answers to common questions about our platform and how you can
            participate.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
              <p className="text-theme-text-secondary dark:text-theme-text-secondary leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

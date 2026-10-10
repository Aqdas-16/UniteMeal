import {
  Mail,
  Phone,
  MessageSquare,
  HandHeart,
  Send,
  ChevronDown,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSubmitting(true);
    try {
      await supabase.from("support_tickets").insert({
        user_id: "anonymous",
        subject: subject + ` (from ${name} - ${email})`,
        description: message,
      });

      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("general");
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-theme-text dark:text-slate-100">
      {/* Hero Section */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 py-20 px-4 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300">
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-theme-text ">
            We're here to help
          </h1>
          <p className="text-lg md:text-xl text-theme-text-secondary dark:text-theme-text-secondary max-w-2xl mx-auto leading-relaxed">
            Whether you have a question about our platform, need technical
            support, or want to explore partnership opportunities, our team is
            ready to assist you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Support Information & FAQ Column */}
        <div className="lg:col-span-5 flex flex-col gap-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">
              How can we support you?
            </h3>

            <div className="flex gap-4 items-start p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <HandHeart className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div>
                <h4 className="font-semibold text-theme-text ">Partnerships</h4>
                <p className="text-sm text-theme-text-secondary dark:text-theme-text-secondary mt-1">
                  Join our network of food donors and NGOs. Let's work together
                  to eliminate food waste.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div>
                <h4 className="font-semibold text-theme-text ">
                  Technical Support
                </h4>
                <p className="text-sm text-theme-text-secondary dark:text-theme-text-secondary mt-1">
                  Experiencing an issue with the application? Submit a request
                  and our engineers will investigate.
                </p>
              </div>
            </div>
          </div>

          <div
            id="faq"
            className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-2xl font-bold tracking-tight">
              Frequently Asked Questions
            </h3>

            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#111113]">
                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 text-theme-text ">
                    <span>How do I become a registered NGO?</span>
                    <span className="transition group-open:rotate-180">
                      <ChevronDown className="w-5 h-5 text-theme-text-secondary" />
                    </span>
                  </summary>
                  <div className="text-theme-text-secondary dark:text-theme-text-secondary mt-2 px-4 pb-4">
                    Sign up for an account, complete your profile, and upload
                    the necessary verification documents. Our team processes
                    verifications within 48 hours.
                  </div>
                </details>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#111113]">
                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 text-theme-text ">
                    <span>Is the service free to use?</span>
                    <span className="transition group-open:rotate-180">
                      <ChevronDown className="w-5 h-5 text-theme-text-secondary" />
                    </span>
                  </summary>
                  <div className="text-theme-text-secondary dark:text-theme-text-secondary mt-2 px-4 pb-4">
                    Yes, UniteMeal is completely free for food donors,
                    and registered NGOs.
                  </div>
                </details>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#111113]">
                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 text-theme-text ">
                    <span>How can I track the impact of my donations?</span>
                    <span className="transition group-open:rotate-180">
                      <ChevronDown className="w-5 h-5 text-theme-text-secondary" />
                    </span>
                  </summary>
                  <div className="text-theme-text-secondary dark:text-theme-text-secondary mt-2 px-4 pb-4">
                    Once registered as a donor, you can view your impact
                    metrics—such as total meals saved and equivalent CO2
                    emissions reduced—directly in your dashboard.
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#111113] rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            <h2 className="text-2xl font-bold mb-6 text-theme-text ">
              Send us a message
            </h2>

            {success ? (
              <div className="p-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 text-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Message Received</h3>
                <p className="text-sm">
                  Thank you for reaching out. We will review your message and
                  get back to you shortly.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSuccess(false)}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="bg-white dark:bg-[#09090b]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="jane@example.com"
                    className="bg-white dark:bg-[#09090b]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <div className="relative">
                    <select
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-theme-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#09090b] dark:ring-offset-slate-950 dark:placeholder:text-theme-text-secondary dark:focus-visible:ring-slate-300"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="donor">Become a Donor</option>
                      <option value="ngo">Register as NGO</option>
                      <option value="support">Technical Support</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="How can we help you today?"
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-theme-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#09090b] dark:ring-offset-slate-950 dark:placeholder:text-theme-text-secondary dark:focus-visible:ring-slate-300 resize-none"
                  ></textarea>
                </div>
                <Button
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

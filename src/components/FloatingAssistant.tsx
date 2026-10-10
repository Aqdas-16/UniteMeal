import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/AuthContext';

export function FloatingAssistant() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{id: number, role: 'user'|'ass', text: string}[]>([
    { id: 0, role: 'ass', text: 'Hi! I am the UniteMeal Assistant. How can I help you today? Ask me about Restaurants, NGOs, Volunteers, or Certificates.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const currentInput = input.trim();
    const newMessages = [...messages, { id: Date.now(), role: 'user' as const, text: currentInput }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const { getChatbotResponse } = await import('@/src/lib/chatbotKnowledgeBase');
      
      setTimeout(() => {
        const reply = getChatbotResponse(currentInput);
        setMessages(prev => [...prev, { id: Date.now(), role: 'ass', text: reply }]);
        setIsTyping(false);
      }, 800);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'ass', text: 'I am currently unable to answer. Please try again shortly.' }]);
      setIsTyping(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-theme-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className="w-5 h-5" />
                UniteMeal Assistant
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-full" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto min-h-[300px] flex flex-col gap-3 bg-slate-50 dark:bg-[#09090b] scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-theme-surface border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-theme-surface border border-slate-200 dark:border-slate-800 rounded-bl-sm shadow-sm flex gap-1">
                       <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }} className="w-2 h-2 rounded-full bg-slate-400" />
                       <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }} className="w-2 h-2 rounded-full bg-slate-400" />
                       <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.4 }} className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            
            <div className="px-3 pb-2 pt-1 bg-white dark:bg-theme-surface border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {(() => {
                if (profile?.role === 'donor') return ["How to donate food?", "Certificate?", "Is it free?"];
                if (profile?.role === 'ngo') return ["How does NGO work?", "Delivery partners?", "Certificate?"];
                if (profile?.role === 'volunteer') return ["How deliveries work?", "Certificate?", "Live tracking?"];
                return ["How does it work?", "How to donate food?", "Cost?"];
              })().map(q => (
                <button 
                  key={q}
                  type="button"
                  onClick={() => {
                    setInput(q);
                  }}
                  className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-theme-surface flex gap-2 shrink-0 border-t border-slate-100 dark:border-slate-800/50">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 rounded-full bg-slate-100 dark:bg-slate-900 border-transparent focus-visible:ring-emerald-500" disabled={isTyping} />
              <Button type="submit" size="icon" className="rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0 transition-transform active:scale-[0.98]" disabled={isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button 
          size="icon" 
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-xl border-4 border-white dark:border-[#09090b]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        </Button>
      </motion.div>
    </>
  );
}

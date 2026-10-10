const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingAssistant.tsx', 'utf8');

// replace everything from `const handleSend = async (e: React.FormEvent) => {` 
// to `return (`

const start = "const handleSend = async (e: React.FormEvent) => {";
const end = "  return (";

const startIndex = code.indexOf(start);
const endIndex = code.indexOf(end, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newLogic = `const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const currentInput = input.trim();
    const newMessages = [...messages, { id: Date.now(), role: 'user' as const, text: currentInput }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const { getChatbotResponse } = await import('@/lib/chatbotKnowledgeBase');
      
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

`;
  
  code = code.substring(0, startIndex) + newLogic + code.substring(endIndex);
  
  // also change the initial message
  code = code.replace(
      "I can help optimize routes, summarize analytics, or guide you through the platform.", 
      "Ask me about Restaurants, NGOs, Volunteers, or Certificates."
  );
  
  fs.writeFileSync('src/components/FloatingAssistant.tsx', code);
}

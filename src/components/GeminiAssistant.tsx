import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderCircle, Send, Sparkles, X, Plus } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { post } from '@/services/api';

type ChatItem = {
  _id: string;
  name: string;
  price: number;
  canteenName: string;
  prepTime: string;
  inStock: boolean;
};

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  items?: ChatItem[];
};

const quickPrompts = ['Best under ₹100', 'Fast vegetarian', 'What is trending?'];

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

export default function GeminiAssistant({ isOpen, onClose, pathname }: GeminiAssistantProps) {
  const { addToCart, state } = useApp();

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: '🍕 Hey foodie! Tell me your budget or craving, and I\'ll find something delicious for you!' },
  ]);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const nextId = useRef(2);

  const hidden = ['/splash', '/onboarding', '/login', '/canteen/dashboard', '/admin/dashboard'].includes(pathname);
  const hasCartBar = state.cart.length > 0;

  const panelHeightClass = useMemo(() => {
    if (hasCartBar) return 'h-[min(480px,calc(100dvh-16rem))]';
    return 'h-[min(480px,calc(100dvh-13rem))]';
  }, [hasCartBar]);

  if (hidden) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    if (trimmed.toLowerCase() === 'cls' || trimmed.toLowerCase() === '/clear') {
      setMessages([{ id: nextId.current++, role: 'assistant', text: 'Chat cleared. What can I help you find?' }]);
      setInput('');
      setHistoryIndex(-1);
      return;
    }

    const userMessage: ChatMessage = { id: nextId.current++, role: 'user', text: trimmed };
    setMessages((current) => [...current, userMessage]);
    
    setInputHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInput('');
    setIsThinking(true);

    try {
      // Send up to 6 previous messages for context
      const history = messages
        .filter(m => m.id !== 1) // Skip the default greeting
        .slice(-6)
        .map(m => ({ role: m.role, content: m.text }));

      const response = await post<{ text: string, items?: ChatItem[] }>('/chat', { 
        message: trimmed,
        history
      });
      setMessages((current) => [
        ...current, 
        { 
          id: nextId.current++, 
          role: 'assistant', 
          text: response.data.text,
          items: response.data.items 
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current, 
        {
          id: nextId.current++,
          role: 'assistant',
          text: `Oops! I couldn't reach the backend right now. Please try again later.`,
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const newIndex = historyIndex === -1 ? inputHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(inputHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= inputHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(inputHistory[newIndex]);
        }
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-none flex justify-center">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
            aria-label="Smart food assistant"
            className={`pointer-events-auto w-[calc(100%-1.5rem)] max-w-[400px] mb-16 ${panelHeightClass} overflow-hidden rounded-2xl border border-[#FFD6BC]/15 bg-[#1C1217]/95 shadow-[0 24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl flex flex-col`}
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#2B1A22]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl food-gradient flex items-center justify-center shadow-glow-orange-sm">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">Smart Food Assistant</h2>
                  <p className="text-[10px] text-[#A9C9B4]">Live Menu Guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close assistant"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#C4B7B0] hover:bg-white/[0.08]"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[86%] px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'food-gradient text-white rounded-2xl rounded-br-md'
                      : 'bg-[#302229] text-[#F6EEE9] border border-white/[0.06] rounded-2xl rounded-bl-md'
                  }`}>
                    {message.text}
                    {message.items && message.items.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {message.items.map((item) => (
                          <div key={item._id} className="bg-black/20 p-2 rounded-lg flex items-center justify-between border border-white/5">
                            <div>
                              <div className="text-[11px] font-semibold text-white">{item.name}</div>
                              <div className="text-[10px] text-[#A9C9B4] mt-0.5">
                                {item.canteenName} • ₹{item.price} • {item.prepTime}
                              </div>
                              {!item.inStock && <div className="text-[9px] text-red-400 mt-0.5">Currently out of stock</div>}
                            </div>
                            {item.inStock && (
                              <button 
                                onClick={() => addToCart(item._id)}
                                className="w-7 h-7 flex-shrink-0 bg-[#FF7043]/90 hover:bg-[#FF7043] rounded-full flex items-center justify-center text-white transition-colors ml-2"
                                aria-label="Add to cart"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center gap-2 text-[11px] text-[#C4B7B0]">
                  <LoaderCircle size={14} className="animate-spin text-[#FF7043]" />
                  Finding a tasty match...
                </div>
              )}
            </div>

            <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={isThinking}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[#FF7043]/30 bg-[#FF7043]/10 text-[10px] font-medium text-[#FFC1A8] disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.08] flex gap-2 bg-[#21161B]">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about food..."
                aria-label="Message smart food assistant"
                className="min-w-0 flex-1 h-11 rounded-xl border border-white/[0.08] bg-[#140D10] px-3 text-sm text-white placeholder:text-[#887A74] outline-none focus:border-[#FF7043]/60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                aria-label="Send message"
                className="w-11 h-11 rounded-xl food-gradient flex items-center justify-center text-white disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

    </div>
  );
}

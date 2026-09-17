import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User } from 'lucide-react';
import { aiAPI } from '@/services/api';

export default function AskPesaBot({ primaryColor }) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await aiAPI.askAssistant(trimmed);
      const answer = res?.data?.data?.answer || t('chat.askBot.errorGeneric');
      setMessages((prev) => [...prev, { role: 'bot', text: answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', text: t('chat.askBot.errorGeneric'), isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500">{t('chat.askBot.title')}</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 flex gap-2 items-start ${
                msg.role === 'user'
                  ? 'text-white rounded-br-md'
                  : msg.isError
                  ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                  : 'bg-white border rounded-bl-md'
              }`}
              style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}
            >
              {msg.role === 'bot' && <Bot size={14} className="mt-0.5 shrink-0" />}
              <p className="text-sm">{msg.text}</p>
              {msg.role === 'user' && <User size={14} className="mt-0.5 shrink-0" />}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t bg-white safe-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('chat.askBot.placeholder')}
            maxLength={1000}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 text-sm"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="p-2 rounded-full text-white disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

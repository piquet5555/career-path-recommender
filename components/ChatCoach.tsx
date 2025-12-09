import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, CareerPlan, ResumeCritique } from '../types';
import { createCoachChat } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';
import { Chat } from '@google/genai';

interface Props {
  plan: CareerPlan | null;
  critique: ResumeCritique | null;
}

const ChatCoach: React.FC<Props> = ({ plan, critique }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session when context changes or on mount
    const context = `
      CAREER PLAN: ${plan ? JSON.stringify(plan) : 'Not generated yet.'}
      RESUME CRITIQUE: ${critique ? JSON.stringify(critique) : 'Not generated yet.'}
    `;
    
    // We don't pass existing messages here because createCoachChat manages the history internally
    // if we were persisting the session object. 
    // However, to keep it simple in React strict mode, we re-init if context changes radically, 
    // but ideally we keep one session.
    if (!chatSessionRef.current) {
        chatSessionRef.current = createCoachChat([], context);
        // Add welcome message
        setMessages([
            { role: 'model', content: "Hi! I'm your AI Career Coach. I have access to your plan and resume critique. What would you like to discuss?" }
        ]);
    }
  }, [plan, critique]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      const responseText = result.text || "I'm having trouble thinking right now.";
      
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
           <h3 className="font-bold text-gray-800">Coach AI</h3>
           <p className="text-xs text-gray-500">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              {msg.role === 'user' ? (
                  <p>{msg.content}</p>
              ) : (
                  <MarkdownRenderer content={msg.content} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none px-5 py-3 border border-gray-100 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask specific questions about your plan or resume..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatCoach;
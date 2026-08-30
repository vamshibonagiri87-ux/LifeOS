import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Bot, Send, User, Sparkles, Loader2, Lightbulb } from 'lucide-react';

export function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm your LifeOS Intelligence Assistant. Ask me anything about your current obligations, upcoming deadlines, missing documents, or why a specific task has been prioritized.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedChips = [
    'What should I do today?',
    'What is due this week?',
    'Which responsibilities are blocked?',
    'What documents are missing?',
    'Why is my top task urgent?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/query', { query: text });
      const assistantMessage = {
        role: 'assistant',
        content: res.data.data.answer || 'I could not process this question.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error checking your obligations. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[600px] flex flex-col rounded-3xl bg-surface/80 border border-border/80 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              LifeOS Obligation Intelligence Assistant
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Context-Aware
              </span>
            </h3>
            <p className="text-xs text-muted">Grounded in your real-time responsibilities and ingested sources</p>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 text-sm leading-relaxed ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-primary-500/15 border border-primary-500/30 text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-4 rounded-2xl max-w-xl whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none shadow-md shadow-primary-600/20'
                  : 'bg-surface-hover/80 border border-border/80 text-foreground rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-surface-hover border border-border text-foreground flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-sm">
            <div className="w-8 h-8 rounded-xl bg-primary-500/15 border border-primary-500/30 text-primary-400 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-surface-hover/80 border border-border/80 text-muted flex items-center gap-2">
              <span>Reasoning over your obligations graph...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2.5 bg-surface/40 border-t border-border/40 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
        {suggestedChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-3 py-1 rounded-full bg-surface-hover/80 hover:bg-primary-500/20 hover:text-primary-300 border border-border text-xs text-muted font-medium transition shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t border-border bg-surface flex items-center gap-3"
      >
        <input
          type="text"
          placeholder="Ask LifeOS what to do, what's due, or why a task matters..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-hover/70 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition disabled:opacity-40 shadow-md shadow-primary-600/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

import React from 'react';
import { AIChat } from '../components/AIChat/AIChat.jsx';
import { Bot, Sparkles, ShieldCheck } from 'lucide-react';

export function Assistant() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          AI Obligation Assistant
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Chat naturally with your digital life command center
        </p>
      </div>

      <AIChat />
    </div>
  );
}

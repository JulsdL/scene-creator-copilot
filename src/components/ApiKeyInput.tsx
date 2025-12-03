"use client";

import { useState } from "react";

interface ApiKeyInputProps {
  currentKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function ApiKeyInput({ currentKey, onSave, onClear }: ApiKeyInputProps) {
  const [input, setInput] = useState("");
  const [isEditing, setIsEditing] = useState(!currentKey);

  const handleSave = () => {
    if (input.trim()) {
      onSave(input.trim());
      setInput("");
      setIsEditing(false);
    }
  };

  const handleClear = () => {
    onClear();
    setInput("");
    setIsEditing(true);
  };

  if (!isEditing && currentKey) {
    return (
      <div className="luxury-card p-2 px-3 bg-slate-800/80 backdrop-blur-md max-w-xs border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm">🔑</span>
          <div className="text-xs font-mono text-slate-400">
            {currentKey.substring(0, 8)}...
          </div>
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              Change
            </button>
            <button
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="luxury-card p-5 bg-slate-900/90 backdrop-blur-xl max-w-sm border border-[var(--accent-gold)]/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/10 flex items-center justify-center text-[var(--accent-gold)]">
          🔑
        </div>
        <div className="font-semibold text-sm text-slate-200">API Access Required</div>
      </div>
      <div className="mb-4 text-xs text-slate-400 leading-relaxed">
        Please enter your Google AI API key to initialize the generation engine.
      </div>
      <div className="space-y-3">
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Paste your API key here..."
          className="w-full px-3 py-2.5 rounded-md border border-slate-700 bg-black/40 font-mono text-xs text-slate-200 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] placeholder-slate-600 transition-all"
          autoFocus
        />
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!input.trim()}
            className="flex-1 luxury-btn bg-[var(--accent-gold)] text-slate-900 hover:bg-[var(--accent-gold)]/90 border-none font-bold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Authenticate
          </button>
          {currentKey && (
            <button
              onClick={() => setIsEditing(false)}
              className="luxury-btn bg-transparent border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 py-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

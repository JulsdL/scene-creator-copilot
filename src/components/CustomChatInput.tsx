"use client";

import { type InputProps } from "@copilotkit/react-ui";
import { useChatInput } from "@/lib/chat-input-context";
import { useEffect, useRef } from "react";

export function CustomChatInput({ inProgress, onSend }: InputProps) {
  const { inputValue, setInputValue, setInputRef } = useChatInput();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Register the input ref with context so other components can focus it
  useEffect(() => {
    setInputRef(inputRef as any);
  }, [setInputRef]);

  // Focus and move cursor to end when value changes externally
  useEffect(() => {
    if (inputValue && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const length = inputValue.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [inputValue]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-3 p-4 border-t border-white/10 bg-[var(--bg-primary)]">
      <div className="relative flex-1">
        <textarea
          ref={inputRef}
          disabled={inProgress}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your command..."
          rows={1}
          className="w-full px-4 py-3 luxury-input text-sm resize-none disabled:opacity-50 min-h-[50px] max-h-[150px] bg-[var(--bg-secondary)] border-transparent focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] placeholder-slate-500"
        />
      </div>
      <button
        disabled={inProgress || !inputValue.trim()}
        onClick={handleSubmit}
        className="luxury-btn self-end mb-[1px] h-[46px] px-6 text-sm font-medium tracking-wide bg-[var(--accent-primary)] text-white hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 border-none shadow-lg shadow-blue-900/20"
      >
        Send
      </button>
    </div>
  );
}

"use client";

import { useCoAgent, useCopilotAction, useCopilotReadable, useHumanInTheLoop } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { CustomChatInput } from "@/components/CustomChatInput";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { ChatInputProvider } from "@/lib/chat-input-context";
import { AgentState } from "@/lib/types";
import { useRef, useMemo, useState, useEffect } from "react";

const API_KEY_STORAGE_KEY = "google_api_key";

export default function SceneCreatorPage() {
  // API key state with localStorage persistence
  const [apiKey, setApiKeyState] = useState("");

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
    }
  }, []);

  // Shared state with the LangGraph agent
  const { state, setState, running } = useCoAgent<AgentState>({
    name: "sample_agent",
    initialState: {
      characters: [],
      backgrounds: [],
      scenes: [],
      apiKey: "",
    },
  });

  // Sync API key to agent state when it changes
  useEffect(() => {
    if (apiKey && apiKey !== state.apiKey) {
      setState((prevState) => ({
        characters: prevState?.characters || [],
        backgrounds: prevState?.backgrounds || [],
        scenes: prevState?.scenes || [],
        apiKey,
      }));
    }
  }, [apiKey, state.apiKey, setState]);

  // Save API key to localStorage and agent state
  const saveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKeyState(key);
    setState((prevState) => ({
      characters: prevState?.characters || [],
      backgrounds: prevState?.backgrounds || [],
      scenes: prevState?.scenes || [],
      apiKey: key,
    }));
  };

  // Clear API key from localStorage and agent state
  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKeyState("");
    setState((prevState) => ({
      characters: prevState?.characters || [],
      backgrounds: prevState?.backgrounds || [],
      scenes: prevState?.scenes || [],
      apiKey: "",
    }));
  };

  // Keep a reference to the last valid state to prevent flickering during requests
  const lastValidState = useRef<AgentState>({
    characters: [],
    backgrounds: [],
    scenes: [],
  });

  // Update reference when we have actual data
  const displayState = useMemo(() => {
    const hasData =
      (state.characters && state.characters.length > 0) ||
      (state.backgrounds && state.backgrounds.length > 0) ||
      (state.scenes && state.scenes.length > 0);

    if (hasData) {
      lastValidState.current = {
        characters: state.characters || [],
        backgrounds: state.backgrounds || [],
        scenes: state.scenes || [],
      };
    }

    // During loading, show the last known state if current is empty
    if (running && !hasData && (
      lastValidState.current.characters.length > 0 ||
      lastValidState.current.backgrounds.length > 0 ||
      lastValidState.current.scenes.length > 0
    )) {
      return lastValidState.current;
    }

    return {
      characters: state.characters || [],
      backgrounds: state.backgrounds || [],
      scenes: state.scenes || [],
    };
  }, [state, running]);

  // Make artifact data readable to the Copilot for better context awareness
  useCopilotReadable({
    description: "Available characters that can be used in scenes",
    value: displayState.characters.map(c => ({ id: c.id, name: c.name, description: c.description })),
  });

  useCopilotReadable({
    description: "Available backgrounds that can be used in scenes",
    value: displayState.backgrounds.map(b => ({ id: b.id, name: b.name, description: b.description })),
  });

  useCopilotReadable({
    description: "Created scenes combining characters and backgrounds",
    value: displayState.scenes.map(s => ({
      id: s.id,
      name: s.name,
      characterIds: s.characterIds,
      backgroundId: s.backgroundId
    })),
  });

  // Human-in-the-loop prompt approval before image generation
  useHumanInTheLoop({
    name: "approve_image_prompt",
    description: "Request user approval for an image generation prompt before creating the image. Call this BEFORE calling create_character, create_background, or create_scene.",
    parameters: [
      {
        name: "artifact_type",
        type: "string",
        description: "Type of artifact: 'character', 'background', or 'scene'",
        required: true,
      },
      {
        name: "name",
        type: "string",
        description: "Name of the artifact being created",
        required: true,
      },
      {
        name: "prompt",
        type: "string",
        description: "The image generation prompt to be approved",
        required: true,
      },
    ],
    render: ({ args, status, respond, result }) => {
      if (status === "executing" && respond) {
        return (
          <PromptApprovalCard
            artifactType={args.artifact_type as string}
            name={args.name as string}
            prompt={args.prompt as string}
            onApprove={(finalPrompt) => respond({ approved: true, prompt: finalPrompt })}
            onCancel={() => respond({ approved: false })}
          />
        );
      }

      if (status === "complete" && result) {
        const res = result as { approved: boolean; prompt?: string };
        return (
          <div className="my-3 rounded-lg border border-white/10 bg-white/5 overflow-hidden shadow-sm px-4 py-3">
            <div className="flex items-center gap-2">
              {res.approved ? (
                <>
                  <span className="text-emerald-500">✓</span>
                  <span className="text-sm text-slate-300">Prompt approved</span>
                </>
              ) : (
                <>
                  <span className="text-red-500">✕</span>
                  <span className="text-sm text-slate-300">Generation cancelled</span>
                </>
              )}
            </div>
          </div>
        );
      }

      return <></>;
    },
  });

  // Generative UI for create_character tool
  useCopilotAction({
    name: "create_character",
    available: "disabled",
    render: ({ status, args, result }) => (
      <ToolCard
        icon="👤"
        title="Creating Character"
        status={status}
        description={args?.description as string}
        result={result ? `Created "${(result as any)?.name}"` : undefined}
      />
    ),
  });

  // Generative UI for create_background tool
  useCopilotAction({
    name: "create_background",
    available: "disabled",
    render: ({ status, args, result }) => (
      <ToolCard
        icon="🏞️"
        title="Creating Background"
        status={status}
        description={args?.description as string}
        result={result ? `Created "${(result as any)?.name}"` : undefined}
      />
    ),
  });

  // Generative UI for create_scene tool
  useCopilotAction({
    name: "create_scene",
    available: "disabled",
    render: ({ status, args, result }) => (
      <ToolCard
        icon="🎬"
        title="Composing Scene"
        status={status}
        description={args?.description as string}
        result={result ? `Created "${(result as any)?.name}"` : undefined}
      />
    ),
  });

  // Generative UI for edit_character tool
  useCopilotAction({
    name: "edit_character",
    available: "disabled",
    render: ({ status, args, result }) => (
      <ToolCard
        icon="✏️"
        title="Editing Character"
        status={status}
        description={args?.edit_description as string}
        result={result && !(result as any)?.error ? `Updated "${(result as any)?.name}"` : (result as any)?.error}
      />
    ),
  });

  // Generative UI for edit_background tool
  useCopilotAction({
    name: "edit_background",
    available: "disabled",
    render: ({ status, args, result }) => (
      <ToolCard
        icon="✏️"
        title="Editing Background"
        status={status}
        description={args?.edit_description as string}
        result={result && !(result as any)?.error ? `Updated "${(result as any)?.name}"` : (result as any)?.error}
      />
    ),
  });

  // Generative UI for edit_scene tool
  useCopilotAction({
    name: "edit_scene",
    available: "disabled",
    render: ({ status, args, result }) => (
      <ToolCard
        icon="✏️"
        title="Editing Scene"
        status={status}
        description={args?.edit_description as string}
        result={result && !(result as any)?.error ? `Updated "${(result as any)?.name}"` : (result as any)?.error}
      />
    ),
  });

  // Show only API key input if no key is set
  if (!apiKey) {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="max-w-2xl w-full px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-light mb-4 text-white tracking-tight">Scene Creator</h1>
            <p className="text-lg text-slate-400 font-light">
              AI-powered scene generation with Gemini 3 & Nano Banana
            </p>
          </div>
          <ApiKeyInput
            currentKey={apiKey}
            onSave={saveApiKey}
            onClear={clearApiKey}
          />
        </div>
      </main>
    );
  }

  return (
    <ChatInputProvider>
      <main className="h-screen w-screen flex relative">
        {/* Floating API Key Tooltip - Top Left */}
        <div className="absolute bottom-4 left-4 z-50">
          <ApiKeyInput
            currentKey={apiKey}
            onSave={saveApiKey}
            onClear={clearApiKey}
          />
        </div>

        {/* Main artifact display panel */}
        <ArtifactPanel
          characters={displayState.characters}
          backgrounds={displayState.backgrounds}
          scenes={displayState.scenes}
        />

        {/* Chat sidebar */}
        <CopilotSidebar
          clickOutsideToClose={false}
          defaultOpen={true}
          Input={CustomChatInput}
          labels={{
            title: "Scene Creator",
            initial: `Welcome to Scene Creator!

I'll help you create scenes by generating characters and backgrounds, then combining them together.

**To get started:**
1. Describe a character you'd like to create
2. Describe a background/environment
3. Ask me to combine them into a scene

What would you like to create first?`,
          }}
        />
      </main>
    </ChatInputProvider>
  );
}

// Tool progress card component for Generative UI
function ToolCard({
  icon,
  title,
  status,
  description,
  result,
}: {
  icon: string;
  title: string;
  status: string;
  description?: string;
  result?: string;
}) {
  const isComplete = status === "complete";
  const isExecuting = status === "executing" || status === "inProgress";

  return (
    <div className="my-4 luxury-card p-4">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 text-xl font-bold text-[var(--accent-gold)]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-slate-200">{title}</span>
            {isExecuting && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-0.5 rounded-full border border-[var(--accent-primary)]/30">
                <span className="animate-pulse">Processing...</span>
              </span>
            )}
            {isComplete && (
              <span className="text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Done</span>
            )}
          </div>
          {description && (
            <p className="text-sm text-slate-400 mb-2 border-l-2 border-slate-700 pl-2">
              {description}
            </p>
          )}
          {isComplete && result && (
            <div className="mt-2 text-sm text-slate-300 p-3 rounded-md bg-white/5 border border-white/10">
              → {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Prompt approval card component for HITL
function PromptApprovalCard({
  artifactType,
  name,
  prompt,
  onApprove,
  onCancel,
}: {
  artifactType: string;
  name: string;
  prompt: string;
  onApprove: (prompt: string) => void;
  onCancel: () => void;
}) {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [isEditing, setIsEditing] = useState(false);

  const icon = artifactType === "character" ? "👤" : artifactType === "background" ? "🏞️" : "🎬";

  return (
    <div className="my-4 luxury-card p-0 overflow-hidden border-[var(--accent-gold)]/30 shadow-[0_0_15px_rgba(197,165,114,0.1)]">
      <div className="flex items-center gap-3 p-4 bg-[var(--accent-gold)]/10 border-b border-[var(--accent-gold)]/20">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-[var(--accent-gold)] tracking-wide text-sm uppercase">
          Approve {artifactType}
        </span>
      </div>

      <div className="p-4">
        <div className="text-xs font-medium text-slate-500 uppercase mb-2 tracking-wider">Target: {name}</div>
        {isEditing ? (
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full p-3 text-sm rounded-md border border-slate-600 bg-slate-900/50 text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)] transition-all"
            rows={6}
            autoFocus
          />
        ) : (
          <div className="bg-slate-900/50 rounded-md border border-slate-700/50 p-3 text-sm text-slate-300 font-light leading-relaxed">
            {editedPrompt}
          </div>
        )}
      </div>

      <div className="flex gap-2 p-4 bg-black/20 border-t border-white/5">
        <button
          onClick={() => onApprove(editedPrompt)}
          className="flex-1 luxury-btn bg-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/90 text-slate-900 border-none font-bold"
        >
          {isEditing ? "Save & Run" : "Execute"}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="luxury-btn bg-transparent border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        <button
          onClick={onCancel}
          className="luxury-btn bg-transparent border-red-900/50 text-red-400 hover:bg-red-900/20 hover:border-red-800"
        >
          Abort
        </button>
      </div>
    </div>
  );
}

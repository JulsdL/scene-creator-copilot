"use client";

import { useCoAgent, useCopilotAction, useCopilotReadable, useHumanInTheLoop } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { CustomChatInput } from "@/components/CustomChatInput";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { ChatInputProvider } from "@/lib/chat-input-context";
import { AgentState } from "@/lib/types";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";

const API_KEY_STORAGE_KEY = "google_api_key";
type PendingToolName = "create_character" | "create_background" | "create_scene";

type PendingAction = {
  id: string;
  toolName: PendingToolName;
  targetName: string;
  title: string;
  icon: string;
  description: string;
};

const TOOL_METADATA: Record<PendingToolName, { icon: string; title: string }> = {
  create_character: { icon: "👤", title: "Creating Character" },
  create_background: { icon: "🏞️", title: "Creating Background" },
  create_scene: { icon: "🎬", title: "Composing Scene" },
};

const createPendingId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
};

const mapArtifactTypeToTool = (artifactType: string): PendingToolName => {
  const normalized = (artifactType || "").toLowerCase();
  if (normalized === "background") {
    return "create_background";
  }
  if (normalized === "scene") {
    return "create_scene";
  }
  return "create_character";
};

const formatPendingDescription = (promptText: string) => {
  const trimmed = promptText.trim();
  if (!trimmed) {
    return "Awaiting image generation...";
  }
  return trimmed.length > 300 ? `${trimmed.slice(0, 297)}...` : trimmed;
};

export default function SceneCreatorPage() {
  // API key state with localStorage persistence
  const [apiKey, setApiKeyState] = useState("debug");
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

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

  const registerPendingAction = useCallback((artifactType: string, targetName: string, promptText: string) => {
    const toolName = mapArtifactTypeToTool(artifactType);
    const meta = TOOL_METADATA[toolName];
    const description = formatPendingDescription(promptText);
    setPendingActions((prev) => [
      ...prev.filter((action) => !(action.toolName === toolName && action.targetName === targetName)),
      {
        id: createPendingId(),
        toolName,
        targetName,
        title: meta.title,
        icon: meta.icon,
        description,
      },
    ]);
  }, []);

  const clearPendingAction = useCallback((toolName: PendingToolName, targetName?: string) => {
    setPendingActions((prev) =>
      prev.filter((action) => {
        if (action.toolName !== toolName) {
          return true;
        }
        if (!targetName) {
          return false;
        }
        return action.targetName !== targetName;
      }),
    );
  }, []);

  useEffect(() => {
    if (pendingActions.length === 0) {
      return;
    }
    setPendingActions((prev) =>
      prev.filter((action) => {
        if (action.toolName === "create_character") {
          return !displayState.characters.some((c) => c.name === action.targetName);
        }
        if (action.toolName === "create_background") {
          return !displayState.backgrounds.some((b) => b.name === action.targetName);
        }
        return !displayState.scenes.some((s) => s.name === action.targetName);
      }),
    );
  }, [
    displayState.characters,
    displayState.backgrounds,
    displayState.scenes,
    pendingActions.length,
  ]);

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
            onStartPending={(finalPrompt) =>
              registerPendingAction(args.artifact_type as string, args.name as string, finalPrompt)
            }
            onApprove={(finalPrompt) => respond({ approved: true, prompt: finalPrompt })}
            onCancel={() => respond({ approved: false })}
          />
        );
      }

      if (status === "complete" && result) {
        const res = result as { approved: boolean; prompt?: string };
        return (
          <div className="my-3 rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-sm px-4 py-3">
            <div className="flex items-center gap-2">
              {res.approved ? (
                <>
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-neutral-600">Prompt approved</span>
                </>
              ) : (
                <>
                  <span className="text-red-500">✕</span>
                  <span className="text-sm text-neutral-600">Generation cancelled</span>
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
      <ActionToolCard
        toolName="create_character"
        artifactName={args?.name as string}
        clearPending={clearPendingAction}
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
      <ActionToolCard
        toolName="create_background"
        artifactName={args?.name as string}
        clearPending={clearPendingAction}
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
      <ActionToolCard
        toolName="create_scene"
        artifactName={args?.name as string}
        clearPending={clearPendingAction}
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold uppercase mb-4">Scene Creator</h1>
            <p className="text-lg opacity-70">
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
      <main className="h-screen w-screen flex flex-col lg:flex-row relative">
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
        <div className="inline-chat-sidebar w-full max-w-full lg:w-[420px] lg:max-w-[420px] shrink-0 h-full flex flex-col">
          <CopilotSidebar
            className="inline-chat-sidebar w-full max-w-full lg:w-[420px] lg:max-w-[420px] shrink-0 flex-1"
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
          {pendingActions.length > 0 && (
            <div className="px-4 pb-4 pt-2 border-t-2 border-black bg-[var(--bg-primary)] max-h-64 overflow-y-auto">
              {pendingActions.map((action) => (
                <ToolCard
                  key={action.id}
                  icon={action.icon}
                  title={action.title}
                  status="inProgress"
                  description={action.description}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </ChatInputProvider>
  );
}

// Tool progress card component for Generative UI
type ToolCardProps = {
  icon: string;
  title: string;
  status: string;
  description?: string;
  result?: string;
};

function ToolCard({
  icon,
  title,
  status,
  description,
  result,
}: ToolCardProps) {
  const isComplete = status === "complete";
  const isExecuting = status === "executing" || status === "inProgress";

  return (
    <div className="my-4 brutalist-card p-4">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 border-2 border-black bg-[var(--accent-yellow)] text-xl font-bold">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold uppercase tracking-wider text-sm">{title}</span>
            {isExecuting && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-[var(--accent-blue)] text-white px-2 py-0.5 border border-black">
                <span className="animate-pulse">PROCESSING</span>
              </span>
            )}
            {isComplete && (
              <span className="text-xs font-bold bg-[var(--accent-red)] text-white px-2 py-0.5 border border-black">DONE</span>
            )}
          </div>
          {description && (
            <p className="text-sm text-neutral-600 mb-2 border-l-2 border-neutral-300 pl-2">
              {description}
            </p>
          )}
          {isComplete && result && (
            <div className="mt-2 text-sm font-bold p-2 bg-neutral-100 border border-black">
              → {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ActionToolCardProps = ToolCardProps & {
  toolName: PendingToolName;
  artifactName?: string;
  clearPending: (tool: PendingToolName, targetName?: string) => void;
};

function ActionToolCard({
  toolName,
  artifactName,
  clearPending,
  ...toolCardProps
}: ActionToolCardProps) {
  useEffect(() => {
    if (artifactName) {
      clearPending(toolName, artifactName);
    }
  }, [artifactName, toolName, clearPending]);

  return <ToolCard {...toolCardProps} />;
}

// Prompt approval card component for HITL
function PromptApprovalCard({
  artifactType,
  name,
  prompt,
  onStartPending,
  onApprove,
  onCancel,
}: {
  artifactType: string;
  name: string;
  prompt: string;
  onStartPending?: (prompt: string) => void;
  onApprove: (prompt: string) => void;
  onCancel: () => void;
}) {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [isEditing, setIsEditing] = useState(false);

  const icon = artifactType === "character" ? "👤" : artifactType === "background" ? "🏞️" : "🎬";

  return (
    <div className="my-4 brutalist-card bg-[var(--accent-yellow)] p-4">
      <div className="flex items-center gap-3 mb-4 border-b-2 border-black pb-2">
        <span className="text-2xl">{icon}</span>
        <span className="font-bold uppercase text-lg">
          APPROVE {artifactType}
        </span>
      </div>

      <div className="mb-4">
        <div className="text-xs font-bold uppercase mb-1 opacity-70">Target: {name}</div>
        {isEditing ? (
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full p-3 text-sm border-2 border-black bg-white resize-none focus:outline-none focus:shadow-[4px_4px_0px_0px_black]"
            rows={6}
            autoFocus
          />
        ) : (
          <div className="bg-white border-2 border-black p-3 text-sm font-mono">
            {editedPrompt}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (onStartPending) {
              onStartPending(editedPrompt);
            }
            onApprove(editedPrompt);
          }}
          className="flex-1 brutalist-btn bg-[var(--accent-blue)] text-black py-2 px-4 hover:bg-blue-700"
        >
          {isEditing ? "SAVE & RUN" : "EXECUTE"}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="brutalist-btn bg-black py-2 px-4"
        >
          {isEditing ? "CANCEL EDIT" : "EDIT"}
        </button>
        <button
          onClick={onCancel}
          className="brutalist-btn bg-[var(--accent-red)] text-black py-2 px-4"
        >
          ABORT
        </button>
      </div>
    </div>
  );
}

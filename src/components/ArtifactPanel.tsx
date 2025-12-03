"use client";

import { Character, Background, Scene } from "@/lib/types";
import { useChatInput } from "@/lib/chat-input-context";

interface ArtifactPanelProps {
  characters: Character[];
  backgrounds: Background[];
  scenes: Scene[];
}

export function ArtifactPanel({ characters, backgrounds, scenes }: ArtifactPanelProps) {
  const { setInputValue } = useChatInput();

  const handleEdit = (type: string, id: string) => {
    setInputValue(`[EDIT ${type} ${id}]: `);
  };
  const hasArtifacts = characters.length > 0 || backgrounds.length > 0 || scenes.length > 0;

  return (
    <div className="flex-1 p-8 overflow-auto bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)] pointer-events-none opacity-50" />

      {!hasArtifacts ? (
        <EmptyState />
      ) : (
        <div className="relative z-10 space-y-16 pb-20 max-w-7xl mx-auto">
          {scenes.length > 0 && (
            <ArtifactSection title="Scenes" count={scenes.length}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {scenes.map((scene) => (
                  <ArtifactCard key={scene.id} title={scene.name} type="Scene" onEdit={() => handleEdit("scene", scene.id)}>
                    {scene.imageUrl ? (
                      <div className="relative w-full h-64 overflow-hidden bg-slate-900 group">
                        <img
                          src={scene.imageUrl}
                          alt={scene.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-slate-800/50 flex flex-col items-center justify-center gap-3 text-slate-500 border-b border-white/5">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
                        <span className="text-xs uppercase tracking-widest font-medium">Rendering Scene...</span>
                      </div>
                    )}
                  </ArtifactCard>
                ))}
              </div>
            </ArtifactSection>
          )}

          {characters.length > 0 && (
            <ArtifactSection title="Characters" count={characters.length}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {characters.map((character) => (
                  <ArtifactCard key={character.id} title={character.name} type="Character" onEdit={() => handleEdit("character", character.id)}>
                    {character.imageUrl ? (
                      <div className="relative w-full h-48 overflow-hidden bg-slate-900 group">
                        <img
                          src={character.imageUrl}
                          alt={character.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-800/50 flex flex-col items-center justify-center gap-2 text-slate-500 border-b border-white/5">
                         <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
                         <span className="text-[10px] uppercase tracking-wider">Generating...</span>
                      </div>
                    )}
                  </ArtifactCard>
                ))}
              </div>
            </ArtifactSection>
          )}

          {backgrounds.length > 0 && (
            <ArtifactSection title="Locations" count={backgrounds.length}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {backgrounds.map((background) => (
                  <ArtifactCard key={background.id} title={background.name} type="Location" onEdit={() => handleEdit("background", background.id)}>
                    {background.imageUrl ? (
                      <div className="relative w-full h-48 overflow-hidden bg-slate-900 group">
                        <img
                          src={background.imageUrl}
                          alt={background.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-800/50 flex flex-col items-center justify-center gap-2 text-slate-500 border-b border-white/5">
                         <div className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
                         <span className="text-[10px] uppercase tracking-wider">Generating...</span>
                      </div>
                    )}
                  </ArtifactCard>
                ))}
              </div>
            </ArtifactSection>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 relative z-10">
      <div className="w-32 h-32 mb-8 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.1)]">
        <span className="text-5xl opacity-20">✨</span>
      </div>
      <h2 className="text-4xl font-light text-white mb-4 tracking-tight">Begin Creation</h2>
      <p className="text-slate-400 max-w-md text-lg font-light leading-relaxed">
        Your canvas is empty. Use the terminal on the right to generate characters, environments, and scenes.
      </p>
    </div>
  );
}

function ArtifactSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-light text-white tracking-wide uppercase">{title}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        <span className="text-sm font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full border border-[var(--accent-primary)]/20">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function ArtifactCard({ title, type, children, onEdit }: { title: string; type: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="luxury-card overflow-hidden group border-white/5 hover:border-white/20 bg-slate-900/40">
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/10">
          {type}
        </span>
      </div>
      {children}
      <div className="p-4 flex items-center justify-between gap-4">
        <p className="font-medium text-slate-200 truncate tracking-wide flex-1" title={title}>{title}</p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-widest font-bold"
            title="Edit Artifact"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

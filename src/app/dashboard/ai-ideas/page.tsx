// Path: src/app/dashboard/ai-ideas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles, Brain, Target, Zap, ChevronRight, Copy } from "lucide-react";

interface AiIdea {
  id: string;
  title: string;
  hook: string;
  viralScore: number;
  competition: string;
  estimatedViews: string;
  difficulty: string;
  tags: string[];
}

interface AiData {
  topNicheFocus: string;
  analysis: string;
  ideas: AiIdea[];
}

export default function AiIdeasPage() {
  const [data, setData] = useState<AiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai-ideas")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Brain className="w-8 h-8 animate-pulse text-accent-violet" />
          <p>Synthesizing current trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto p-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent-violet" />
            AI Opportunity Engine
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {data.analysis}
          </p>
        </div>
        <div className="bg-background/50 border border-border px-4 py-3 rounded-lg text-sm">
          <span className="text-muted-foreground">Current Focus: </span>
          <span className="font-bold text-accent-emerald">{data.topNicheFocus}</span>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 gap-6">
        {data.ideas.map((idea) => (
          <div key={idea.id} className="bg-card border border-border rounded-xl p-6 hover:border-accent-violet/50 transition-colors">
            
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              
              {/* Left Column: Title and Hook */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-background border border-border text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{idea.title}</h3>
                  <div className="bg-background/50 border border-border rounded-lg p-4 relative group">
                    <p className="text-sm text-foreground/80 italic">"{idea.hook}"</p>
                    <button className="absolute top-2 right-2 p-1.5 bg-card rounded-md border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-violet/10 hover:text-accent-violet">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Metrics */}
              <div className="lg:w-72 grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-background/50 border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Target className="w-3 h-3"/> Viral Score</p>
                  <p className="text-xl font-bold text-accent-emerald">{idea.viralScore}</p>
                </div>
                <div className="bg-background/50 border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Zap className="w-3 h-3"/> Views (Est)</p>
                  <p className="text-sm font-bold text-foreground mt-1.5">{idea.estimatedViews}</p>
                </div>
                <div className="bg-background/50 border border-border rounded-lg p-3 text-center col-span-2 flex justify-between items-center px-4">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Competition</p>
                    <p className={`text-sm font-bold ${idea.competition === 'Low' ? 'text-accent-emerald' : idea.competition === 'Medium' ? 'text-accent-amber' : 'text-accent-rose'}`}>
                      {idea.competition}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <p className="text-sm font-bold text-foreground">{idea.difficulty}</p>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Footer Action */}
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button className="text-sm font-medium text-accent-violet hover:text-accent-violet/80 flex items-center gap-1 transition-colors">
                Generate Full Script <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
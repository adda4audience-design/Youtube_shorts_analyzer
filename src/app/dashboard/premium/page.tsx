// Path: src/app/dashboard/premium/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Crown, Target, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";

interface PremiumData {
  niche: string;
  confidenceScore: number;
  competitionScore: string;
  reasoning: string;
  suggestedPlan: Array<{ phase: string; strategy: string }>;
  exampleChannels: string[];
  videoIdeas: string[];
}

export default function PremiumPage() {
  const [data, setData] = useState<PremiumData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/premium")
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
          <Crown className="w-8 h-8 animate-pulse text-accent-amber" />
          <p>Running predictive models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-card to-accent-amber/5 border border-accent-amber/20 rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Crown className="w-32 h-32 text-accent-amber" />
        </div>
        
        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground mb-4">
          <Crown className="w-8 h-8 text-accent-amber" />
          The Next Viral Opportunity
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Our AI has analyzed the platform's view velocity matrices to pinpoint the exact niche with the highest probability of reaching 100k subscribers in the next 6 months.
        </p>
      </div>

      {/* The Verdict */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
          <p className="text-sm font-bold text-accent-amber uppercase tracking-wider mb-2">Target Niche</p>
          <h2 className="text-4xl font-extrabold text-foreground mb-4">{data.niche}</h2>
          <p className="text-muted-foreground leading-relaxed">{data.reasoning}</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-6 flex-1 flex flex-col justify-center items-center text-center">
            <Target className="w-6 h-6 text-accent-emerald mb-2" />
            <p className="text-sm text-muted-foreground">Confidence Score</p>
            <p className="text-4xl font-bold text-foreground mt-1">{data.confidenceScore}%</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 flex-1 flex flex-col justify-center items-center text-center">
            <AlertTriangle className="w-6 h-6 text-accent-amber mb-2" />
            <p className="text-sm text-muted-foreground">Competition Level</p>
            <p className={`text-2xl font-bold mt-1 ${data.competitionScore === 'Low' ? 'text-accent-emerald' : 'text-accent-amber'}`}>
              {data.competitionScore}
            </p>
          </div>
        </div>
      </div>

      {/* Execution Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-accent-violet" />
            6-Month Execution Roadmap
          </h3>
          <div className="space-y-6">
            {data.suggestedPlan.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-accent-violet/10 text-accent-violet flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  {idx !== data.suggestedPlan.length - 1 && <div className="w-0.5 h-full bg-border mt-2"></div>}
                </div>
                <div className="pb-4">
                  <p className="font-bold text-foreground">{step.phase}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.strategy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-accent-amber" />
              First 3 Video Concepts
            </h3>
            <ul className="space-y-3">
              {data.videoIdeas.map((idea, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-background/50 p-3 rounded-lg border border-border text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
                  {idea}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-accent-rose" />
              Channels to Study
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.exampleChannels.map((channel, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-background border border-border rounded-md text-sm font-medium">
                  {channel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
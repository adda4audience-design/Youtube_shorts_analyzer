// Path: src/app/dashboard/evergreen/page.tsx
"use client";

import { useEffect, useState } from "react";
import { LineChart, ShieldCheck, CalendarDays, Award } from "lucide-react";

interface EvergreenNiche {
  id: string;
  name: string;
  stabilityScore: number;
  avgMonthlyViews: string;
  seasonality: string;
  longevity: string;
  topLeaders: string[];
}

export default function EvergreenPage() {
  const [niches, setNiches] = useState<EvergreenNiche[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evergreen")
      .then((res) => res.json())
      .then((data) => {
        setNiches(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LineChart className="w-6 h-6 text-accent-emerald" />
          Evergreen Niche Intelligence
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Discover highly stable niches that generate consistent views month over month. 
          These categories are insulated against short-term algorithm changes and trend cycles.
        </p>
      </div>

      {/* Evergreen Data Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Niche</th>
                <th className="px-6 py-4 font-medium">Stability Score</th>
                <th className="px-6 py-4 font-medium">Avg Monthly Views</th>
                <th className="px-6 py-4 font-medium">Seasonality</th>
                <th className="px-6 py-4 font-medium">Market Leaders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {niches.map((niche) => (
                <tr key={niche.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-base">{niche.name}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3 h-3 text-accent-emerald" /> 
                      Longevity: <span className="font-medium text-foreground">{niche.longevity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-accent-emerald">{niche.stabilityScore}/100</span>
                      <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-emerald" 
                          style={{ width: `${niche.stabilityScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {niche.avgMonthlyViews}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{niche.seasonality}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {niche.topLeaders.map((leader, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-background/50 border border-border px-2 py-1 rounded-md w-max">
                          <Award className="w-3 h-3 text-accent-amber" />
                          {leader}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
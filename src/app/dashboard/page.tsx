// Path: src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PlaySquare, Flame, TrendingUp, Users, ExternalLink } from "lucide-react";

interface VideoCard {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  channelName: string;
  channelUrl: string;
  views: string;
  velocity: string;
  niche: string;
}

interface DashboardState {
  metrics: {
    globalTrendScore: number;
    globalTrendStatus: string;
    opportunityScore: number;
    opportunityStatus: string;
    trackedShorts: string;
    trackedStatus: string;
    breakoutChannels: number;
    breakoutStatus: string;
  };
  viralVideos: VideoCard[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        // If the backend threw a 500 error, catch it and show it on screen
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
          <PlaySquare className="w-8 h-8 text-accent-rose" />
          <p className="text-sm font-medium">Assembling live operational records...</p>
        </div>
      </div>
    );
  }

  // Safety net: If data is missing or API failed, show the exact error visually
  if (error || !data || !data.viralVideos) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-8 max-w-lg text-center">
          <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Dashboard Sync Failed</h2>
          <p className="text-sm">{error || "The API returned an unexpected data format. Please check your backend terminal for Prisma errors."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Scraped Assets</span>
            <PlaySquare className="w-4 h-4 text-accent-rose" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{data.metrics.trackedShorts}</p>
          <p className="text-xs text-accent-emerald mt-1 font-medium">{data.metrics.trackedStatus}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Emerging Scale</span>
            <Users className="w-4 h-4 text-accent-violet" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{data.metrics.breakoutChannels} channels</p>
          <p className="text-xs text-accent-emerald mt-1 font-medium">{data.metrics.breakoutStatus}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Trend Multiplier</span>
            <Flame className="w-4 h-4 text-accent-amber" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{data.metrics.globalTrendScore}%</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{data.metrics.globalTrendStatus}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Opportunity Index</span>
            <TrendingUp className="w-4 h-4 text-accent-emerald" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{data.metrics.opportunityScore}/10</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{data.metrics.opportunityStatus}</p>
        </div>
      </div>

      {/* Main Real-time Scraped Video Matrix */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-5 h-5 text-accent-rose animate-pulse" />
          <h2 className="text-xl font-extrabold text-foreground">High-Velocity Viral Material</h2>
        </div>

        {/* Safe optional chaining used here (?) to guarantee no crashes */}
        {data.viralVideos?.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
            <p>No high-velocity shorts found yet. Fire your ingestion request endpoint to fetch trends.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {data.viralVideos?.map((video) => (
              <div key={video.id} className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-accent-rose transition-colors">
                
                {/* Thumbnail Container */}
                <a 
                  href={video.videoUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="relative aspect-[9/16] block overflow-hidden bg-muted"
                >
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {video.niche}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-accent-rose text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                      Watch Short <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>

                {/* Card Breakdown Metadata */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-accent-rose transition-colors" title={video.title}>
                      {video.title}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-border/60">
                    {/* Performance Metrics */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Views Got:</span>
                      <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">{video.views}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Velocity:</span>
                      <span className="font-extrabold text-accent-emerald">{video.velocity}</span>
                    </div>

                    {/* Channel Redirect */}
                    <div className="pt-2">
                      <a 
                        href={video.channelUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors max-w-full"
                      >
                        <div className="w-5 h-5 rounded-full bg-accent-rose/10 text-accent-rose flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                          {video.channelName.charAt(0)}
                        </div>
                        <span className="truncate">{video.channelName}</span>
                      </a>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
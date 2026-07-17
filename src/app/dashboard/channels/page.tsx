// Path: src/app/dashboard/channels/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Users, ExternalLink, ChevronDown, ChevronUp, PlaySquare, TrendingUp, Search } from "lucide-react";

interface ChannelBlueprint {
  commonHook: string;
  videoStructure: string;
  avgDuration: string;
  editingStyle: string;
}

interface Channel {
  id: string;
  youtubeUrl: string;
  name: string;
  subscribers: string;
  avgViews: string;
  status: string;
  niche: string;
  blueprint: ChannelBlueprint;
}

export default function EmergingChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => {
        setChannels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch channels:", err);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
          <Users className="w-8 h-8 text-accent-violet" />
          <p className="text-sm font-medium">Scanning for emerging creators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent-violet/10 rounded-lg">
          <Users className="w-6 h-6 text-accent-violet" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emerging Channels Radar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tracking creators with high velocity and under 250k subscribers.
          </p>
        </div>
      </div>

      {/* Channels List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {channels.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No emerging channels found. Run your ingestion worker to populate this list.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {channels.map((channel) => (
              <div key={channel.id} className="flex flex-col">
                {/* Main Row */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                  
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-accent-violet/20 text-accent-violet flex items-center justify-center font-bold text-lg uppercase shrink-0">
                      {channel.name.charAt(0)}
                    </div>
                    <div>
                      {/* Clickable Channel Name linking to YouTube */}
                      <a 
                        href={channel.youtubeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-bold text-lg text-foreground hover:text-accent-violet transition-colors flex items-center gap-1.5 group"
                      >
                        {channel.name}
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-medium">
                        <span className="bg-muted px-2 py-0.5 rounded">{channel.niche}</span>
                        <span>{channel.subscribers} Subs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end flex-1">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Avg Views</p>
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-accent-emerald" />
                        {channel.avgViews}
                      </p>
                    </div>

                    <div className="text-left sm:text-right w-24">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Status</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        channel.status === 'EXPLODING' ? 'bg-accent-rose/10 text-accent-rose' :
                        channel.status === 'GROWING' ? 'bg-accent-emerald/10 text-accent-emerald' :
                        'bg-accent-violet/10 text-accent-violet'
                      }`}>
                        {channel.status}
                      </span>
                    </div>

                    <button 
                      onClick={() => toggleExpand(channel.id)}
                      className="p-2 hover:bg-border rounded-lg transition-colors"
                    >
                      {expandedId === channel.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Analytics Dropdown */}
                {expandedId === channel.id && (
                  <div className="bg-muted/30 border-t border-border p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-foreground">
                      <Search className="w-4 h-4 text-accent-violet" />
                      Algorithmic Blueprint
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-card border border-border p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Title Pattern</p>
                        <p className="text-sm font-medium">{channel.blueprint.commonHook}</p>
                      </div>
                      
                      <div className="bg-card border border-border p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Performance</p>
                        <p className="text-sm font-medium">{channel.blueprint.videoStructure}</p>
                      </div>
                      
                      <div className="bg-card border border-border p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Database Tracking</p>
                        <p className="text-sm font-medium">{channel.blueprint.avgDuration}</p>
                      </div>
                      
                      <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-center">
                        <a 
                          href={channel.blueprint.editingStyle.replace("Top video: ", "")} 
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 bg-accent-rose text-white text-sm font-bold rounded-md hover:bg-accent-rose/90 transition-colors"
                        >
                          <PlaySquare className="w-4 h-4" />
                          Watch Top Video
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
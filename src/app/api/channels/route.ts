// Path: src/app/api/channels/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const dbChannels = await prisma.channel.findMany({
      where: { 
        // Hide MrBeast! Only show channels with less than 250k subs
        subscriberCount: { lt: 250000 } 
      },
      include: { niche: true, shorts: true },
      orderBy: { shorts: { _count: 'desc' } },
      take: 20,
    });

    const formattedChannels = dbChannels.map((channel: any) => {
      const totalViews = channel.shorts.reduce((sum: number, short: any) => sum + short.views, 0);
      const avgViewsNum = channel.shorts.length > 0 ? Math.round(totalViews / channel.shorts.length) : 0;
      
      // Calculate REAL analytics for the Study Channel feature
      const recentShorts = channel.shorts.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
      const avgVelocity = channel.shorts.reduce((sum: number, s: any) => sum + s.viewVelocity, 0) / (channel.shorts.length || 1);
      
      // Extract the most common word used in their titles
      const allWords = channel.shorts.map((s: any) => s.title).join(" ").split(" ");
      const wordCounts = allWords.reduce((acc: any, w: string) => { 
        if (w.length > 4) acc[w] = (acc[w] || 0) + 1; return acc; 
      }, {});
      const topKeyword = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a])[0] || "Unknown";

      return {
        id: channel.id,
        youtubeUrl: `https://www.youtube.com/channel/${channel.youtubeId}`, // REAL LINK
        name: channel.name,
        subscribers: channel.subscriberCount > 0 ? channel.subscriberCount.toLocaleString() : "Hidden",
        avgViews: avgViewsNum > 1000000 ? `${(avgViewsNum / 1000000).toFixed(1)}M` : `${(avgViewsNum / 1000).toFixed(1)}k`,
        status: channel.status,
        niche: channel.niche?.name || "Uncategorized",
        blueprint: {
          commonHook: `Repeatedly uses keyword: "${topKeyword}"`,
          videoStructure: `Averages ${Math.round(avgVelocity)} views per hour on launch.`,
          avgDuration: `${channel.shorts.length} videos tracked in DB`,
          editingStyle: `Top video: https://youtube.com/shorts/${recentShorts[0]?.youtubeId}` // DIRECT VIDEO LINK
        }
      };
    });

    return NextResponse.json(formattedChannels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}
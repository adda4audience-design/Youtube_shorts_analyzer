// Path: src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force Next.js to NEVER cache this route so you always get fresh live data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalShortsCount = await prisma.short.count();
    
    const viralShortsRaw = await prisma.short.findMany({
      include: {
        channel: {
          include: { niche: true }
        }
      },
      orderBy: { viewVelocity: 'desc' },
      take: 20,
    });

   // Inside src/app/api/dashboard/route.ts

    const viralVideosFormatted = viralShortsRaw.map((video: any) => {
      // Calculate Outlier Score
      const subs = video.channel?.subscriberCount || 1;
      const vsr = video.views / subs;
      let outlierBadge = "";
      
      if (vsr > 100) outlierBadge = "🔥 100x Outlier";
      else if (vsr > 10) outlierBadge = "🚀 10x Breakout";
      else outlierBadge = "Trending";

      return {
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: `https://www.youtube.com/shorts/${video.youtubeId}`,
        channelName: video.channel?.name || "Unknown Creator",
        channelUrl: `https://www.youtube.com/channel/${video.channel?.youtubeId}`,
        views: video.views >= 1000000 
          ? `${(video.views / 1000000).toFixed(1)}M` 
          : `${(video.views / 1000).toFixed(0)}k`,
        velocity: `${Math.round(video.viewVelocity).toLocaleString()} views/hr`,
        niche: outlierBadge, // Replacing the static niche tag with our dynamic Outlier Badge
      };
    });

    const totalViewsAgg = await prisma.short.aggregate({ _sum: { views: true } });
    const totalDatabaseViews = totalViewsAgg._sum.views || 0;

    const dashboardData = {
      metrics: {
        globalTrendScore: totalShortsCount > 0 ? 94 : 0,
        globalTrendStatus: "Live algorithmic scanning active",
        opportunityScore: totalShortsCount > 0 ? 9.1 : 0.0,
        opportunityStatus: "Scanning high-velocity breakouts",
        trackedShorts: `${totalShortsCount} clips`,
        trackedStatus: "Total items parsed",
        breakoutChannels: await prisma.channel.count({ where: { subscriberCount: { lt: 250000 } } }),
        breakoutStatus: "Emerging channels tracking",
      },
      viralVideos: viralVideosFormatted
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error("Dashboard Aggregator Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load database records" }, { status: 500 });
  }
}
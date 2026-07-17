// Path: src/app/api/cron/youtube-ingest/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY, 
});

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let videoIds: string[] = [];
    let nextPageToken: string | undefined | null = '';
    
    // We only want videos from the last 24 hours to calculate true explosive velocity
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // 1. PAGINATION: Use Search API to force "Shorts Only" targeting
    for (let i = 0; i < 2; i++) { // Fetch 100 results (2 pages of 50) to save quota
      const searchRes = await youtube.search.list({
        part: ['id'],
        q: '#shorts', // Target the universal shorts tag
        type: ['video'],
        videoDuration: 'short', // Strictly under 4 minutes
        order: 'viewCount', // Grab the most viral ones
        publishedAfter: yesterday, 
        maxResults: 50,
        pageToken: nextPageToken || undefined,
      });

      const items = searchRes.data.items || [];
      const ids = items.map(item => item.id?.videoId).filter(Boolean) as string[];
      videoIds.push(...ids);
      
      nextPageToken = searchRes.data.nextPageToken;
      if (!nextPageToken) break;
    }

    if (videoIds.length === 0) return NextResponse.json({ message: "No shorts found." });

    // 2. Fetch the actual statistics and tags for these specific videos
    // The videos.list API can only take 50 IDs at a time, so we chunk them
    let trendingShorts: any[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const statsRes = await youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: chunk,
      });
      
      // Double check duration to be strictly <= 60s
      const validShorts = (statsRes.data.items || []).filter((video) => {
        const durationStr = video.contentDetails?.duration || "PT0S";
        const isMinuteOrLess = durationStr.includes('M') ? durationStr === 'PT1M' || durationStr === 'PT1M0S' : true;
        return isMinuteOrLess && !durationStr.includes('H');
      });
      
      trendingShorts.push(...validShorts);
    }

    // 3. Extract unique Channel IDs to check their subscriber counts
    const channelIds = [...new Set(trendingShorts.map(v => v.snippet?.channelId).filter(Boolean))] as string[];
    
    // Batch request channel stats (chunked by 50)
    const channelStatsMap: Record<string, number> = {};
    for (let i = 0; i < channelIds.length; i += 50) {
      const chunk = channelIds.slice(i, i + 50);
      const channelStatsRes = await youtube.channels.list({
        part: ['statistics'],
        id: chunk, 
      });
      
      channelStatsRes.data.items?.forEach(ch => {
        channelStatsMap[ch.id!] = parseInt(ch.statistics?.subscriberCount || "0");
      });
    }

    let ingestedCount = 0;

    // 4. Process and save to DB
    for (const video of trendingShorts) {
      const channelId = video.snippet?.channelId!;
      const subCount = channelStatsMap[channelId] || 0;

      // Filter out massive established channels to focus on emerging ones
      let channelStatus = "NEW";
      if (subCount > 1000000) channelStatus = "ESTABLISHED";
      else if (subCount > 100000) channelStatus = "GROWING";
      else if (subCount > 10000) channelStatus = "EMERGING";
      else channelStatus = "BREAKOUT"; 

      const publishedAt = new Date(video.snippet?.publishedAt || "");
      const views = parseInt(video.statistics?.viewCount || "0");
      const viewVelocity = views / Math.max(1, (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60));

      const tag = video.snippet?.tags?.[0] || "General";
      const nicheName = !['shorts', 'fyp', 'viral', 'trending'].includes(tag.toLowerCase()) ? tag : "Trending";

      const dbNiche = await prisma.niche.upsert({
        where: { name: nicheName },
        update: {},
        create: { name: nicheName, growthRate: 0, opportunityScore: 0, creatorDensity: 0, status: "EMERGING" }
      });

      const channel = await prisma.channel.upsert({
        where: { youtubeId: channelId },
        update: { subscriberCount: subCount, status: channelStatus },
        create: {
          youtubeId: channelId,
          name: video.snippet?.channelTitle || "Unknown",
          subscriberCount: subCount,
          totalViews: 0, uploadFrequency: 0, consistencyScore: 0,
          status: channelStatus,
          nicheId: dbNiche.id
        }
      });

      await prisma.short.upsert({
        where: { youtubeId: video.id! },
        update: { views, viewVelocity },
        create: {
          youtubeId: video.id!, title: video.snippet?.title || "", thumbnailUrl: video.snippet?.thumbnails?.high?.url || "",
          publishedAt, views, likes: 0, comments: 0, duration: 60, viewVelocity, growthVelocity: 0, trendScore: viewVelocity,
          channelId: channel.id,
        }
      });
      ingestedCount++;
    }

    return NextResponse.json({ success: true, message: `Ingested ${ingestedCount} highly viral emerging shorts.` });

  } catch (error) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
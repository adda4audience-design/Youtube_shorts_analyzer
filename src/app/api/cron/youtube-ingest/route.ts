import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

// 1. Force Next.js to NEVER cache this route in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY, 
});

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("Cron Failed: Unauthorized access attempt");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Log to prove the endpoint was successfully hit and authorized on Render
    console.log("Cron Started: Authenticated successfully. Starting YouTube search...");

    const videoIds: string[] = []; 
    let nextPageToken: string | undefined | null = '';
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // 1. PAGINATION: Use Search API to force "Shorts Only" targeting
    for (let i = 0; i < 2; i++) { 
      const searchRes = await youtube.search.list({
        part: ['id'],
        q: '#shorts', 
        type: ['video'],
        videoDuration: 'short', 
        order: 'viewCount', 
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

    // 3. Log exactly how many IDs YouTube returned
    console.log(`YouTube search complete. Found ${videoIds.length} video IDs.`);

    if (videoIds.length === 0) {
      console.warn("Cron Exiting Early: No shorts found from YouTube API. (Check Quota or Search Parameters)");
      return NextResponse.json({ message: "No shorts found." });
    }

    // 2. Fetch the actual statistics and tags for these specific videos
    console.log("Fetching video stats...");
    const trendingShorts: any[] = []; 
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const statsRes = await youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: chunk,
      });
      
      const validShorts = (statsRes.data.items || []).filter((video) => {
        const durationStr = video.contentDetails?.duration || "PT0S";
        const isMinuteOrLess = durationStr.includes('M') ? durationStr === 'PT1M' || durationStr === 'PT1M0S' : true;
        return isMinuteOrLess && !durationStr.includes('H');
      });
      
      trendingShorts.push(...validShorts);
    }
    console.log(`Filtered down to ${trendingShorts.length} valid shorts under 60 seconds.`);

    // 3. Extract unique Channel IDs to check their subscriber counts
    const channelIds = [...new Set(trendingShorts.map(v => v.snippet?.channelId).filter(Boolean))] as string[];
    console.log(`Fetching stats for ${channelIds.length} unique channels...`);
    
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
    console.log("Starting database ingestion...");
    for (const video of trendingShorts) {
      const channelId = video.snippet?.channelId!;
      const subCount = channelStatsMap[channelId] || 0;

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

    console.log(`SUCCESS: Ingested ${ingestedCount} shorts into the database.`);
    return NextResponse.json({ success: true, message: `Ingested ${ingestedCount} highly viral emerging shorts.` });

  } catch (error) {
    // 5. Catch and log ANY errors that happen during the process
    console.error("CRON INGESTION ERROR:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}

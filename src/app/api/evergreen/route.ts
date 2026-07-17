// Path: src/app/api/evergreen/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Fetch live niches and all associated channel/video data
    const dbNiches = await prisma.niche.findMany({
      include: {
        channels: {
          include: { shorts: true }
        }
      }
    });

    if (!dbNiches || dbNiches.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Map the database niches into the Evergreen format
    const formattedEvergreen = dbNiches.map((niche: any) => {
      
      // Calculate total historical views for the niche
      const totalViews = niche.channels.reduce((sum: number, channel: any) => {
        return sum + channel.shorts.reduce((s: number, video: any) => s + video.views, 0);
      }, 0);

      // Heuristic for stability: high total views + consistent channel volume
      const baseStability = 70;
      const stabilityBonus = Math.min(25, niche.channels.length * 2);
      const calculatedStability = baseStability + stabilityBonus;

      // Format views
      const formattedViews = totalViews > 1000000 
        ? `${(totalViews / 1000000).toFixed(1)}M` 
        : `${(totalViews / 1000).toFixed(1)}k`;

      // Find the top market leaders in this niche dynamically
      let topLeaders: string[] = [];
      if (niche.channels.length > 0) {
         // Sort channels in this niche by their total views
         const sortedChannels = [...niche.channels].sort((a, b) => {
            const aViews = a.shorts.reduce((sum: number, v: any) => sum + v.views, 0);
            const bViews = b.shorts.reduce((sum: number, v: any) => sum + v.views, 0);
            return bViews - aViews;
         });
         // Take the top 2 channel names
         topLeaders = sortedChannels.slice(0, 2).map((c: any) => c.name);
      } else {
         topLeaders = ["Awaiting creator data"];
      }

      return {
        id: niche.id,
        name: niche.name,
        stabilityScore: calculatedStability,
        avgMonthlyViews: formattedViews,
        seasonality: "Consistent (Based on active tracking)",
        longevity: calculatedStability > 85 ? "Very High" : "High",
        topLeaders: topLeaders
      };
    }).sort((a: any, b: any) => b.stabilityScore - a.stabilityScore);

    return NextResponse.json(formattedEvergreen);
  } catch (error) {
    console.error("Evergreen API Error:", error);
    return NextResponse.json({ error: "Failed to fetch evergreen data" }, { status: 500 });
  }
}
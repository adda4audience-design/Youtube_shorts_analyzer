// Path: src/app/api/premium/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET() {
  try {
    // 1. Fetch recent videos from small creators only (Under 50k subs)
    const rawShorts = await prisma.short.findMany({
      where: {
        channel: {
          subscriberCount: {
            lt: 50000, 
            gt: 0 // Prevent division by zero
          }
        }
      },
      include: {
        channel: {
          include: { niche: true }
        }
      },
      orderBy: { viewVelocity: 'desc' },
      take: 100
    });

    if (rawShorts.length === 0) {
      return NextResponse.json({ error: "Not enough data to calculate outliers. Run ingestion first." }, { status: 400 });
    }

    // 2. The Outlier Math (VSR: View-to-Subscriber Ratio)
    const evaluatedShorts = rawShorts.map(short => {
      const vsr = short.views / (short.channel?.subscriberCount || 1);
      return {
        ...short,
        vsr
      };
    });

    // Sort by the highest VSR (The biggest algorithmic anomalies)
    evaluatedShorts.sort((a, b) => b.vsr - a.vsr);

    // Take the top 10 absolute craziest outliers
    const topOutliers = evaluatedShorts.slice(0, 10);
    
    // Format the data for the AI prompt
    const outlierDataForAI = topOutliers.map(o => 
      `Title: "${o.title}" | Views: ${o.views} | Channel Subs: ${o.channel?.subscriberCount} | VSR: ${o.vsr.toFixed(1)}x`
    ).join('\n');

    // 3. The True AI Analysis
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      You are an elite YouTube Shorts strategist. I am giving you a list of 10 "Outlier" videos. 
      These are videos from tiny channels that got massive views (high View-to-Subscriber Ratio).
      
      Raw Data:
      ${outlierDataForAI}
      
      Analyze this raw data and find the most viable niche for a completely new creator to start today.
      Return ONLY a raw JSON object (no markdown, no backticks) in this exact format:
      {
        "niche": "Name of the discovered niche based on the data",
        "confidenceScore": 95,
        "competitionScore": "Low",
        "reasoning": "A 2-sentence explanation of why this specific topic is exploiting the algorithm right now based on the VSR data provided.",
        "suggestedPlan": [
          { "phase": "Week 1-2", "strategy": "exact strategy" },
          { "phase": "Week 3-4", "strategy": "exact strategy" },
          { "phase": "Month 2-6", "strategy": "exact strategy" }
        ],
        "exampleChannels": ["List 2 or 3 channel names from the data"],
        "videoIdeas": ["Highly specific viral title 1", "Highly specific viral title 2", "Highly specific viral title 3"]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the AI response to ensure it parses as pure JSON
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const premiumBlueprint = JSON.parse(cleanedJson);

    return NextResponse.json(premiumBlueprint);

  } catch (error) {
    console.error("Premium AI API Error:", error);
    return NextResponse.json({ error: "Failed to generate AI blueprint" }, { status: 500 });
  }
}
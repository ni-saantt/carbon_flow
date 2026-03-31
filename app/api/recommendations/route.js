import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { stats } = await request.json();
    
    // Validate API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'GEMINI_API_KEY missing! Open `.env.local` and add `GEMINI_API_KEY=your-key`.' 
      }), { status: 400 });
    }

    // Initialize the official Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Dynamic Prompt Engineering injecting real DB statistics
    const prompt = `You are an elite corporate ESG (Environmental, Social, and Governance) sustainability consultant advising a company on lowering their carbon footprint.
    
Here is the organization's exact current footprint data timeframe:
- Total Emissions: ${stats.total.toFixed(2)} kg CO2e
- Top Polluting Category: ${stats.topCategory} (representing ${stats.topPercentage}% of all their recorded emissions)
- Total Activities Analyzed: ${stats.count}

Based on this precise dataset, write a highly professional, 3-paragraph executive summary detailing exactly what operational strategies they should implement to reduce their dominant emission category. 
Be scientific, extremely actionable, and mention their specific numbers! 
IMPORTANT: Do NOT use markdown bold, italics, or asterisks. Use plain text and standard newlines so it formats cleanly in HTML.`;

    // Secure call bypassing complex REST URL mappings
    const result = await model.generateContent(prompt);
    const finalRecommendation = result.response.text();

    return new Response(JSON.stringify({ recommendation: finalRecommendation }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

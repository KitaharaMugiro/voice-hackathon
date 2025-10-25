import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { conversations, goals } = await request.json();

    if (!conversations || !goals) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    // Prepare conversation summary
    const winsList = conversations.filter((c: any) => c.category === "Today's Wins" && c.categoryTitle);
    const challengesList = conversations.filter((c: any) => c.category === "Today's Challenges" && c.categoryTitle);
    const discussionsList = conversations.filter((c: any) => c.category === "Things to Discuss" && c.categoryTitle);

    const prompt = `
You are an executive coach analyzing a quarterly performance review. Based on the following data, provide a comprehensive analysis in English.

## Goals (OKR):
${goals.map((g: any) => {
  const percentage = Math.round((g.current / g.target) * 100);
  return `- ${g.title}: ${g.current}/${g.target}${g.unit} (${percentage}%)`;
}).join('\n')}

## Achievements (${winsList.length} items):
${winsList.map((w: any) => `- [${w.dateJST}] ${w.categoryTitle}: ${w.details || ''}`).join('\n')}

## Challenges (${challengesList.length} items):
${challengesList.map((c: any) => `- [${c.dateJST}] ${c.categoryTitle}: ${c.details || ''}`).join('\n')}

## Discussion Topics (${discussionsList.length} items):
${discussionsList.map((d: any) => `- [${d.dateJST}] ${d.categoryTitle}: ${d.details || ''}`).join('\n')}

Please provide a structured analysis covering:
1. **Overall Summary**: Summarize the quarter's achievements and situation in 3-4 sentences
2. **Strengths**: Notable successes and positive patterns
3. **Areas for Improvement**: Challenges and areas requiring attention
4. **Next Actions**: 3-5 specific recommended actions
5. **Goal Achievement Analysis**: Analysis and advice for each goal's progress

Be specific, actionable, and supportive in tone. Format the response in a clear, readable structure.
`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    return new Response(JSON.stringify({ analysis }), { status: 200 });
  } catch (error) {
    console.error('Failed to analyze quarter:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze quarter' }), { status: 500 });
  }
}

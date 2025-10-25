import { generateAIContentWithJsonMode } from "@/lib/Gemini";
import { ResponseSchema, SchemaType } from "@google/generative-ai";
import fs from 'fs/promises';
import path from 'path';



export async function POST(request: Request) {
  try {
    const { title, content, url, id, conversation_list } = await request.json();

    if (!title || !content || !url || !id || !conversation_list) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const prompt = `
        Analyze the following conversation history and categorize it into three categories: "Today's Wins", "Today's Challenges", and "Things to Discuss".
        If there is no content for a category, return an empty array for that category.
        If there are multiple items, extract all of them.

        Conversation history:
        ${conversation_list.map((item: any) => `${item.role}: ${item.content}`).join('\n')}
        `
    const responseSchema: ResponseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        categories: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING, enum: ["Today's Wins", "Today's Challenges", "Things to Discuss", "Other"] },
              title: { type: SchemaType.STRING, description: "Title based on category. For wins: summary of achievement, for challenges: challenge name, for things to discuss: overview of consultation" },
              details: { type: SchemaType.STRING, description: "Detailed content based on category. For wins: specific achievements or happy moments, for challenges: specific problem details, for things to discuss: detailed consultation content" },
              action: { type: SchemaType.BOOLEAN, description: "Whether human intervention is needed. false if resolved, true if unresolved" }
            }
          }
        }
      }
    };

    const response_json = await generateAIContentWithJsonMode(prompt, responseSchema);

    // Array to store data
    const records = [];
    const timestamp = new Date().toISOString();
    const dateJST = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    // Process based on category
    for (const category of response_json.categories) {
      const a1 = title;
      const b1 = category.type;
      const c1 = category.title;
      const d1 = category.details;
      const e1 = category.action;

      // Write to spreadsheet (disabled)
      // await writeToSheet(a1, b1, c1, d1, e1);

      // Add record
      records.push({
        timestamp,
        dateJST,
        title: a1,
        category: b1,
        categoryTitle: c1,
        details: d1,
        actionRequired: e1
      });

      switch (category.type) {
        case "Today's Wins":
          console.log("Win recorded: Positive event logged");
          break;

        case "Today's Challenges":
          console.log("Challenge detected: Issue requiring resolution logged");
          break;

        case "Things to Discuss":
          console.log("Consultation detected: Item requiring support logged");
          break;
        default:
          console.log(`Other category: ${category.type}`);
      }
    }

    // Save to JSON file
    const dataDir = path.join(process.cwd(), 'public');
    await fs.mkdir(dataDir, { recursive: true });

    const filepath = path.join(dataDir, 'conversations.json');

    let existingData = [];
    try {
      const fileContent = await fs.readFile(filepath, 'utf-8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      // Create new file if it doesn't exist
    }

    existingData.push(...records);
    await fs.writeFile(filepath, JSON.stringify(existingData, null, 2), 'utf-8');

    return new Response(JSON.stringify({ message: 'Data saved to JSON file', filepath, records }), { status: 200 });
  } catch (error) {
    console.error('Failed to write data to spreadsheet:', error);
    return new Response(JSON.stringify({ error: 'Failed to write data to spreadsheet' }), { status: 500 });
  }
}

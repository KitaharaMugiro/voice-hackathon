import { generateAIContentWithJsonMode } from "@/lib/Gemini";
import { ResponseSchema, SchemaType } from "@google/generative-ai";



export async function POST(request: Request) {
  try {
    const { title, content, url, id, conversation_list } = await request.json();

    if (!title || !content || !url || !id || !conversation_list) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const prompt = `
        以下の会話履歴から、「今日の良かったこと」「今日の課題」「相談したいこと」の3つのカテゴリに分けて分析してください。
        それぞれのカテゴリに該当する内容がない場合は、そのカテゴリは空の配列で返してください。
        複数の項目が該当する場合は、すべて抽出してください。

        会話履歴:
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
              type: { type: SchemaType.STRING, enum: ["今日の良かったこと", "今日の課題", "相談したいこと", "その他"] },
              title: { type: SchemaType.STRING, description: "カテゴリに応じたタイトル。良かったことであれば成果の概要、課題であれば課題名、相談したいことであれば相談内容の概要" },
              details: { type: SchemaType.STRING, description: "カテゴリに応じた詳細な内容。良かったことであれば具体的な成果や嬉しかったこと、課題であれば具体的な問題内容、相談したいことであれば詳細な相談内容" },
              action: { type: SchemaType.BOOLEAN, description: "有人による対応が必要か。解決済みであればfalse, 未解決であればtrue" }
            }
          }
        }
      }
    };

    const response_json = await generateAIContentWithJsonMode(prompt, responseSchema);


    // カテゴリに基づいて処理を分岐
    for (const category of response_json.categories) {
      const a1 = title;
      const b1 = category.type;
      const c1 = category.title;
      const d1 = category.details;
      const e1 = category.action;

      //スプレッドシートに書き込む
      // await writeToSheet(a1, b1, c1, d1, e1);

      switch (category.type) {
        case "今日の良かったこと":
          console.log("良かったこと記録: ポジティブな出来事を記録しました");
          break;

        case "今日の課題":
          console.log("課題検知: 解決が必要な課題を記録しました");
          break;

        case "相談したいこと":
          console.log("相談事項検知: サポートが必要な事項を記録しました");
          break;
        default:
          console.log(`その他のカテゴリ: ${category.type}`);
      }
    }

    return new Response(JSON.stringify({ message: 'Data written to spreadsheet' }), { status: 200 });
  } catch (error) {
    console.error('Failed to write data to spreadsheet:', error);
    return new Response(JSON.stringify({ error: 'Failed to write data to spreadsheet' }), { status: 500 });
  }
}

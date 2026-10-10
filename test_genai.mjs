import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function testVision() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const mimeType = "image/png";

    const prompt = `Analyze this food image. You must first correctly distinguish if this is an AI-generated image, a real photograph of food, a screenshot, or an illustration. Then, analyze the food to distinguish if it is fresh food or rotten food.

Return a JSON object EXACTLY matching this schema:
{
  "authenticityResult": "Passed - Authentic Photo" | "AI generated" | "Illustration detected" | "Screenshot detected",
  "authenticityConfidence": 0.0 to 1.0 (number),
  "foodName": "Name of food",
  "foodCategory": "Category",
  "freshnessScore": 0-100 (number),
  "isSafeToEat": true/false (boolean),
  "spoilageIndicators": ["list", "of", "signs"],
  "estimatedShelfLife": "text description",
  "recommendedAction": "Accept" | "Reject" | "Inspect further",
  "confidenceScore": 0-100 (number)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    console.log("Success!");
    console.log(response.text);
  } catch (error) {
    console.log("ERROR OCCURRED:");
    console.log(JSON.stringify(error, null, 2));
    if (error.response) {
       console.log("Response data:", await error.response.json().catch(()=>error.response.text()));
    }
    console.log("Status:", error.status);
    console.log("Message:", error.message);
  }
}

testVision();

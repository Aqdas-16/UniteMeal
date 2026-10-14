import "dotenv/config";
import { createClient } from '@supabase/supabase-js';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // AI Route
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { history, message, contextData } = req.body;
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const systemInstruction = `You are the UniteMeal Assistant, an intelligent chatbot for the UniteMeal platform. 
Role: Enhance food rescue logistics by assisting users (donors, NGOs, volunteers) with clear, precise information.
App Context: ${JSON.stringify(contextData)}
Guidance:
1. Always be helpful, polite, and constructive.
2. Provide answers based on the current context that relates to food donations, transport routes, and logistics.
3. You have access to Google Maps for grounding. Provide accurate real-world locations, routes, and place details when users ask about geography or addresses.`;

      // Filter out the very first hardcoded message if it comes in as 'model' without user input
      let cleanHistory = history && Array.isArray(history) ? history : [];
      if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
          cleanHistory = cleanHistory.slice(1);
      }

      const messages = [
        { role: 'system', content: systemInstruction },
        ...cleanHistory.map((m: any) => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.parts ? m.parts[0].text : m.content || ""
        }))
      ];
      
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages as any
      });

      res.json({ reply: response.choices[0]?.message?.content || "" });
    } catch (error: any) {
      console.error('AI Error:', error);
      if (error?.status === 429 || error?.message?.includes('429')) {
         res.status(429).json({ reply: "I'm currently receiving too many requests and have hit my rate limit. Please try again in a few moments or consider upgrading the project's Gemini API quota." });
      } else {
         const errorMessage = error?.message || "An unknown AI error occurred.";
         res.status(500).json({ reply: `Error: ${errorMessage}` });
      }
    }
  });

  // AI Insights Route
  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { stats, feedCount, donorsCount } = req.body;
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const systemInstruction = `You are a data analyst for UniteMeal. 
Your task is to analyze the provided dashboard stats and recent activity counts, then generate 2-3 brief, actionable insights or recommendations for the admin. 
Keep the response professional, concise, and structured with bullet points. Do not include introductory fluff.`;

      const prompt = `Current Stats:
- Total Donations: ${stats.totalDonations}
- Meals Saved: ${stats.totalMealsSaved}
- Carbon Saved: ${stats.totalCarbonSaved}kg
- NGOs: ${stats.totalNGOs}
- Volunteers: ${stats.totalVolunteers}
- People Helped: ${stats.totalPeopleHelped}

Recent events tracked: ${feedCount}
Active Donors: ${donorsCount}

Based on this data, provide key operational insights.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ]
      });

      res.json({ reply: response.choices[0]?.message?.content || "" });
    } catch (error: any) {
      console.error('AI Insights Error:', error);
      if (error?.status === 429 || error?.message?.includes('429')) {
         res.status(429).json({ reply: "Quota exceeded: unable to generate insights at the moment." });
      } else {
         res.status(500).json({ reply: "Unable to generate insights at the moment." });
      }
    }
  });

  // AI Categorize Route
  app.post("/api/ai/categorize", async (req, res) => {
    try {
      const { foodDescription } = req.body;
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const systemInstruction = `You are a food rescue categorization AI. Read the donor's description of food and return a structured JSON response matching this schema:
{
  "category": "e.g., Prepared Meals, Baked Goods, Produce, etc.",
  "confidence": "e.g., 90%",
  "freshness": "e.g., High, Medium, Requires inspection",
  "estWeight": "numeric estimated weight in kg as string, e.g., 5",
  "estMeals": "numeric estimated meals as string, e.g., 12"
}
Ensure the output is strictly valid JSON without any markdown code blocks.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: foodDescription }
        ],
        response_format: { type: "json_object" }
      });

      res.json({ result: JSON.parse(response.choices[0]?.message?.content || "{}") });
    } catch (error: any) {
      console.error('AI Categorize Error:', error);
      if (error?.status === 429 || error?.message?.includes('429')) {
         res.status(429).json({ error: "Quota exceeded: unable to categorize food at the moment." });
      } else {
         res.status(500).json({ error: "Unable to categorize food at the moment." });
      }
    }
  });

  // AI Vision Verify Route
  
  // Maps URL Resolver Route
  
  app.get("/api/fix", async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const realUrl = supabaseUrl.startsWith('postgresql') ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' : supabaseUrl;
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(realUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

      const { data: deliveries } = await supabaseAdmin.from('deliveries').select('*');
      let fixed = 0;
      if (deliveries) {
         for (const del of deliveries) {
             if (del.status === 'completed' || del.status === 'delivered') {
                 await supabaseAdmin.from('donations').update({ status: 'completed' }).eq('id', del.donation_id);
                 fixed++;
             }
         }
      }
      res.json({ success: true, fixed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/resolve-maps-link", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });
      
      const fetchOptions = {
         method: 'GET',
         redirect: 'follow' as RequestRedirect,
         headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
         }
      };

      const response = await fetch(url, fetchOptions);
      const finalUrl = response.url;
      
      const regex = /(?:@|q=|ll=)(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = finalUrl.match(regex);
      
      if (match) {
         res.json({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) });
      } else {
         res.status(400).json({ error: "Coordinates not found in resolved URL" });
      }
    } catch (error) {
      console.error('Resolve Maps Link Error:', error);
      res.status(500).json({ error: "Failed to resolve link" });
    }
  });

app.post("/api/ai/vision-verify", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      const { GoogleGenAI } = await import('@google/genai');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `Analyze this food image. You must first correctly distinguish if this is an AI-generated image, a real photograph of food, a screenshot, or an illustration. Then, analyze the food to distinguish if it is fresh food or rotten food.

Return a JSON object EXACTLY matching this schema:
{
  "authenticityResult": "Passed - Authentic Photo" | "AI generated" | "Illustration detected" | "Screenshot detected",
  "authenticityConfidence": 0.0 to 1.0 (number),
  "foodName": "Name of food",
  "foodCategory": "Category",
  "freshnessScore": 0-100 (number),
  "spoilageRisk": "Low" | "Medium" | "High",
  "visibleMold": boolean,
  "estimatedAge": "e.g., 2 hours",
  "recommendedDonationTime": "e.g., 4 hours",
  "safeToDonate": "Yes" | "No" | "Needs Manual Review",
  "confidenceScore": 0-100 (number),
  "explanation": "Short explanation"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: mimeType
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text.trim());
      
      let authenticityInfo = { 
        result: result.authenticityResult || "Passed", 
        confidence: result.authenticityConfidence || 1.0 
      };

      if (authenticityInfo.result !== "Passed - Authentic Photo" && authenticityInfo.result !== "Passed") {
          return res.status(400).json({ 
              error: `Authenticity failed: ${authenticityInfo.result}. Please provide a real photograph of food.`, 
              authenticityResult: authenticityInfo.result, 
              authenticityConfidence: authenticityInfo.confidence 
          });
      }

      res.json({ result, authenticity: authenticityInfo });
    } catch (error: any) {
      console.error('AI Vision Error:', error);
      res.status(500).json({ error: "Failed to analyze image." });
    }
  });


  
  // Admin: Create Volunteer
  app.post("/api/admin/create-volunteer", express.json(), async (req, res) => {
    try {
      const { ngo_id, name, phone, email, vehicleType, vehicleNumber, password } = req.body;
      
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Server missing Supabase credentials" });
      }

      const realUrl = supabaseUrl.startsWith('postgresql') 
          ? 'https://jcpfgqlhirhcarroxfwx.supabase.co' 
          : supabaseUrl;

      const supabaseAdmin = createClient(realUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      let userId;
      // 1. Create Firebase Auth user using REST API if FIREBASE_API_KEY exists
      if (firebaseApiKey) {
          const fbResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, returnSecureToken: true })
          });
          const fbData = await fbResponse.json();
          if (fbData.error) {
              console.error("Firebase Auth Err", fbData.error);
              if (fbData.error.message === 'EMAIL_EXISTS') {
                  throw new Error('Username already exists. Please choose a different one.');
              }
              throw new Error(fbData.error.message);
          }
          userId = fbData.localId;
          
          // Optionally set display name
          await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: fbData.idToken, displayName: name, returnSecureToken: false })
          });
      } else {
          // Fallback to Supabase Auth if no Firebase Key (shouldn't happen in this environment)
          const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name: name, role: 'volunteer', ngo_id: ngo_id }
          });
          if (authErr) { 
              console.error("Auth Err", authErr); 
              if (authErr.message?.includes('already registered')) {
                  throw new Error('Username already exists. Please choose a different one.');
              }
              throw authErr; 
          }
          userId = authData.user.id;
      }

      // 2. Insert into profiles
      const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: name,
        email: email || `vol_${Date.now()}@unitemeal.org`,
        phone_number: phone,
        role: 'volunteer'
      });
      if (profErr) { console.error("Prof Err", profErr); throw profErr; }

      // 3. Insert into volunteers
      const { error: volErr } = await supabaseAdmin.from('volunteers').upsert({
        id: userId,
        vehicle_type: vehicleType || 'none',
        vehicle_plate: vehicleNumber,
        ngo_id: ngo_id,
        status: 'active',
        availability: 'online',
        approved: true
      });
      if (volErr) { console.error("Vol Err", volErr); throw volErr; }
      
      // Since schema for volunteers lacks ngo_id, we store it in profiles and use it
      // Let's add ngo_id to volunteers using the DB script or just store it in profiles.
      // Wait, I can alter volunteers to add ngo_id.
      
      res.json({ success: true, user_id: userId });
    } catch(err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

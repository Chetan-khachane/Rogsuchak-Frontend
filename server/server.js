import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

// Load environment variables from .env file
dotenv.config();


if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is missing. Please set it in your .env file or environment.");
    process.exit(1); 
}

// === SERVER SETUP ===
const app = express();
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Enable JSON body parsing

// Initialize the GoogleGenAI client with the API key
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Defines the required JSON structure (schema) for the model's output.
 * Using this schema guarantees the model returns valid, predictable JSON.
 */
const treatmentSchema = {
  type: "OBJECT",
  properties: {
    organic: {
      type: "STRING",
      description: "Organic treatment methods (1–2 sentences).",
    },
    biological: {
      type: "STRING",
      description: "Biological control methods (1–2 sentences).",
    },
    chemical: {
      type: "STRING",
      description: "Chemical treatment methods (1–2 sentences).",
    },
    prevention: {
      type: "ARRAY",
      description: "A list of five distinct prevention measures.",
      items: {
        type: "STRING",
      },
    },
  },
  // Ensure all fields are present in the final JSON
  required: ["organic", "biological", "chemical", "prevention"],
};


app.post("/api/treatment", async (req, res) => {
  const { disease } = req.body;

  if (!disease) {
    return res.status(400).json({ error: "Disease name is required." });
  }

  const prompt = `
    You are a professional plant pathologist AI. Provide the comprehensive treatment and prevention information for the plant disease "${disease}".
  `;
  
  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        temperature: 0.3, 
        responseMimeType: "application/json",
        responseSchema: treatmentSchema,
      },
    });

    const candidate = response.candidates?.[0];
    const jsonString = candidate?.content?.parts?.[0]?.text;

    if (!jsonString) {      
      const blockReason = candidate?.safetyRatings?.[0]?.blocked ? "Response blocked by safety settings." : "Empty response or no text part found.";
      console.error("Gemini API Error:", blockReason);
      return res.status(500).json({ error: "Failed to generate treatment data.", details: blockReason });
    }

  
    const data = JSON.parse(jsonString);
    
    // Log the successful data generation
    console.log(`Successfully generated structured data for "${disease}"`);

    // Send the  data  to the client
    res.json({ disease, data });

  } catch (error) {
    console.error("Gemini API Internal Error:", error.message);
    res.status(500).json({ 
      error: "Failed to process request due to an internal API error.", 
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001; 
app.listen(PORT,"0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});

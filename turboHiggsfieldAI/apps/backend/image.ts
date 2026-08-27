import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

export async function createImage(userPrompt: string, imageUrl: string, outputPath: string): Promise<void> {


    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const base64Image = Buffer.from(response.data).toString("base64");
    
    const input = [{
    type: "user_input" as const,
    content: [
        {
        type: "text" as const,
        text: userPrompt,
        },
        {
        type: "image" as const,
        mime_type: "image/png",
        data: base64Image,
        },
    ],
    }];
    
      const interaction = await ai.interactions.create({
        model: "gemini-3.1-flash-image",
        input,
      });
      const generatedImage = interaction.output_image;
      if (generatedImage?.data) {
        const buffer = Buffer.from(generatedImage.data, "base64");
        fs.writeFileSync(outputPath, buffer);
        console.log(`Image saved as ${outputPath}`);
      }
}
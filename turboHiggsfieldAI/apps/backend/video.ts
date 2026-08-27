import axios from "axios";
import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY_VIDEO!,
}); 

export async function generateVideo (userPrompt: string, imageUrls: string[], outputPath: string): Promise<void> {

    const imageBuffers = await Promise.all(imageUrls.map(async (imageUrl) => {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const base64Image = Buffer.from(response.data).toString("base64");
        return { 
            image:{ imageBytes: base64Image },
            referenceType: VideoGenerationReferenceType.ASSET,
         };
    }));

    let operation = await ai.models.generateVideos({
        model: "veo-3.1-generate-preview",
        prompt: userPrompt,
        config: {
            durationSeconds: 8,
            referenceImages: imageBuffers,
            generateAudio: false,
        },
    });

    // Poll the operation status until the video is ready.
    while (!operation.done) {
    console.log("Waiting for video generation to complete...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation,
    });
    }

    // Download the video.
    ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: outputPath,
    });
    console.log(`Generated video saved to ${outputPath}`);

}
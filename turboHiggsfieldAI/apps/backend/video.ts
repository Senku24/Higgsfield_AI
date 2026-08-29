import axios from "axios";
import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// const ai = new GoogleGenAI({
//   apiKey: process.env.GOOGLE_GENAI_API_KEY_VIDEO!,
// }); 

// export async function generateVideo (userPrompt: string, imageUrls: string[], outputPath: string): Promise<void> {

//     const imageBuffers = await Promise.all(imageUrls.map(async (imageUrl) => {
//         const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
//         const base64Image = Buffer.from(response.data).toString("base64");
//         return { 
//             image:{ imageBytes: base64Image },
//             referenceType: VideoGenerationReferenceType.ASSET,
//          };
//     }));

//     let operation = await ai.models.generateVideos({
//         model: "veo-3.1-generate-preview",
//         prompt: userPrompt,
//         config: {
//             durationSeconds: 8,
//             referenceImages: imageBuffers,
//             generateAudio: false,
//         },
//     });

//     // Poll the operation status until the video is ready.
//     while (!operation.done) {
//     console.log("Waiting for video generation to complete...");
//     await new Promise((resolve) => setTimeout(resolve, 10000));
//     operation = await ai.operations.getVideosOperation({
//         operation: operation,
//     });
//     }

//     // Download the video.
//     ai.files.download({
//     file: operation.response.generatedVideos[0].video,
//     downloadPath: outputPath,
//     });
//     console.log(`Generated video saved to ${outputPath}`);

// }

export async function generateVideo(prompt: string, imageUrls: string[], outputPath: string) {
    
    const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    };
    // Step 1: Submit the generation request
    const response = await fetch('https://openrouter.ai/api/v1/videos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: 'google/veo-3.1',
            prompt: prompt,
            duration: 8,
            generate_audio: false,
            input_references: imageUrls.map(imageurl => ({
                "type": "image_url",
                "image_url": {
                  "url": imageurl
                }
            }))
        }),
    });
    const result = await response.json();
    console.log(result)
    const jobId = result.id;
    const pollingUrl = result.polling_url;
    console.log(`Job submitted: ${jobId}`);
    console.log(`Status: ${result.status}`);
    //TODO add logic to keep polling!
}
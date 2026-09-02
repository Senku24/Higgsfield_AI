import { Worker, Job } from "bullmq";
import { redisConnection } from "../services/queue";
import { uploadToS3 } from "../services/s3";
import { db } from "../../prisma/db";
import axios from "axios";

export interface VideoJobData {
  videoId: string;
  userId: string;
  prompt: string;
  imageUrls: string[];
  duration: number;
  width: number;
  height: number;
}

export const videoWorker = new Worker<VideoJobData>(
  "video-queue",
  async (job: Job<VideoJobData>) => {
    const { videoId, prompt, imageUrls, duration } = job.data;
    console.log(`[VideoWorker] Processing video job ${job.id} for video ${videoId}`);

    const apiKey = process.env.OPENROUTER_API_KEY;

    try {
      if (!apiKey) {
        console.warn("[VideoWorker] OPENROUTER_API_KEY missing. Mocking video generation.");
        const mockVideoBuffer = Buffer.from("mock-video-content");
        const s3Url = await uploadToS3(mockVideoBuffer, `videos/${videoId}/output.mp4`, "video/mp4");
        await db.orm.public.AvatarVideo.where({ id: videoId }).update({
          status: "Done",
          videoUrl: s3Url,
          providerJobId: "mock_job_id",
        });
        return;
      }

      // Step 1: Submit generation request to OpenRouter (Google Veo 3.1)
      const submitResponse = await axios.post(
        "https://openrouter.ai/api/v1/videos",
        {
          model: "google/veo-3.1",
          prompt,
          duration: duration || 8,
          generate_audio: false,
          input_references: imageUrls.map((url) => ({
            type: "image_url",
            image_url: { url },
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const jobResult = submitResponse.data;
      const providerJobId = jobResult.id;
      const pollingUrl = jobResult.polling_url || `https://openrouter.ai/api/v1/videos/${providerJobId}`;

      await db.orm.public.AvatarVideo.where({ id: videoId }).update({
        providerJobId,
      });

      // Step 2: Poll until complete
      let isFinished = false;
      let finalVideoUrl = "";
      let attempts = 0;
      const maxAttempts = 60; // Max 10 minutes polling (60 * 10s)

      while (!isFinished && attempts < maxAttempts) {
        attempts++;
        await new Promise((res) => setTimeout(res, 10000)); // wait 10s

        const pollResponse = await axios.get(pollingUrl, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        const statusData = pollResponse.data;
        if (statusData.status === "completed" || statusData.status === "succeeded") {
          isFinished = true;
          finalVideoUrl = statusData.output?.video_url || statusData.video_url || statusData.result?.url;
        } else if (statusData.status === "failed" || statusData.status === "error") {
          throw new Error(statusData.error || "Video generation failed at provider");
        }
      }

      if (!isFinished || !finalVideoUrl) {
        throw new Error("Video generation timed out during polling");
      }

      // Step 3: Fetch video binary & upload to S3
      const videoBufferResp = await axios.get(finalVideoUrl, { responseType: "arraybuffer" });
      const s3Url = await uploadToS3(Buffer.from(videoBufferResp.data), `videos/${videoId}/output.mp4`, "video/mp4");

      // Step 4: Update DB record
      await db.orm.public.AvatarVideo.where({ id: videoId }).update({
        status: "Done",
        videoUrl: s3Url,
      });

      console.log(`[VideoWorker] Video ${videoId} completed successfully`);
    } catch (err: any) {
      console.error(`[VideoWorker] Error processing video ${videoId}:`, err?.message || err);
      await db.orm.public.AvatarVideo.where({ id: videoId }).update({
        status: "Error",
        errorMessage: err?.message || "Generation failed",
      });
      throw err;
    }
  },
  { connection: redisConnection }
);

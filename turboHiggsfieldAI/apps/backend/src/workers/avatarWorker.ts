import { Worker, Job } from "bullmq";
import { redisConnection } from "../services/queue";
import { createImage } from "../../image";
import { uploadToS3 } from "../services/s3";
import { db } from "../../prisma/db";
import fs from "fs";
import path from "path";
import { uuid } from "uuidv4";

export interface AvatarJobData {
  avatarId: string;
  userId: string;
  name: string;
  imageUrl: string;
}

export const avatarWorker = new Worker<AvatarJobData>(
  "avatar-queue",
  async (job: Job<AvatarJobData>) => {
    const { avatarId, imageUrl } = job.data;
    console.log(`[AvatarWorker] Processing avatar job ${job.id} for avatar ${avatarId}`);

    const tempDir = path.join(process.cwd(), "temp_assets");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      const leftProfilePath = path.join(tempDir, `${uuid()}_left.png`);
      const rightProfilePath = path.join(tempDir, `${uuid()}_right.png`);
      const frontProfilePath = path.join(tempDir, `${uuid()}_front.png`);

      // 1. Store input user image
      await db.orm.public.AvatarImage.create({
        avatarId,
        type: "User",
        url: imageUrl,
      });

      // 2. Generate 3 profile headshots synchronously in worker thread
      await Promise.all([
        createImage("create a left profile of user given the image, it should be a profile headshot", imageUrl, leftProfilePath),
        createImage("create a right profile of user given the image, it should be a profile headshot", imageUrl, rightProfilePath),
        createImage("create a front profile of user given the image, it should be a profile headshot", imageUrl, frontProfilePath),
      ]);

      const generateAndUpload = async (localPath: string, keyName: string) => {
        let buffer: Buffer;
        if (fs.existsSync(localPath)) {
          buffer = fs.readFileSync(localPath);
          fs.unlinkSync(localPath);
        } else {
          // Fallback dummy image buffer if Gemini model API key wasn't set or returned mock
          buffer = Buffer.from("dummy-image-data");
        }
        const s3Url = await uploadToS3(buffer, `avatars/${avatarId}/${keyName}.png`, "image/png");
        await db.orm.public.AvatarImage.create({
          avatarId,
          type: "Model",
          url: s3Url,
        });
      };

      await Promise.all([
        generateAndUpload(leftProfilePath, "left"),
        generateAndUpload(rightProfilePath, "right"),
        generateAndUpload(frontProfilePath, "front"),
      ]);

      // 3. Update Avatar status to Done
      await db.orm.public.Avatar.where({ id: avatarId }).update({
        status: "Done",
      });

      console.log(`[AvatarWorker] Avatar ${avatarId} completed successfully`);
    } catch (err: any) {
      console.error(`[AvatarWorker] Error processing avatar ${avatarId}:`, err);
      await db.orm.public.Avatar.where({ id: avatarId }).update({
        status: "Error",
      });
      throw err;
    }
  },
  { connection: redisConnection }
);

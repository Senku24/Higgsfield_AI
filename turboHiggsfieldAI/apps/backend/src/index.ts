import express from "express";
import argon2 from "argon2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { Temporal } from "@js-temporal/polyfill";
dotenv.config();

import { db } from "../prisma/db";
import { authMiddleware } from "./middleware/auth";
import { configureSecurity, authRateLimiter, generationRateLimiter } from "./middleware/security";
import { SignUpSchema, SignInSchema, RefreshTokenSchema, CreateAvatarSchema, CreateVideoSchema } from "./types";
import { checkModeration } from "./services/moderation";
import { getUserCreditBalance, grantSignupCredits, debitCredits } from "./services/credits";
import { avatarQueue, videoQueue } from "./services/queue";
import { CREDITS_CONFIG } from "@repo/config";

const app = express();
app.use(express.json());

// Configure CORS and Helmet security headers
configureSecurity(app);

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_dev";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function nowInstant() {
  return Temporal.Now.instant();
}

function futureInstant(msFromNow: number) {
  return Temporal.Instant.fromEpochMilliseconds(Date.now() + msFromNow);
}

// -----------------------------------------------------------------------------
// Auth Endpoints
// -----------------------------------------------------------------------------

app.post("/api/v1/signup", authRateLimiter, async (req, res) => {
  try {
    const parseResult = SignUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Invalid request body", issues: parseResult.error.issues });
      return;
    }

    const { username, email, password } = parseResult.data;

    // Check if username or email already exists
    const existingUsername = await db.orm.public.User.where({ username }).first();
    if (existingUsername) {
      res.status(409).json({ message: "Username already taken" });
      return;
    }

    const existingEmail = await db.orm.public.User.where({ email }).first();
    if (existingEmail) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // Hash password with argon2id
    const hashedPassword = await argon2.hash(password);

    const user = await db.orm.public.User.create({
      username,
      email,
      password: hashedPassword,
      emailVerifiedAt: nowInstant(),
      role: "USER",
    });

    // Grant signup credits (50 credits)
    await grantSignupCredits(user.id);

    res.status(201).json({ message: "Signup successful", id: user.id });
  } catch (err: any) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: err.message || "Internal server error during signup" });
  }
});

app.post("/api/v1/signin", authRateLimiter, async (req, res) => {
  try {
    const parseResult = SignInSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Invalid request body", issues: parseResult.error.issues });
      return;
    }

    const { username, password } = parseResult.data;

    const user = await db.orm.public.User.where({ username }).first();
    if (!user) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // Check password with argon2 (or fallback to bcrypt if legacy hash)
    let isPasswordValid = false;
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      try {
        isPasswordValid = await argon2.verify(user.password, password);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // Issue 15-minute Access Token & 30-day Refresh Token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = futureInstant(30 * 24 * 60 * 60 * 1000); // 30 days

    await db.orm.public.Session.create({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
    });

    res.json({
      message: "Signin successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("Signin Error:", err);
    res.status(500).json({ message: err.message || "Internal server error during signin" });
  }
});

app.post("/api/v1/refresh", async (req, res) => {
  try {
    const parseResult = RefreshTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Invalid refresh token payload" });
      return;
    }

    const { refreshToken } = parseResult.data;
    const tokenHash = hashToken(refreshToken);

    const session = await db.orm.public.Session.where({ refreshTokenHash: tokenHash }).first();

    if (!session || session.revokedAt) {
      res.status(401).json({ message: "Invalid or revoked refresh token" });
      return;
    }

    // Check expiry
    const expiresMs = session.expiresAt?.epochMilliseconds || new Date(session.expiresAt).getTime();
    if (expiresMs < Date.now()) {
      res.status(401).json({ message: "Expired refresh token" });
      return;
    }

    // Revoke old session (Rotation)
    await db.orm.public.Session.where({ id: session.id }).update({
      revokedAt: nowInstant(),
    });

    const user = await db.orm.public.User.where({ id: session.userId }).first();
    if (!user) {
      res.status(401).json({ message: "User no longer exists" });
      return;
    }

    // Issue new pair
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = futureInstant(30 * 24 * 60 * 60 * 1000);

    await db.orm.public.Session.create({
      userId: user.id,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    console.error("Refresh Error:", err);
    res.status(500).json({ message: "Internal server error during token refresh" });
  }
});

app.post("/api/v1/logout", authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      const session = await db.orm.public.Session.where({ refreshTokenHash: tokenHash }).first();
      if (session) {
        await db.orm.public.Session.where({ id: session.id }).update({ revokedAt: nowInstant() });
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.json({ message: "Logged out" });
  }
});

app.get("/api/v1/me", authMiddleware, async (req, res) => {
  try {
    const user = await db.orm.public.User.where({ id: req.userId! }).first();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const creditBalance = await getUserCreditBalance(user.id);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      creditBalance,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    console.error("Me endpoint error:", err);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// -----------------------------------------------------------------------------
// Avatar Endpoints
// -----------------------------------------------------------------------------

app.post("/api/v1/avatar", authMiddleware, generationRateLimiter, async (req, res) => {
  try {
    const parseResult = CreateAvatarSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Invalid request body", issues: parseResult.error.issues });
      return;
    }

    const { name, image } = parseResult.data;
    const userId = req.userId!;

    // 1. Moderation check
    const modResult = await checkModeration(name);
    if (modResult.flagged) {
      res.status(400).json({ message: `Avatar creation blocked by moderation: ${modResult.flagReason}` });
      return;
    }

    // 2. Avatar creation & credit debit
    const costCredits = CREDITS_CONFIG.avatarGenerationCost;
    const avatar = await db.orm.public.Avatar.create({
      userId,
      name,
      status: "Pending",
    });

    const idempotencyKey = `avatar_gen_${avatar.id}`;
    try {
      await debitCredits(userId, costCredits, "avatar_generation", avatar.id, idempotencyKey);
    } catch (err: any) {
      await db.orm.public.Avatar.where({ id: avatar.id }).delete();
      res.status(402).json({ message: err.message || "Insufficient credits" });
      return;
    }

    // 3. Enqueue background worker job
    try {
      await avatarQueue.add("generate-avatar", {
        avatarId: avatar.id,
        userId,
        name,
        imageUrl: image,
      });
    } catch (queueErr) {
      console.warn("Failed to add job to BullMQ queue (Redis issue?):", queueErr);
    }

    res.status(202).json({
      id: avatar.id,
      status: "pending",
      costCredits,
    });
  } catch (err: any) {
    console.error("Create avatar error:", err);
    res.status(500).json({ message: "Internal server error during avatar creation" });
  }
});

app.get("/api/v1/avatars", authMiddleware, async (req, res) => {
  try {
    const avatars = (await db.orm.public.Avatar.where({ userId: req.userId! }).all()) || [];
    
    // Attach avatar images
    const avatarsWithImages = await Promise.all(
      avatars.map(async (avatar: any) => {
        const images = (await db.orm.public.AvatarImage.where({ avatarId: avatar.id }).all()) || [];
        return { ...avatar, avatarImages: images };
      })
    );

    res.json({ avatars: avatarsWithImages });
  } catch (err: any) {
    console.error("Get avatars error:", err);
    res.status(500).json({ message: "Failed to fetch avatars" });
  }
});

app.get("/api/v1/avatar/:avatarId", authMiddleware, async (req, res) => {
  try {
    const avatar = await db.orm.public.Avatar.where({ id: req.params.avatarId }).first();
    if (!avatar || avatar.userId !== req.userId) {
      res.status(404).json({ message: "Avatar not found" });
      return;
    }

    const images = (await db.orm.public.AvatarImage.where({ avatarId: avatar.id }).all()) || [];
    res.json({ avatar: { ...avatar, avatarImages: images } });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching avatar" });
  }
});

// -----------------------------------------------------------------------------
// Video Endpoints
// -----------------------------------------------------------------------------

app.post("/api/v1/video", authMiddleware, generationRateLimiter, async (req, res) => {
  try {
    const parseResult = CreateVideoSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "Invalid request body", issues: parseResult.error.issues });
      return;
    }

    const { prompt, avatarIds, duration, width, height, startFrame, endFrame } = parseResult.data;
    const userId = req.userId!;

    // 1. Moderation check
    const modResult = await checkModeration(prompt);
    if (modResult.flagged) {
      res.status(400).json({ message: `Video creation blocked by moderation: ${modResult.flagReason}` });
      return;
    }

    // 2. Check avatar ownership & collect image URLs
    const imageUrls: string[] = [];
    if (startFrame) imageUrls.push(startFrame);

    for (const avatarId of avatarIds) {
      const avatar = await db.orm.public.Avatar.where({ id: avatarId }).first();
      if (!avatar || avatar.userId !== userId) {
        res.status(403).json({ message: `Forbidden: Avatar ${avatarId} does not belong to user` });
        return;
      }
      const avatarImages = (await db.orm.public.AvatarImage.where({ avatarId }).all()) || [];
      for (const img of avatarImages) {
        imageUrls.push(img.url);
      }
    }

    if (endFrame) imageUrls.push(endFrame);

    // 3. Video record creation & credit debit
    const costCredits = CREDITS_CONFIG.videoGenerationCost;
    const avatarVideo = await db.orm.public.AvatarVideo.create({
      userId,
      prompt,
      startFrame,
      endFrame,
      duration,
      width,
      height,
      status: "Pending",
      costCredits,
      moderationFlag: "NONE",
    });

    // Link avatar references
    for (const avatarId of avatarIds) {
      await db.orm.public.AvatarVideoReference.create({
        avatarVideoId: avatarVideo.id,
        avatarId,
      });
    }

    const idempotencyKey = `video_gen_${avatarVideo.id}`;
    try {
      await debitCredits(userId, costCredits, "video_generation", avatarVideo.id, idempotencyKey);
    } catch (err: any) {
      await db.orm.public.AvatarVideo.where({ id: avatarVideo.id }).delete();
      res.status(402).json({ message: err.message || "Insufficient credits" });
      return;
    }

    // 4. Enqueue BullMQ queue job
    try {
      await videoQueue.add("generate-video", {
        videoId: avatarVideo.id,
        userId,
        prompt,
        imageUrls,
        duration,
        width,
        height,
      });
    } catch (queueErr) {
      console.warn("Failed to add video job to BullMQ queue:", queueErr);
    }

    res.status(202).json({
      id: avatarVideo.id,
      status: "pending",
      costCredits,
    });
  } catch (err: any) {
    console.error("Create video error:", err);
    res.status(500).json({ message: "Internal server error during video creation" });
  }
});

app.get("/api/v1/videos", authMiddleware, async (req, res) => {
  try {
    const videos = (await db.orm.public.AvatarVideo.where({ userId: req.userId! }).all()) || [];
    res.json({ videos });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

app.get("/api/v1/video/:videoId", authMiddleware, async (req, res) => {
  try {
    const video = await db.orm.public.AvatarVideo.where({ id: req.params.videoId }).first();
    if (!video || video.userId !== req.userId) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    const references = (await db.orm.public.AvatarVideoReference.where({ avatarVideoId: video.id }).all()) || [];
    res.json({ video: { ...video, avatarVideoReferences: references } });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching video" });
  }
});

// -----------------------------------------------------------------------------
// Models Information Endpoint
// -----------------------------------------------------------------------------

app.get("/api/v1/models", (req, res) => {
  res.json({
    models: [
      {
        id: "gemini-3.1-flash-image",
        type: "image",
        name: "Gemini 3.1 Flash Image (Soul ID Avatar)",
        provider: "Google Gemini",
        costCredits: CREDITS_CONFIG.avatarGenerationCost,
      },
      {
        id: "google/veo-3.1",
        type: "video",
        name: "Google Veo 3.1 (Camera & Multi-frame Video)",
        provider: "OpenRouter / Google",
        costCredits: CREDITS_CONFIG.videoGenerationCost,
      },
    ],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Backend] Server is running on port ${PORT}`);
});

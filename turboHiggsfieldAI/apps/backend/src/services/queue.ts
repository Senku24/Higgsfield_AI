import { Queue } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let hasLoggedRedisError = false;

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) {
      if (!hasLoggedRedisError) {
        console.warn("[Queue] Redis server not reachable. Async generation queue will remain offline until Redis is started.");
        hasLoggedRedisError = true;
      }
      return 10000; // retry every 10s quietly
    }
    return Math.min(times * 500, 2000);
  },
});

redisConnection.on("error", (err) => {
  if (!hasLoggedRedisError) {
    console.warn("[Queue] Redis connection warning:", err.message || "Connection refused");
    hasLoggedRedisError = true;
  }
});

export const avatarQueue = new Queue("avatar-queue", {
  connection: redisConnection,
});

export const videoQueue = new Queue("video-queue", {
  connection: redisConnection,
});

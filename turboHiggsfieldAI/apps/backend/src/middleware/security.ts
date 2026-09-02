import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Express } from "express";

export function configureSecurity(app: Express) {
  // CORS configuration
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          callback(null, true);
        } else {
          callback(new Error("CORS policy violation: Origin not allowed"));
        }
      },
      credentials: true,
    })
  );

  // Helmet headers security
  app.use(helmet());
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { message: "Too many auth attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 generation requests per minute
  message: { message: "Rate limit exceeded. Please slow down your generation requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

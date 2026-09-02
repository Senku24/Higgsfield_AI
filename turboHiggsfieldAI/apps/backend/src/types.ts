import { z } from "zod";

export const SignUpSchema = z.object({
  username: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const SignInSchema = z.object({
  username: z.string().min(2).max(100),
  password: z.string().min(6).max(100),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const CreateAvatarSchema = z.object({
  name: z.string().min(2).max(100),
  image: z.string().url(),
});

export const CreateVideoSchema = z.object({
  prompt: z.string().min(3).max(2000),
  avatarIds: z.array(z.string().uuid()).min(1),
  duration: z.number().int().min(1).max(30).default(8),
  width: z.number().int().min(128).max(4096).default(1024),
  height: z.number().int().min(128).max(4096).default(1024),
  startFrame: z.string().url().optional(),
  endFrame: z.string().url().optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type CreateAvatarInput = z.infer<typeof CreateAvatarSchema>;
export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;

import z from "zod";

export const CreateUserSchema = z.object({
    username : z.string().min(2).max(100),
    password : z.string().min(6).max(100)
})

export const CreateAvatarSchema = z.object({
    name: z.string().min(2).max(100),
    images: z.array(z.string().url()).min(1).max(10)
})
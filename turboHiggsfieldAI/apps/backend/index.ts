import express from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import { db } from "./prisma/db";
import { CreateUserSchema, CreateAvatarSchema } from "./tyoes"
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import { authMiddleware } from "./middleware/auth";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

app.post("/api/v1/signup", async (req, res) => {
  const {success, data, error } = CreateUserSchema.safeParse(req.body);
  if(!success){
    res.status(403).json({
      message : "Invalid request body",
      issues : error.issues
    });
    return;
    }
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await db.orm.public.User.create({
      username: data.username,
      password: hashedPassword,
  });

  res.json({ message: "Signup successful", id: user.id });
});

app.post("/api/v1/signin", async (req, res) => {
  const {success, data, error } = CreateUserSchema.safeParse(req.body);
  if(!success){
    res.status(403).json({
      message : "Invalid request body",
      issues : error.issues
    });
    return;
    }
  const userExists = await db.orm.public.User
  .where({ username: data.username })
  .first();

  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }
  const isPasswordValid = await bcrypt.compare(data.password, userExists.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = jwt.sign({ userId: userExists.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

  res.json({ message: "Signin successful", token });
});

app.post("/api/v1/avatar", authMiddleware, async (req, res) => {
  const {success, data, error } = CreateAvatarSchema.safeParse(req.body);
  if(!success){
    res.status(403).json({
      message : "Invalid request body",
      issues : error.issues
    });
    return;
  }
  
  const imagePath = "path/to/cat_image.png";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    { type: "text", text: "Create a picture of my cat eating a nano-banana in a" +
            "fancy restaurant under the Gemini constellation" },
    {
      type: "image",
      mime_type: "image/png",
      data: base64Image
    },
  ];

  const interaction = await ai.interactions.create({
    model: "gemini-3.1-flash-image",
    input: prompt,
  });
  const generatedImage = interaction.output_image;
  if (generatedImage) {
    const buffer = Buffer.from(generatedImage.data, "base64");
    fs.writeFileSync("gemini-native-image.png", buffer);
    console.log("Image saved as gemini-native-image.png");
  }
}

);

app.post("/api/v1/video", authMiddleware, (req, res) => {

});

app.get("/api/v1/videos", (req, res) => {

});
app.get("/api/v1/video/:videoId", (req, res) => {

});
app.get("/api/v1/me", (req, res) => {

});
app.get("/api/v1/models", (req, res) => {

});
app.get("/api/v1/avatar/:avatarId", (req, res) => {

});
app.get("/api/v1/avatars", (req, res) => {

});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
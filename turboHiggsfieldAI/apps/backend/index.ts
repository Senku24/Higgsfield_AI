import express from "express";
import { uuid } from "uuidv4";
import bcrypt from "bcrypt";
import { db } from "./prisma/db";
import { CreateUserSchema, CreateAvatarSchema } from "./tyoes"
import { createImage } from "./image";
import { generateVideo } from "./video";
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
  const leftProfileId = uuid();
  const rightProfileId = uuid();
  const frontProfileId = uuid();
  await Promise.all([
    createImage("create a left profile of user given the image, it should be a profile headshot", data.image, `./assets/${leftProfileId}.png`),
    createImage("create a right profile of user given the image, it should be a profile headshot", data.image, `./assets/${rightProfileId}.png`),
    createImage("create a front profile of user given the image, it should be a profile headshot", data.image, `./assets/${frontProfileId}.png`)
  ]);
  // put in s3 bucket then save the urls in the database.

});

app.post("/api/v1/video", authMiddleware, async (req, res) => {
  generateVideo("The video opens with a medium, eye-level shot of a beautiful man with dark hair and warm brown eyes.he wears a magnificent, high-fashion flamingo dress with layers of pink and fuchsia feathers, complemented by whimsical pink, heart-shaped sunglasses.he walks with serene confidence through the crystal-clear, shallow turquoise water of a sun-drenched lagoon. The camera slowly pulls back to a medium-wide shot, revealing the breathtaking scene as the dress's long train glides and floats gracefully on the water's surface behind him. The cinematic, dreamlike atmosphere is enhanced by the vibrant colors of the dress against the serene, minimalist landscape, capturing a moment of pure elegance and high-fashion fantasy",
     ["./assets/leftProfile.png", "./assets/rightProfile.png", "./assets/frontProfile.png"], "./outputs/video.mp4");
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
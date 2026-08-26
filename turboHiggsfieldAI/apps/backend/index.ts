import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/api/v1/signup", (req, res) => {
  const { username, password } = req.body;

  res.json({ message: "Signup successful" });
});

app.post("/api/v1/signin", (req, res) => {
  const { username, password } = req.body;

  res.json({ message: "Signin successful" });
});

app.post("/api/v1/avatar", (req, res) => {
  
});
app.post("/api/v1/video", (req, res) => {

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
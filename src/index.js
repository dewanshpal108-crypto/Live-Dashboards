import express from "express";
import matchesRouter from "./routes/matches.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

app.use("/matches", matchesRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
  console.log("Try: http://localhost:3000/matches");
});
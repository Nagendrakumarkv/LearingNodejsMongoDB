require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());

//JWT Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"
  if (!token) {
    return res.status(401).send("Authentication required");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    res.status(401).send("Invalid token");
  }
};

//Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error", err));

//Use routes
app.use("/users", userRoutes);
app.use("/messages", authMiddleware, messageRoutes);

//Root route
app.get("/", (req, res) => {
  res.send("welcome to day 5 nodejs and mongoDb learning");
});

//Invalid routes
app.use((req, res) => {
  res.status(404).send("Route not found");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server is runnig on http://localhost:3000");
});

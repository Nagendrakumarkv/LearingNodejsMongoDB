require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const logRequest = require("./middleware/logRequest");
const rateLimit = require("./middleware/rateLimit");
const restrictWeekends = require("./middleware/restrictWeekends");
const logger = require("./logger");
const { NotFoundError, UnauthorizedError } = require("./errors/customErrors");

const app = express();

app.use(express.json());
app.use(logRequest); // Add logging middleware globally
app.use(rateLimit); // Add rate limiting globally
app.use(passport.initialize());

//JWT Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"
  if (!token) {
    return res.status(401).send("Authentication required");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid token"));
  }
};

//Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to MongoDB Atlas"))
  .catch((err) => logger.error(`MongoDB connection error: ${err.message}`));

//Use routes
app.use("/users", userRoutes);
app.use("/messages", authMiddleware, restrictWeekends, messageRoutes);
app.use("/auth", authRoutes);

//Root route
app.get("/", (req, res) => {
  res.send("welcome to day 5 nodejs and mongoDb learning");
});

//Invalid routes
app.use((req, res) => {
  next(new NotFoundError("Route not found"));
});

//Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  logger.error(`${err.name}: ${message} - ${req.method} ${req.path}`);
  res.status(statusCode).json({ error: { name: err.name, message } });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});

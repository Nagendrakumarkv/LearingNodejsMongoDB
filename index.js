require("dotenv").config();
const express = require("express");
const http = require("http"); // Required for Socket.io
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const path = require("path");
const Grid = require("gridfs-stream");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const logRequest = require("./middleware/logRequest");
const rateLimit = require("./middleware/rateLimit");
const restrictWeekends = require("./middleware/restrictWeekends");
const logger = require("./logger");
const { NotFoundError, UnauthorizedError } = require("./errors/customErrors");
const { Server } = require("socket.io"); // Import Socket.io

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Initialize Socket.io

app.use(express.json());
app.use(logRequest); // Add logging middleware globally
app.use(rateLimit); // Add rate limiting globally
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files

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

let gfs;
mongoose.connection.once("open", () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection("uploads");
  app.set("gfs", gfs); // Set gfs after initialization
  logger.info("GridFS initialized");
});

// Socket.io JWT Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user to socket
    logger.info(`Socket authenticated for user ${decoded.id}`);
    next();
  } catch (error) {
    logger.error(`Socket authentication failed: ${error.message}`);
    next(new Error("Invalid token"));
  }
});

//Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to MongoDB Atlas"))
  .catch((err) => logger.error(`MongoDB connection error: ${err.message}`));

app.set("io", io); // Make io available to routes

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

io.on("connection", (socket) => {
  logger.info(
    `A user connected: ${socket.id} (User ID: ${
      socket.user?.id || "Unauthenticated"
    })`
  );
  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});

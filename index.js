require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

app.use(express.json());

//Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error", err));

//Use routes
app.use("/messages", messageRoutes);

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

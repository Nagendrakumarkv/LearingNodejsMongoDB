const express = require("express");
const mongoose = require("mongoose");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

app.use(express.json());

//Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/myapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error", err));

//Use routes
app.use("/messages", messageRoutes);

//Root route
app.get("/", (req, res) => {
  res.send("welcome to day 4 nodejs and mongoDb learning");
});

//Invalid routes
app.use((req, res) => {
  res.status(404).send("Route not found");
});

app.listen(3000, () => {
  console.log("Server is runnig on http://localhost:3000");
});

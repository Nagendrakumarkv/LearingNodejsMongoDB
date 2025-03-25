const express = require("express");
const mongoose = require("mongoose");
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

app.get("/", (req, res) => {
  res.send("Welcome NodeJs Express");
});

//Define schema
const messageSchema = mongoose.Schema({
  text: String,
  author: String,
  createdAt: { type: Date, default: Date.now },
});

//Create a model
const Message = mongoose.model("Message", messageSchema);

app.get("/", (req, res) => {
  res.send("welcome to day 3 nodejs and mongoDb learning");
});

app.post("/messages", async (req, res) => {
  try {
    const message = new Message({
      text: req.body.text,
      author: req.body.author,
    });
    await message.save();
    res.status(201).send(message);
  } catch (error) {
    res.status(500).send("Error saving messages");
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).send(messages);
  } catch (error) {
    res.status(500).send("Error while fetching messages");
  }
});

app.get("/message", async (req, res) => {
  try {
    const message = await Message.findById("67e217d388b1d0d79abf6c37");
    if (message) {
      res.status(200).send(message);
    } else {
      res.status(400).send("Message not available for that id");
    }
  } catch (error) {
    res.status(500).send("Error while fetching message");
  }
});

app.listen(3000, () => {
  console.log("Server is runnig on http://localhost:3000");
});

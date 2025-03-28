const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

//GET all messages
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).send(messages);
  } catch (error) {
    res.status(500).send("Error while fetching messages");
  }
});

//GET single message
router.get("/:id", async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      res.status(404).send("Message not found");
    }
    res.status(200).send(message);
  } catch (error) {
    res.status(500).send("Error while fetching message");
  }
});

//POST a new message
router.post("/", async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(404).send("text required");
    }
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

//PUT update a message
router.put("/:id", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { text: req.body.text, author: req.body.author },
      { new: true } // Returns the updated document
    );

    if (!message) {
      res.status(404).send("Message not found");
    }
    res.send(message);
  } catch (error) {
    res.status(500).send("Error updating message");
  }
});

//DELETE a message
router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      res.status(404).send("Message not found");
    }
    res.send("Message Deleted");
  } catch (error) {
    res.status(500).send("Error deletinng message");
  }
});

module.exports = router;

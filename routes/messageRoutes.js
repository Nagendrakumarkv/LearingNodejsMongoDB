const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");

//POST a new message
router.post(
  "/",
  [body("text").notEmpty().withMessage("Text is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const message = new Message({ text: req.body.text, user: req.user.id }); // From JWT
      await message.save();
      res.status(201).send(message);
    } catch (error) {
      res.status(500).send("Error saving messages");
    }
  }
);

// New Stats Route
router.get("/stats", async (req, res) => {
  try {
    const stats = await Message.aggregate([
      // Filter messages from last 24 hours
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      },
      // Group by user and count messages
      {
        $group: {
          _id: "$user",
          messageCount: { $sum: 1 },
          avgTextLength: { $avg: { $strLenCP: "$text" } },
        },
      },
      // Populate user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      // Unwind userInfo array
      { $unwind: "$userInfo" },
      // Project final fields
      {
        $project: {
          username: "$userInfo.username",
          messageCount: 1,
          avgTextLength: 1,
          _id: 0,
        },
      },
      // Sort by messageCount descending
      // { $sort: { messageCount: -1 } },
      // // Limit to top 1 (most active user)
      // { $limit: 1 },
    ]);
    res.send(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).send("Error fetching stats");
  }
});

//Get total message count
router.get("/total-messages", async (req, res) => {
  try {
    const total = await Message.aggregate([
      // Count all documents
      {
        $group: {
          _id: null, // No grouping, just total
          totalMessages: { $sum: 1 },
        },
      },
      // Project only the total
      {
        $project: {
          totalMessages: 1,
          _id: 0,
        },
      },
    ]);
    res.send(total[0] || { totalMessages: 0 }); // Handle empty case
  } catch (error) {
    console.error("Total messages error:", error);
    res.status(500).send("Error fetching total");
  }
});

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

//PUT update a message
router.put(
  "/:id",
  [body("text").notEmpty().withMessage("Text is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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
  }
);

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

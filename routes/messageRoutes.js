const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");
const {
  NotFoundError,
  ValidationError,
  DatabaseError,
} = require("../errors/customErrors");
const logger = require("../logger"); // Import logger
const multer = require("multer");
const path = require("path");

// Assuming io is available globally (we'll pass it in Step 5)
let io;

router.use((req, res, next) => {
  io = req.app.get("io"); // Get io instance from app
  next();
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      const error = new ValidationError("Only images and PDFs are allowed!");
      logger.error(`Upload failed for user ${req.user?.id}: ${error.message}`);
      return cb(error);
    }
  },
}).single("file");

//POST a new message
router.post(
  "/",
  [body("text").notEmpty().withMessage("Text is required")],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new ValidationError(
          "Validation failed: " +
            errors
              .array()
              .map((e) => e.msg)
              .join(", ")
        )
      );
    }
    try {
      const message = new Message({ text: req.body.text, user: req.user.id }); // From JWT
      await message.save().catch((err) => {
        throw new DatabaseError(`Failed to save message: ${err.message}`);
      });
      logger.info(`Message created by user ${req.user.id}: "${req.body.text}"`);
      if (io) {
        const broadcastMessage = {
          text: message.text,
          userId: req.user.id,
          createdAt: message.createdAt,
        };
        io.emit("newMessage", broadcastMessage);

        logger.info(
          `Broadcasting new message ${req.user.id}: ${JSON.stringify(
            broadcastMessage
          )}`
        );
      }
      res.status(201).send(message);
    } catch (error) {
      next(error);
    }
  }
);

//POST file upload
router.post("/upload", (req, res, next) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      logger.error(
        `Upload failed for user ${req.user?.id}: Multer error - ${err.message}`
      );
      return next(new ValidationError(`Multer error: ${err.message}`));
    } else if (err) {
      logger.error(`Upload failed for user ${req.user?.id}: ${err.message}`);
      return next(err);
    }
    if (!req.file) {
      logger.error(`Upload failed for user ${req.user?.id}: No file uploaded`);
      return next(new ValidationError("No file uploaded"));
    }
    try {
      const message = new Message({
        text: req.body.text || `Uploaded file: ${req.file.originalname}`,
        user: req.user.id,
        filePath: req.file.path,
        fileName: req.file.filename,
      });
      await message.save();
      logger.info(
        `File uploaded by user ${req.user.id}: ${req.file.originalname}`
      );
      if (io) {
        const broadcastMessage = {
          text: `File uploaded: ${req.file.originalname}`,
          userId: req.user.id,
          createdAt: message.createdAt,
          filePath: `/uploads/${req.file.filename}`,
        };
        io.emit("newMessage", broadcastMessage);
        logger.info(
          `Broadcasting file upload to room ${req.user.id}: ${JSON.stringify(
            broadcastMessage
          )}`
        );
      }
      res.status(201).send({
        message: "File uploaded successfully",
        filePath: `/uploads/${req.file.filename}`,
      });
    } catch (error) {
      logger.error(`Upload failed for user ${req.user?.id}: ${error.message}`);
      next(error);
    }
  });
});

// New Stats Route
router.get("/stats", async (req, res, next) => {
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
    ]).catch((err) => {
      throw new DatabaseError(`Failed to fetch stats: ${err.message}`);
    });
    if (!stats.length) throw new NotFoundError("No stats available");
    res.send(stats);
  } catch (error) {
    next(error);
  }
});

//Get total message count
router.get("/total-messages", async (req, res, next) => {
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
    next(error);
  }
});

//GET all messages
router.get("/", async (req, res, next) => {
  try {
    const messages = await Message.find();
    res.status(200).send(messages);
  } catch (error) {
    next(error);
  }
});

//GET single message
router.get("/:id", async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      res.status(404).send("Message not found");
    }
    res.status(200).send(message);
  } catch (error) {
    next(error);
  }
});

//PUT update a message
router.put(
  "/:id",
  [body("text").notEmpty().withMessage("Text is required")],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new ValidationError(
          "Validation failed: " +
            errors
              .array()
              .map((e) => e.msg)
              .join(", ")
        )
      );
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
      next(error);
    }
  }
);

//DELETE a message
router.delete("/:id", async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      res.status(404).send("Message not found");
    }
    res.send("Message Deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = router;

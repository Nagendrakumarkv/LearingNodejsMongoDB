require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const User = require("../models/User");
const {
  ValidationError,
  UnauthorizedError,
} = require("../errors/customErrors");
const logger = require("../logger"); // Import logger

//Register a new user
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be atleasr 6 characters"),
  ],
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
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).send("Username and password required");
      }
      const user = new User({ username, password });
      await user.save();
      res.status(201).send("User registered");
    } catch (error) {
      if (error.code === 11000)
        return next(new ValidationError("Username already exists"));
      next(error);
    }
  }
);

//Login and get JWT
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
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
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user || !(await user.comparePassword(password))) {
        return next(new UnauthorizedError("Invalid credentials"));
      }
      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "10s",
      });
      const refreshToken = crypto.randomBytes(32).toString("hex");
      user.refreshToken = refreshToken;
      await user.save();
      res.send({ accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/refresh", async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new ValidationError("Refresh token required"));
  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return next(new UnauthorizedError("Invalid refresh token"));
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    res.send({ accessToken });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new ValidationError("Refresh token required"));
  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return next(new UnauthorizedError("Invalid refresh token"));
    user.refreshToken = null; // Invalidate the refresh token
    await user.save();
    logger.info(`User ${user.username} logged out successfully`);
    res.send({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

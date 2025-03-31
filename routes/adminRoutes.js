require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Get all users (admin only)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    res.json(users);
  } catch (error) {
    res.status(500).send("Error fetching users");
  }
});

// Update user by ID (admin only)
router.put("/users/:id", async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send("Username already exists");
    }
    res.status(500).send("Error updating user");
  }
});

// Delete user by ID (admin only)
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.send("User deleted successfully");
  } catch (error) {
    res.status(500).send("Error deleting user");
  }
});

module.exports = router;
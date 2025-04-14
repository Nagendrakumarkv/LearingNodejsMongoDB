const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // Reference to User
  createdAt: { type: Date, default: Date.now },
  fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file ID
});

module.exports = mongoose.model("Message", messageSchema);

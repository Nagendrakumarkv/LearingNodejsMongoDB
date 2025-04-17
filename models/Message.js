const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // Reference to User
  createdAt: { type: Date, default: Date.now, index: true },
  fileKey: { type: String }, // S3 key
  fileUrl: { type: String }, // Public URL
});

module.exports = mongoose.model("Message", messageSchema);

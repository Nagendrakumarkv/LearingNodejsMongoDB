const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // Reference to User
  createdAt: { type: Date, default: Date.now },
  filePath: { type: String }, // Path to the uploaded file
  fileName: { type: String }, // Original filename
});

module.exports = mongoose.model("Message", messageSchema);

const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  text: String,
  author: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);

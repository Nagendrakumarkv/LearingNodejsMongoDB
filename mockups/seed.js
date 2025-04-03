require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Message = require("../models/Message");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Message.deleteMany({});

    // Add users
    const user1 = await new User({
      username: "alice",
      password: "pass123",
    }).save();
    const user2 = await new User({
      username: "bob",
      password: "pass123",
    }).save();

    // Add messages
    await Message.insertMany([
      { text: "Hello world", user: user1._id },
      { text: "Node.js is fun", user: user1._id },
      { text: "MongoDB rocks", user: user2._id },
      { text: "Learning is great", user: user2._id },
      { text: "Hi there", user: user1._id },
    ]);

    console.log("Data seeded");
    mongoose.connection.close();
  })
  .catch((err) => console.error("Error:", err));

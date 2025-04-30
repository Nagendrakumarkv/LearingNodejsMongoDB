const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logger = require("../logger"); // Import logger

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${
        process.env.BACKEND_URL || "http://localhost:3000"
      }/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ username: profile.id });
        if (!user) {
          user = new User({ username: profile.id, password: "google-auth" }); // Dummy password
          await user.save();
        }
        logger.info(
          `Google login successful for user ${profile.displayName} (ID: ${profile.id})`
        );
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    //res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    res.redirect(`https://angular19withnodejsintegration.onrender.com/login?token=${token}`);
  }
);

module.exports = router;

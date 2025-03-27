const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config(); // ✅ Load environment variables
const verifyToken = require("../middlewares/authMiddleware");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const passport = require("passport");
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // To generate secure tokens
const fs = require("fs");
const path = require("path");


const router = express.Router();
// Load questions JSON file


// const protectRoute = require("../middlewares/authMiddleware"); // ✅ Import middleware

// ✅ Protected Route for Testing
// router.get("/protected", protectRoute, (req, res) => {
//   console.log("JWT Working");
//   res.json({ message: "Success", user: req.user });
// });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://medical-backend-loj4.onrender.com/api/auth/callback/google",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // If user doesn't exist, create a new user record
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: null, // Password is null for Google signups
            isVerified: true, // Email is verified since it's coming from Google
          });

          await user.save();
        }

        // Generate a JWT token for the user
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Attach the token to the user object
        user.token = token;

        // Return the user
        done(null, user);
      } catch (error) {
        console.error("Google Strategy Error:", error);
        done(error, null);
      }
    }
  )
);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// http://localhost:5000/auth/callback/google
router.get(
  "/callback/google",

  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user;
    // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const token = user.token;
    res.cookie("token", token, { httpOnly: true, secure: true });
    res.redirect(`https://medical-frontend-phi.vercel.app/verify/${token}`);
  }
);
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// module.exports = router;
// ✅ Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Signup Route with Email Verification
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, userRole } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false, // 🛑 Initially, user is unverified
      role: userRole
    });
    await newUser.save();

    // const verificationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    // 📧 Send Verification Email
    const verificationLink = `https://medical-backend-loj4.onrender.com/api/auth/verify-email?token=${verificationToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      text: `Click this link to verify your email: ${verificationLink}`,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Verification Email Sent to:", email);

    return res.status(201).json({
      message: "Signup successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Error signing up", error: error.message });
  }
});
// protected route
// Token Verification Route
// router.get("/verify", async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1]; // Extract token from headers
//     if (!token) {
//       return res.status(401).json({ message: "Unauthorized: No token provided" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
//     res.status(200).json({ message: "Token is valid", user: decoded });
//   } catch (error) {
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// });

// module.exports = router;
// ✅ Email Verification Route
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Invalid or missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.isVerified = true;
    // user.verificationToken = null; // Remove token after verification
    await user.save();

    // return res.json({ message: "Email verified successfully! You can now log in." });
    return res.redirect("https://medical-frontend-phi.vercel.app/login");
  } catch (error) {
    console.error("Email Verification Error:", error);
    return res.status(500).json({ message: "Error verifying email", error: error.message });
  }
});

// module.exports = router;
// ✅ Forgot Password Route
// ✅ Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token (valid for 15 minutes)
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });
    console.log("Generated Token:", resetToken); // ✅ Add this line

    // Send email with reset link
    const resetLink = `https://medical-frontend-phi.vercel.app/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Password Reset Email Sent to:", user.email);
    return res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Error sending reset link." });
  }
});


// ✅ Reset Password Route
// ✅ Reset Password Route
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    console.log("Received Request:", { email, token, newPassword });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Log token details

    if (!decoded || decoded.email !== email) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Error resetting password." });
  }
});


// module.exports = router;
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password", resetPassword);

// module.exports = router;
// ✅ Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if the user's email is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please check your email to verify your account' });
    }

    // Compare the provided password with the stored password hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    // Check if the role matches the user's role in the database
    // if (user.role !== role) {
    //   return res.status(400).json({ message: 'Invalid role' });
    // }
    // Generate a JWT token
    const token = jwt.sign({ userId: user._id, role: user?.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the token back to the client
    res.json({ token, userId: user._id, message: 'Login successful', role: user?.role, name: user.name, email: user.email });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "This is a protected route!",
    userId: req.user.userId, // User ID
    email: req.user.email    // User Email
  });
});



router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password")
    const filteredUsers = users.filter(doc => doc.role !== "admin")
    res.json(filteredUsers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create user
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" })
    }

    // Check for existing user
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isVerified: false,
    })

    await user.save()

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject()
    res.status(201).json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user
router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const updates = { name, email, role }

    // If password is provided, hash it
    if (password) {
      updates.password = await bcrypt.hash(password, 10)
    }

    // Check for existing user with same email
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      })
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" })
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, select: "-password" })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Toggle user verification
router.put("/users/:id/verify", async (req, res) => {
  try {
    const { isVerified } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified }, { new: true, select: "-password" })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})



module.exports = router; // ✅ Export using CommonJS

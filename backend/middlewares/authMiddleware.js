const jwt = require("jsonwebtoken");

const protectRoute = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token using secret key
    req.user = { 
      userId: decoded.userId, // User ID
      email: decoded.email    // User Email
    }; 
    next(); // Continue to the next middleware or route
  } catch (err) {
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};

module.exports = protectRoute;

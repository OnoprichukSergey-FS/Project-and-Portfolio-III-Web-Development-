const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to check if user has a valid JWT in their cookies
function verifyToken(req, res, next) {
  const token = req.cookies.jwt;

  // No token? Block access.
  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }

  try {
    // Try to verify the JWT using the secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to the request object
    req.user = decoded;

    // Continue to the next middleware or route
    next();
  } catch (err) {
    // If token is invalid or expired
    res.status(403).send("Invalid token");
  }
}

module.exports = verifyToken;

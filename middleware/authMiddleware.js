import jwt from "jsonwebtoken"

export const authMiddleware = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.role = decoded.role

    // Check role access if roles array provided
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" })
  }
}

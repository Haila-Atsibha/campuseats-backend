// routes/user.js
import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import pkg from "../generated/prisma/index.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import dotenv from "dotenv"
import multer from "multer"
import path from "path"

const { PrismaClient } = pkg
const prisma = new PrismaClient()
dotenv.config()

const router = express.Router()

// 🧩 Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  },
})
const upload = multer({ storage })

// ✅ Get current user info
router.get("/me", authMiddleware(), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
        createdAt: true,
      },
    })
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

// ✅ Update user profile (name, email, profile pic)
router.put("/update", authMiddleware(), upload.single("image"), async (req, res) => {
  try {
    const userId = req.userId
    const { name, email } = req.body
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined

    // Validate input
    if (!name || !email)
      return res.status(400).json({ error: "Name and email are required" })

    // Check for email conflict
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== userId)
      return res.status(400).json({ error: "Email already in use" })

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        ...(imageUrl && { imageUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
        updatedAt: true,
      },
    })

    res.json({ message: "Profile updated successfully", user: updatedUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update profile" })
  }
})

// ✅ Change password route
router.post("/change-password", authMiddleware(), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Both old and new passwords are required" })
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ error: "User not found" })

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    })

    res.json({ message: "Password updated successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update password" })
  }
})

export default router

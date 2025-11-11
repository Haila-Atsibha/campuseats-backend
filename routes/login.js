import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import pkg from "../generated/prisma/index.js"
const { PrismaClient } = pkg

const prisma = new PrismaClient()
const router = express.Router()

router.post("/", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) return res.status(400).json({ error: "Email and password required" })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(400).json({ error: "Invalid credentials" })

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" })

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  })
})

export default router

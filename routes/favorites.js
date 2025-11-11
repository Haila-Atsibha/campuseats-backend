import express from "express"
import { PrismaClient } from "../generated/prisma/index.js"
import { authMiddleware } from "../middleware/authmiddleware.js"

const router = express.Router()
const prisma = new PrismaClient()

// ✅ Add or remove favorite
router.post("/:cafeId", authMiddleware(), async (req, res) => {
  const userId = req.userId
  const cafeId = parseInt(req.params.cafeId)

  try {
    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: { userId_cafeId: { userId, cafeId } },
    })

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { userId_cafeId: { userId, cafeId } },
      })
      return res.json({ message: "Removed from favorites" })
    } else {
      // Add new favorite
      await prisma.favorite.create({
        data: {
          userId,
          cafeId,
        },
      })
      return res.json({ message: "Added to favorites" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update favorites" })
  }
})

// ✅ Get user's favorite cafés
router.get("/", authMiddleware(), async (req, res) => {
  const userId = req.userId

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        cafe: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            ratingsReceived: {
              select: { value: true },
            },
          },
        },
      },
    })

    // Calculate average ratings for favorites
    const formatted = favorites.map((fav) => {
      const ratings = fav.cafe.ratingsReceived
      const avg =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
          : 0

      return {
        id: fav.cafe.id,
        name: fav.cafe.name,
        imageUrl: fav.cafe.imageUrl,
        averageRating: avg,
      }
    })

    res.json(formatted)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch favorites" })
  }
})

export default router

import express from "express";
import pkg from "../generated/prisma/index.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const router = express.Router();

/**
 * ⭐ POST /api/ratings
 * Customer rates a cafe (1–5 stars)
 */
router.post("/", authMiddleware(), async (req, res) => {
  try {
    const { cafeId, value, comment } = req.body;
    const userId = req.userId; // logged-in customer

    // Validation
    if (!cafeId || !value || value < 1 || value > 5) {
      return res.status(400).json({ error: "Invalid rating value (must be 1–5)" });
    }

    // Prevent duplicate rating per user per cafe
    const existing = await prisma.rating.findFirst({
      where: { cafeId: parseInt(cafeId), userId },
    });

    if (existing) {
      // Update existing rating
      const updated = await prisma.rating.update({
        where: { id: existing.id },
        data: { value, comment },
      });
      return res.json(updated);
    }

    // Create new rating
    const rating = await prisma.rating.create({
      data: {
        value,
        comment,
        cafeId: parseInt(cafeId),
        userId,
      },
    });

    res.json(rating);
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

/**
 * ✅ GET /api/ratings/:cafeId
 * Get all ratings for a specific cafe
 */
router.get("/:cafeId", async (req, res) => {
  try {
    const { cafeId } = req.params;

    const ratings = await prisma.rating.findMany({
      where: { cafeId: parseInt(cafeId) },
      include: {
        user: { select: { id: true, name: true } }, // user who submitted the rating
      },
    });

    res.json(ratings);
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

export default router;

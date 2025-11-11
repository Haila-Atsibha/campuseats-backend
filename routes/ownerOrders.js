import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import pkg from "../generated/prisma/index.js"
const { PrismaClient } = pkg

const prisma = new PrismaClient()
const router = express.Router()

// ✅ Get all orders for the logged-in café owner
router.get("/my-cafe-orders",  authMiddleware(), async (req, res) => {
  const ownerId = req.userId

  try {
    // Ensure user is a café owner
    if (req.role !== "CAFE_OWNER") {
      return res.status(403).json({ error: "Only café owners can view this" })
    }

    // Fetch all orders where the foods belong to this owner
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            food: {
              ownerId: ownerId
            }
          }
        }
      },
      include: {
        student: true,
        items: {
          include: {
            food: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(orders)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch orders" })
  }
})

export default router

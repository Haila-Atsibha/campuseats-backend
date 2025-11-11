import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import pkg from "../generated/prisma/index.js"
const { PrismaClient } = pkg

const prisma = new PrismaClient()
const router = express.Router()

// ✅ Place an order (students only)
router.post("/create",  authMiddleware(), async (req, res) => {
  const { items } = req.body // items = [{ foodId: 1, quantity: 2 }, ...]
  const studentId = req.userId

  try {
    // Ensure user is a CUSTOMER
    if (req.role !== "CUSTOMER") {
      return res.status(403).json({ error: "Only students can place orders" })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" })
    }

    // Fetch foods and calculate total
    const foodIds = items.map(item => item.foodId)
    const foods = await prisma.food.findMany({ where: { id: { in: foodIds } } })

    if (foods.length !== items.length) {
      return res.status(400).json({ error: "Some foods not found" })
    }

    let total = 0
    const orderItemsData = items.map(item => {
      const food = foods.find(f => f.id === item.foodId)
      const price = food.price * item.quantity
      total += price
      return {
        foodId: food.id,
        quantity: item.quantity,
        price: price
      }
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        total,
        studentId,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: {
          include: { food: true }
        }
      }
    })

    res.status(201).json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to place order" })
  }
})
// POST /api/orders/checkout
router.post("/checkout", authMiddleware(), async (req, res) => {
  const studentId = req.userId;

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { studentId },
      include: { food: true },
    });

    if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

    const total = cartItems.reduce((sum, item) => sum + item.food.price * item.quantity, 0);

    // Create order
    const order = await prisma.order.create({
      data: {
        studentId,
        total,
        status: "PENDING",
        items: {
          create: cartItems.map(item => ({
            foodId: item.foodId,
            quantity: item.quantity,
            price: item.food.price,
          })),
        },
      },
      include: { items: { include: { food: true } } },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { studentId } });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Checkout failed" });
  }
});
// GET /api/orders
router.get("/",  authMiddleware(), async (req, res) => {
  const studentId = req.userId;

  try {
    const orders = await prisma.order.findMany({
      where: { studentId },
      include: { items: { include: { food: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});



export default router

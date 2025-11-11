import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import pkg from "../generated/prisma/index.js";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Add item to cart
router.post("/add", authMiddleware(["CUSTOMER"]), async (req, res) => {
  const { foodId, quantity } = req.body;
  const studentId = req.userId;

  if (!foodId || !quantity) return res.status(400).json({ error: "Missing fields" });

  try {
    // Check if item already in cart
    const existing = await prisma.cartItem.findFirst({ where: { studentId, foodId } });
    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      return res.json(updated);
    }

    const cartItem = await prisma.cartItem.create({
      data: { studentId, foodId, quantity },
    });
    res.status(201).json(cartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// ✅ Remove item from cart
router.delete("/remove/:id", authMiddleware(["CUSTOMER"]), async (req, res) => {
  const { id } = req.params;
  const studentId = req.userId;

  try {
    const item = await prisma.cartItem.findUnique({ where: { id: parseInt(id) } });
    if (!item || item.studentId !== studentId) return res.status(403).json({ error: "Not authorized" });

    await prisma.cartItem.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Item removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// ✅ Get cart items
router.get("/", authMiddleware(["CUSTOMER"]), async (req, res) => {
  const studentId = req.userId;
  try {
    const items = await prisma.cartItem.findMany({
      where: { studentId },
      include: { food: true },
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});
router.post("/add", authMiddleware(["CUSTOMER"]), async (req, res) => {
  console.log("POST /cart/add hit");
  console.log("Body:", req.body);
  console.log("User ID:", req.userId);
});



export default router;

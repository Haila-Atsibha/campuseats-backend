// PATCH /api/order-status/ready/:orderId
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import pkg from "../generated/prisma/index.js";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const router = express.Router();

router.patch("/ready/:orderId", authMiddleware(["CAFE_OWNER"]), async (req, res) => {
  const { orderId } = req.params;
  const ownerId = req.userId;

  try {
    // Ensure this owner owns at least one item in this order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { items: { include: { food: true } } },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const ownsFood = order.items.some(item => item.food.ownerId === ownerId);
    if (!ownsFood) return res.status(403).json({ error: "Not authorized" });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: "READY" },
    });

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});
// PATCH /api/order-status/undo/:id
router.patch("/undo/:id", authMiddleware(), async (req, res) => {
  const orderId = parseInt(req.params.id);

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PREPARING" }, // or "PENDING" depending on your logic
    });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to undo ready" });
  }
});


export default router;

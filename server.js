import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path";



import signupRoute from "./routes/signup.js"
import loginRoute from "./routes/login.js"
import foodRoute from "./routes/food.js"
import cartRoutes from './routes/cart.js';
import orderRoute from "./routes/order.js"
import ownerOrdersRoute from "./routes/ownerOrders.js"
import orderStatusRoute from "./routes/orderStatus.js"
import cafesRoutes from "./routes/cafe.js";
import userRoutes from "./routes/user.js"
import ratingRoutes from "./routes/ratings.js";
import favoriteRoutes from "./routes/favorites.js"





dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/signup", signupRoute)
app.use("/api/login", loginRoute)
app.use("/api/food", foodRoute)
app.use('/api/cart', cartRoutes);
app.use("/api/order", orderRoute)
app.use("/api/owner-orders", ownerOrdersRoute)
app.use("/api/order-status", orderStatusRoute)
app.use("/api/cafe", cafesRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/favorites", favoriteRoutes)






app.get("/", (req, res) => res.send("Backend running 🚀"))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

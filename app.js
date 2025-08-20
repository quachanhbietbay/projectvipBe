import express from 'express'
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import productRoutes from './routes/productRoutes.js'
import couponRoutes from './routes/couponRoutes.js'
import dotenv from 'dotenv'
import cors from 'cors'
import mongoose from 'mongoose';
import User from './models/User.js'
dotenv.config()

const app = express()

app.use(express.json())
const PORT = process.env.PORT || 8000;
app.use(cors({
    origin: ['http://localhost:5173',
        'https://projectvip.onrender.com'
    ],
    credentials: true
}))

try {
    await mongoose.connect(process.env.MONGO_URI);
  
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error);
  
  }

app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupons", couponRoutes);



app.listen(PORT, async ()=>{
    console.log('sever is running')
    try {
      // Seed admin account if not exists
      const adminEmail = 'admin@gmail.com';
      const exists = await User.findOne({ email: adminEmail });
      if (!exists) {
        const bcrypt = (await import('bcrypt')).default;
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash('admin', salt);
        await User.create({ name: 'Admin', email: adminEmail, password: hashed, role: 'admin' });
        console.log('Seeded default admin: admin@gmail.com / admin');
      }
    } catch (e) {
      console.error('Admin seeding failed:', e?.message || e);
    }
})
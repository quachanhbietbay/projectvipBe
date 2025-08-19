import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    const existing = await User.findOne({ email });
    if (existing)
       return res.status(400).json({ message: "Email đã được sử dụng" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, discount: user.discount, discountCodesRemaining: user.discountCodesRemaining, discountCodes: user.discountCodes },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Vui lòng điền email và mật khẩu" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, discount: user.discount, discountCodesRemaining: user.discountCodesRemaining, discountCodes: user.discountCodes },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET current user (protected)
router.get("/me", protect, async (req, res) => {
  // protect middleware đã gắn req.user
  const u = req.user;
  res.json({ user: { id: u._id, name: u.name, email: u.email, role: u.role, discount: u.discount, discountCodesRemaining: u.discountCodesRemaining, discountCodes: u.discountCodes } });
});

export default router;

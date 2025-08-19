import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Admin: list all users (basic fields)
router.get("/", protect, adminOnly, async (_req, res) => {
  try {
    const users = await User.find({}, "name email role discount discountCodesRemaining discountCodes").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Admin update user's discount settings (percent, codes remaining, or list of codes)
router.patch("/:id/discount", protect, adminOnly, async (req, res) => {
  try {
    const { discount, discountCodesRemaining, discountCodes } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    
    if (typeof discount === "number") user.discount = discount;
    if (typeof discountCodesRemaining === "number") user.discountCodesRemaining = discountCodesRemaining;
    if (Array.isArray(discountCodes)) user.discountCodes = discountCodes;
    await user.save();
    res.json({ message: "Cập nhật ưu đãi thành công", user });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
 
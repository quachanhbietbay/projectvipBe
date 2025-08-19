import express from "express";
import Product from "../models/Product.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: list products
router.get("/", async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// Admin: create product
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, price, image, description, category } = req.body;
    if (!name || !price || !image) return res.status(400).json({ message: "Thiếu dữ liệu" });
    const p = await Product.create({ name, price, image, description, category });
    res.status(201).json(p);
  } catch (e) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Admin: delete product
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa" });
  } catch (e) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;



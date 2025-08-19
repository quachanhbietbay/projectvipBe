import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const router = express.Router();

// Admin: create or update a coupon
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { code, percent, appliesTo = "all", eligibleProductIds = [], startDate, endDate, maxUses = 0, isActive = true } = req.body;
    if (!code || !percent) return res.status(400).json({ message: "Thiếu code hoặc phần trăm" });

    let eligibleIds = [];
    if (appliesTo === "includeList") {
      const rawList = Array.isArray(eligibleProductIds)
        ? eligibleProductIds
        : String(eligibleProductIds || "").split(/[\s,]+/).filter(Boolean);

      const objectIdCandidates = [];
      const nameCandidates = [];
      for (const token of rawList) {
        if (mongoose.Types.ObjectId.isValid(String(token))) {
          objectIdCandidates.push(String(token));
        } else {
          nameCandidates.push(String(token));
        }
      }

      if (nameCandidates.length > 0) {
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patterns = nameCandidates.map((n) => new RegExp(`^${escapeRegex(n)}$`, "i"));
        const foundByName = await Product.find({ name: { $in: patterns } }, { _id: 1 });
        const mapped = foundByName.map((p) => p._id.toString());
        eligibleIds = [...new Set([...objectIdCandidates, ...mapped])];
        if (eligibleIds.length === 0) {
          return res.status(400).json({ message: "Không tìm thấy sản phẩm hợp lệ từ danh sách" });
        }
      } else {
        eligibleIds = objectIdCandidates;
      }

      if (eligibleIds.length === 0) {
        return res.status(400).json({ message: "Danh sách sản phẩm áp dụng không hợp lệ" });
      }
    }

    const upsert = await Coupon.findOneAndUpdate(
      { code: code.toUpperCase() },
      {
        code: code.toUpperCase(),
        percent,
        appliesTo,
        eligibleProductIds: appliesTo === "includeList" ? eligibleIds : [],
        startDate,
        endDate,
        maxUses,
        isActive,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json(upsert);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err?.message || "Lỗi server" });
  }
});

// Admin: list coupons
router.get("/", protect, adminOnly, async (_req, res) => {
  try {
    const list = await Coupon.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Validate a coupon code for a given cart (public, but we only read data)
router.post("/validate", async (req, res) => {
  try {
    const { code, cartItems = [] } = req.body;
    if (!code) return res.status(400).json({ message: "Thiếu mã giảm giá" });
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isCurrentlyValid()) {
      return res.status(400).json({ message: "Mã không hợp lệ hoặc đã hết hạn" });
    }

    // Compute eligible subtotal
    const eligibleSet = new Set((coupon.eligibleProductIds || []).map((id) => id.toString()));
    const eligibleSubtotal = cartItems.reduce((sum, item) => {
      const productId = (item._id || item.product || "").toString();
      const isEligible = coupon.appliesTo === "all" || eligibleSet.has(productId);
      if (!isEligible) return sum;
      const line = (item.price || 0) * (item.quantity || item.quantify || 1);
      return sum + line;
    }, 0);

    if (eligibleSubtotal <= 0) {
      return res.status(400).json({ message: "Giỏ hàng không có sản phẩm áp dụng mã" });
    }

    const discountAmount = Math.floor((eligibleSubtotal * coupon.percent) / 100);
    res.json({
      code: coupon.code,
      percent: coupon.percent,
      appliesTo: coupon.appliesTo,
      eligibleProductIds: coupon.eligibleProductIds,
      discountAmount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;



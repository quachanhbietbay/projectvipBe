import express from "express";
import Order from "../models/orderModel.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tạo đơn hàng (user)
router.post("/", protect, async (req, res) => {
  try {
    const { cartItems, address, paymentMethod, totalPrice, useDiscount, selectedDiscountPercent, couponCode } = req.body;
    if (!cartItems || !cartItems.length) return res.status(400).json({ message: "Giỏ hàng trống" });
    if (!address) return res.status(400).json({ message: "Vui lòng cung cấp địa chỉ" });

    // New coupon application logic (item-scoped by product IDs)
    let finalPrice = totalPrice;
    let discountAmount = 0;
    let appliedCouponPercent = 0;
    let appliedCouponCode = undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
      if (!coupon || !coupon.isCurrentlyValid()) {
        return res.status(400).json({ message: "Mã giảm giá không hợp lệ" });
      }
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
      discountAmount = Math.floor((eligibleSubtotal * coupon.percent) / 100);
      appliedCouponPercent = coupon.percent;
      appliedCouponCode = coupon.code;
      finalPrice = Math.max(0, totalPrice - discountAmount);
    }

    const order = new Order({
      user: req.user._id,
      orderItems: cartItems.map((i) => ({
        name: i.name,
        quantity: i.quantity || i.quantify || 1,
        price: i.price,
        image: i.image,
        product: i._id || i.product
      })),
      shippingAddress:address,
      paymentMethod,
      totalPrice: finalPrice,
      couponCode: appliedCouponCode,
      couponPercent: appliedCouponPercent,
      discountAmount,
      appliedDiscountPercent: 0
    });

    const created = await order.save();
    // If coupon used, increment its usedCount
    if (appliedCouponCode) {
      await Coupon.updateOne({ code: appliedCouponCode }, { $inc: { usedCount: 1 } });
    }
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi tạo đơn hàng" });
  }
});

// Lấy đơn hàng của user hiện tại
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi" });
  }
});

// Lấy 1 đơn hàng (user hoặc admin)
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // nếu user không phải admin và không phải chủ đơn hàng → chặn
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Lỗi" });
  }
});

// Admin: lấy tất cả đơn hàng
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Lỗi" });
  }
});

export default router;

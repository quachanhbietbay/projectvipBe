import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export const protect = async (req, res, next) => {
  let token = null;
  // token từ header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Không có token, truy cập bị từ chối" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Người dùng không tồn tại" });
    // Backfill defaults for legacy users
    let updated = false;
    if (user.discount === undefined) { user.discount = 0; updated = true; }
    if (user.discountCodesRemaining === undefined) { user.discountCodesRemaining = 5; updated = true; }
    if (!Array.isArray(user.discountCodes) || user.discountCodes.length === 0) { user.discountCodes = [10,20,30,40,50]; updated = true; }
    if (updated) {
      await user.save();
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Không xác thực" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Yêu cầu quyền admin" });
  next();
};

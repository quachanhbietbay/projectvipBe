import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Percent discount applied when the user has available codes
    discount: { type: Number, default: 0 },
    // Number of discount codes the user can still use
    discountCodesRemaining: { type: Number, default: 5 },
    // List of discount code percentages the user currently owns
    discountCodes: {
      type: [Number],
      default: function () {
        return [10, 20, 30, 40, 50];
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;

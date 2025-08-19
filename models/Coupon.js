import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String,
       required: true,
        unique: true, 
        uppercase: true, 
        trim: true },
    
    percent: { type: Number, 
      required: true,
       min: 1, 
       max: 100
       },
   
    appliesTo: { type: String, 
      enum: ["all", "includeList"], 
      default: "all" },
  
    eligibleProductIds:
     [{ type: mongoose.Schema.Types.ObjectId, 
      ref: "Product" }],
    
    startDate:
     { type: Date,
       default: () => new Date() },
    endDate: {
      
      type: Date 
    },
    
    maxUses:
     { 
      type: Number, 
      
      default: 0
     },
    usedCount:
     { type: 
      Number, 
      default: 0 },
    isActive:
     { type: Boolean, 
      default: true }
  },
  { timestamps: true }
);

couponSchema.methods.isCurrentlyValid = function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return false;
  return true;
};

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;



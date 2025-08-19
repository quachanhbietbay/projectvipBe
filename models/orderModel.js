import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    orderItems: [
        {
            name: {
                type: String, 
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            image: { type: String }
        }
    ],
    shippingAddress: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    // Coupon details if applied
    couponCode: { type: String },
    couponPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    appliedDiscountPercent: { type: Number, default: 0 },
    status: {
        type: String,
        default: "Chờ xử lý"
    },
    
},
{
   timestamps: true 
}
);
const Order = mongoose.model('Order',orderSchema)
export default Order;



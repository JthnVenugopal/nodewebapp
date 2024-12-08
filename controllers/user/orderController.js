const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');

//-----------------------------------------------------


const getOrderDetails = async (req, res) => {
    try {
        // Identify user from Google or session
        const user = req.user || req.session.user;
        const userId = user?._id;

        if (!userId) {
            throw new Error("User is not logged in.");
        }

        // Fetch user data
        const userData = await User.findOne({ _id: userId }).select("name email orderHistory").lean();

        if (!userData) {
            throw new Error("User not found.");
        }

        const { name, email, orderHistory } = userData;

        // Fetch orders based on orderHistory IDs
        const orders = await Order.find({ _id: { $in: orderHistory } }).lean();

        // Fetch product details for each order
        const detailedOrders = await Promise.all(
            orders.map(async (order) => {
                const detailedItems = await Promise.all(
                    order.orderedItems.map(async (item) => {
                        const product = await Product.findOne({ _id: item.product }).lean();
                        return {
                            ...item,
                            productDetails: product || {},
                        };
                    })
                );

                return {
                    ...order,
                    orderedItems: detailedItems,
                };
            })
        );

        // Render data to the frontend
        res.render("orderDetails", {
            name,
            email,
            orderDetails: detailedOrders,
            user, 
        });
    } catch (error) {
        console.error("Error fetching order details:", error.message);
        res.status(500).render("pageNotFound", {
            message: error.message || "Failed to fetch order details.",
        });
    }
};


//------------------------------------------------------------------------


const cancelOrder = async (req, res) => {
    const { orderId } = req.body;  // Corrected to use body instead of query parameters
    console.log("Order ID received for cancellation:", orderId);

    try {
        // Validate ID
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        // Fetch the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check order status
        if (order.status !== 'Pending') {
            return res.status(403).json({ message: 'Cannot cancel this order as it is not pending' });
        }

        // Allow cancellation for COD orders only
        if (order.paymentMethod !== 'COD') {
            return res.status(403).json({ message: 'Only COD orders can be cancelled' });
        }

        // Update order status to 'Cancelled'
        order.status = 'Cancelled';
        await order.save();

        return res.json({ message: 'COD order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ message: 'Failed to cancel order' });
    }
};


module.exports = {
  getOrderDetails,
  cancelOrder,
}
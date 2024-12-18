const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');
const Variant = require("../../models/variantSchema")

//-----------------------------------------------------------------------------------

const getOrderDetails = async (req, res) => {
    try {

        console.log("-----------------------------------getOrderDetails --------------------------------------");

        // Identify user from Google or session
        const user = req.user || req.session.user.id;
        const userId = user;

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

        // Fetch product and variant details for each order
        const detailedOrders = await Promise.all(
            orders.map(async (order) => {
                const detailedItems = await Promise.all(
                    order.orderedItems.map(async (item) => {
                        const product = await Product.findById(item.product).lean();
                        const variant = await Variant.findById(product.variant).lean();
                        return {
                            ...item,
                            productDetails: product || {},
                            variantDetails: variant || {}, // Include variant details
                        };
                    })
                );

                return {
                    ...order,
                    orderedItems: detailedItems,
                    deliveryAddress: order.address // Include delivery address
                };
            })
        );



        console.log("Order detail:", JSON.stringify(detailedOrders));

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
    try {

        console.log("-----------------------------------cancelOrder--------------------------------------");
        
        const { orderId } = req.body;
        console.log("Order ID received for cancellation:", orderId);

        const orderDetails = await Order.findById(orderId);

        console.log("orderDetails----------------------"+orderDetails);
        

        // Update order status to 'Cancelled'
        orderDetails.status = 'Cancelled';
        await orderDetails.save();
        console.log("Order cancelled successfully:", orderId);

        return res.json({ message: 'COD order cancelled successfully' });

    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
    }
};






module.exports = {
  getOrderDetails,
  cancelOrder,
}
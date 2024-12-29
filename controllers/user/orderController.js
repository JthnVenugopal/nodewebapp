const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');
const Variant = require("../../models/variantSchema");
const Wallet = require("../../models/walletSchema");

//////////////////////////////////////////////////////////////////////////


const getOrderDetails = async (req, res) => {
  try {
    console.log("////////////getOrderDetails////////////////");

    // Identify user from Google or session
    const user = req.user || req.session.user;
    const userId = user?.id;

    if (!userId) {
      throw new Error("User  is not logged in.");
    }

    // Fetch orders directly using userId
    const orders = await Order.find({ user: userId }).lean();

    // console.log("Orders:", JSON.stringify(orders));

    // If no orders found, render with a message
    if (!orders || orders.length === 0) {
      return res.render("orderDetails", {
        name: user.name,
        email: user.email,
        orderDetails: [],
        user,
        message: "No orders found."
      });
    }

    // Fetch product and variant details for each order
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        // console.log("Processing order:", order);

        const detailedItems = await Promise.all(
          order.orderedItems.map(async (item) => {
            // console.log("Processing item:", item);

            const product = await Product.findById(item.product).lean();
            // console.log('Fetched product for item:', item, 'Product:', product);

            if (!product) {
              console.error('Product not found for item:', item);
              return null;
            }

            const variant = await Variant.findById(product.variant).lean();
            // console.log('Fetched variant for product:', product, 'Variant:', variant);

            if (!variant) {
              console.error('Variant not found for product:', product);
              return null;
            }

            return {
              ...item,
              productDetails: product,
              variantDetails: variant, // Include variant details
            };
          })
        );

        return {
          ...order,
          orderedItems: detailedItems.filter(item => item !== null),
          deliveryAddress: order.address, // Include delivery address
          paymentMethod: order.paymentMethod // Log payment method for debugging
        };
      })
    );

    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedEstimatedDeliveryDate = estimatedDeliveryDate.toLocaleDateString('en-US', options);

    // Log the detailed orders for debugging
    // console.log("Order details:", JSON.stringify(detailedOrders));

    // Render data to the frontend
    res.render("orderDetails", {
      name: user.name,
      email: user.email,
      orderDetails: detailedOrders,
      user,
      estimatedDeliveryDate: formattedEstimatedDeliveryDate
    });
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    res.status(500).render("pageNotFound", {
      message: error.message || "Failed to fetch order details.",
    });
  }
};



//////////////////////////////////////////////////////////////////////////

// const cancelOrder = async (req, res) => {
//     try {

//         console.log("-----------------------------------cancelOrder--------------------------------------");
        
//         const { orderId } = req.body;

//         // console.log("Order ID received for cancellation:", orderId);

//         const orderDetails = await Order.findById(orderId);

//         // console.log("orderDetails----------------------"+orderDetails);
        

//         // Update order status to 'Cancelled'
//         orderDetails.status = 'Cancelled';
        
//         await orderDetails.save();
//         console.log("Order cancelled successfully:", orderId);

//         return res.json({ message: 'COD order cancelled successfully' });

//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
//     }
// };


const cancelOrder = async (req, res) => {
    try {
        console.log("-----------------------------------cancelOrder--------------------------------------");
        
        const { orderId } = req.body;

        console.log("Order ID received for cancellation:", orderId);
        

        const userId = req.session.user.id || req.session.user._id;

        const orderDetails = await Order.findById(orderId);

        console.log("ordrDetails----------------------"+orderDetails);

        // Check if the order exists
        if (!orderDetails) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order is already cancelled
        if (orderDetails.status === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        // Process refund
        const wallet = await Wallet.findOne({ userId: req.session.user.id }).exec();

        console.log("wallet data----------------------"+wallet);
        

        // Check if the wallet exists
        if (!wallet || wallet === undefined) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        if (orderDetails.paymentMethod === 'razorpay') {
            // Calculate the refund amount for Razorpay
            const razorpayRefundAmount = orderDetails.totalPrice - orderDetails.walletPayment;

            // Update wallet balance for Razorpay refund
            wallet.balance += razorpayRefundAmount;

            // Add transaction to wallet for Razorpay refund
            wallet.transactions.push({
                type: 'credit',
                amount: razorpayRefundAmount,
                description: 'Refund for cancelled order (Razorpay)',
                transactionId: orderId
            });

            console.log("Refund processed successfully to wallet (Razorpay):", razorpayRefundAmount);
        }

        if (orderDetails.paymentMethod === 'wallet' || orderDetails.walletPayment > 0) {
            // Calculate the refund amount for wallet payment
            const walletRefundAmount = orderDetails.walletPayment;

            // Update wallet balance for wallet refund
            wallet.balance += walletRefundAmount;

            // Add transaction to wallet for wallet refund
            wallet.transactions.push({
                type: 'credit',
                amount: walletRefundAmount,
                description: 'Refund for cancelled order (Wallet)',
                transactionId: orderId
            });

            console.log("Refund processed successfully to wallet (Wallet):", walletRefundAmount);
        }

        await wallet.save();

        // Update order status to 'Cancelled'
        orderDetails.status = 'Cancelled';
        await orderDetails.save();

        console.log("Order cancelled successfully:", orderId);

        return res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
    }
};



//////////////////////////////////////////////////////////////////////////


module.exports = {
  getOrderDetails,
  cancelOrder,
}
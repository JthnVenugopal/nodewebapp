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
//         console.log("//////////////////cancelOrder//////////////////////");
        
//         const { orderId } = req.body;

//         console.log("Order ID received for cancellation:", orderId);
        

//         const userId = req.session.user.id || req.session.user._id;

//         const orderDetails = await Order.findById(orderId);

//         // console.log("ordrDetails----------------------"+orderDetails);

//         // Check if the order exists
//         if (!orderDetails) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         // Check if the order is already cancelled
//         if (orderDetails.status === 'Cancelled') {
//             return res.status(400).json({ message: 'Order is already cancelled' });
//         }

//         // Process refund
//         const wallet = await Wallet.findOne({ userId: req.session.user.id }).exec();

//         // console.log("wallet data----------------------"+wallet);
        

//         // Check if the wallet exists
//         if (!wallet || wallet === undefined) {
//             return res.status(404).json({ message: 'Wallet not found' });
//         }

//         if (orderDetails.paymentMethod === 'razorpay') {
//             // Calculate the refund amount for Razorpay
//             const razorpayRefundAmount = orderDetails.totalPrice;

//             // Update wallet balance for Razorpay refund
//             wallet.balance += razorpayRefundAmount;

//             // Add transaction to wallet for Razorpay refund
//             wallet.transactions.push({
//                 type: 'credit',
//                 amount: razorpayRefundAmount,
//                 description: 'Refund for cancelled order (Razorpay)',
//                 transactionId: orderId
//             });

//             // console.log("Refund processed successfully to wallet (Razorpay):", razorpayRefundAmount);
//         }

//         if (orderDetails.paymentMethod === 'wallet') {
//             // Calculate the refund amount for wallet payment
//             const walletRefundAmount = orderDetails.totalPrice;

//             // Update wallet balance for wallet refund
//             wallet.balance += walletRefundAmount;

//             // Add transaction to wallet for wallet refund
//             wallet.transactions.push({
//                 type: 'credit',
//                 amount: walletRefundAmount,
//                 description: 'Refund for cancelled order (Wallet)',
//                 transactionId: orderId
//             });

//             console.log("Refund processed successfully to wallet (Wallet):", walletRefundAmount);
//         }

//         await wallet.save();

//         // Update order status to 'Cancelled'
//         orderDetails.status = 'Cancelled';
//         await orderDetails.save();

//         const {orderedItems} = orderDetails;
//         console.log("items /////////"+orderedItems);

      
//   // Fetch product and variant data for each ordered item using forEach
//   const productsData = [];
//   await Promise.all(orderedItems.map(async (item) => {
//     const productData = await Product.findById(item.product).populate('variant');
//     console.log("Product Data with Variant:", productData);
//     productsData.push(productData);
//   }));

//   console.log("All Product Data////////////////:", productsData);

//       // Add the ordered quantity back to the variant inventory
//       await Promise.all(orderedItems.map(async (item) => {
//         const productData = await Product.findById(item.product).populate('variant');
//         if (productData && productData.variant) {
//           productData.variant.quantity += item.quantity;
//           await productData.save();
//           console.log(`Updated Variant Quantity for ${productData.productName}:`, productData.variant.quantity);
//         }
//       }));

       
//     console.log("Order cancelled successfully:", orderId);

//         return res.json({ message: 'Order cancelled successfully' });
//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
//     }
// };

const cancelOrder = async (req, res) => {
  try {
    console.log("//////////////////cancelOrder//////////////////////");

    const { orderId } = req.body;
    console.log("Order ID received for cancellation:", orderId);

    const userId = req.session.user.id || req.session.user._id;
    const orderDetails = await Order.findById(orderId)
      .populate('orderedItems.product'); // Populate product details if needed

    console.log("orderDetails----------------------", orderDetails);

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
    console.log("wallet data----------------------", wallet);

    // Check if the wallet exists
    if (!wallet || wallet === undefined) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Refund logic based on payment method
    const refundAmount = orderDetails.totalPrice;
    if (orderDetails.paymentMethod === 'razorpay' || orderDetails.paymentMethod === 'wallet') {
      wallet.balance += refundAmount;
      wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        description: `Refund for cancelled order (${orderDetails.paymentMethod})`,
        transactionId: orderId
      });
      console.log(`Refund processed successfully to wallet (${orderDetails.paymentMethod}):`, refundAmount);
    }

    await wallet.save();

    // Update order status to 'Cancelled'
    orderDetails.status = 'Cancelled';
    await orderDetails.save();

    const { orderedItems } = orderDetails;
    console.log("Ordered Items:", orderedItems);

    // Fetch product and variant data for each ordered item using forEach
    await Promise.all(orderedItems.map(async (item) => {
      const productId = item.product;
      const productData = await Product.findById(productId).populate('variant');

      if (productData && productData.variant) {
        const variantId = productData.variant._id;
        const variantData = await Variant.findById(variantId);
        if (variantData) {
          console.log(`Current Variant Quantity for ${productData.productName}:`, variantData.quantity);
          variantData.quantity += item.quantity;
          console.log(`Updated Variant Quantity for ${productData.productName}:`, variantData.quantity);

          // Save the updated variant data
          await variantData.save();
          console.log(`Variant Data saved for ${productData.productName}`);
        } else {
          console.error(`Variant not found for product ${productId}`);
        }
      } else {
        console.error(`Product or Variant not found for product ${productId}`);
      }
    }));

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
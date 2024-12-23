const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');
const Variant = require("../../models/variantSchema")

//-----------------------------------------------------------------------------------

// const getOrderDetails = async (req, res) => {
//     try {

//         console.log("-----------------------------------getOrderDetails --------------------------------------");

//         // Identify user from Google or session
//         const user = req.user || req.session.user;
//         const userId = user.id;

//         if (!userId) {
//             throw new Error("User is not logged in.");
//         }

//         // Fetch user data
//         const userData = await User.findOne({ _id: userId }).select("name email orderHistory").lean();

//         console.log("userData/////////////"+JSON.stringify(userData));
        

//         if (!userData) {
//             throw new Error("User not found.");
//         }

//         const { name, email, orderHistory } = userData;

//         console.log("orderHistory/////////////"+JSON.stringify(orderHistory));

//         // Fetch orders based on orderHistory IDs
//         const orders = await Order.find({ _id: { $in: orderHistory } }).lean();

//         console.log("Orders///////////////"+orders);
        

//         // Fetch product and variant details for each order
//         const detailedOrders = await Promise.all(
//             orders.map(async (order) => {
//                 const detailedItems = await Promise.all(
//                     order.orderedItems.map(async (item) => {
//                         const product = await Product.findById(item.product).lean();
//                         const variant = await Variant.findById(product.variant).lean();
//                         return {
//                             ...item,
//                             productDetails: product || {},
//                             variantDetails: variant || {}, // Include variant details
//                         };
//                     })
//                 );

//                 return {
//                     ...order,
//                     orderedItems: detailedItems,
//                     deliveryAddress: order.address // Include delivery address
//                 };
//             })
//         );



//         // console.log("Order detail:", JSON.stringify(detailedOrders));

//         // Render data to the frontend
//         res.render("orderDetails", {
//             name,
//             email,
//             orderDetails: detailedOrders,
//             user,
//         });
//     } catch (error) {
//         console.error("Error fetching order details:", error.message);
//         res.status(500).render("pageNotFound", {
//             message: error.message || "Failed to fetch order details.",
//         });
//     }
// };

const getOrderDetails = async (req, res) => {
    try {
      console.log("-----------------------------------getOrderDetails --------------------------------------");
  
      // Identify user from Google or session
      const user = req.user || req.session.user;
      const userId = user?.id;
  
      if (!userId) {
        throw new Error("User is not logged in.");
      }
  
      // Fetch user data
      const userData = await User.findOne({ _id: userId }).select("name email orderHistory").lean();
      console.log("userData/////////////" + JSON.stringify(userData));
  
      if (!userData) {
        throw new Error("User not found.");
      }
  
      const { name, email, orderHistory } = userData;
      console.log("orderHistory/////////////" + JSON.stringify(orderHistory));
  
      // Fetch orders based on orderHistory IDs
      const orders = await Order.find({ _id: { $in: orderHistory } }).lean();
      console.log("Orders///////////////" + orders);
  
      // Fetch product and variant details for each order
      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          const detailedItems = await Promise.all(
            order.orderedItems.map(async (item) => {
              const product = await Product.findById(item.product).lean();
              console.log('Fetched product for item:', item, 'Product:', product);
  
              if (!product) {
                console.error('Product not found for item:', item);
                throw new Error(`Product not found for item ${item._id}`);
              }
  
              const variant = await Variant.findById(product.variant).lean();
              console.log('Fetched variant for product:', product, 'Variant:', variant);
  
              if (!variant) {
                console.error('Variant not found for product:', product);
                throw new Error(`Variant not found for product ${product._id}`);
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
            orderedItems: detailedItems,
            deliveryAddress: order.address // Include delivery address
          };
        })
      );
  
      // Log the detailed orders for debugging
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
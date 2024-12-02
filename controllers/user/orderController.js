const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/ProductSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');


// const getOrderDetails = async (req, res) => {
//     try {
//         const googleUser = req.user;
//         const sessionUser = req.session.user;

//         // Ensure user is logged in
//         const userId = sessionUser || googleUser;

//         if (!userId) {
//             throw new Error("User is not logged in.");
//         }

//         // console.log("User: ", userId);

//         // Perform an aggregation to fetch order details
    
//         const orders = await User.aggregate([
//             {
//                 $match: { _id: new mongoose.Types.ObjectId(userId) }, // Match user by ID
//             },
//             {
//                 $lookup: {
//                     from: "orders", // Reference the 'Order' collection
//                     localField: "orderHistory", // Match user's order IDs
//                     foreignField: "_id", // Match with orders' _id
//                     as: "orderDetails", // Output array
//                 },
//             },
//             {
//                 $unwind: "$orderDetails", // Decompose the orderDetails array
//             },
//             {
//                 $lookup: {
//                     from: "products", // Reference the 'Product' collection
//                     localField: "orderDetails.orderedItems.product", // Match order items with products
//                     foreignField: "_id", // Match with products' _id
//                     as: "orderDetails.orderedItems.productDetails", // Output detailed product info
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$_id", // Group by user ID
//                     name: { $first: "$name" },
//                     email: { $first: "$email" },
//                     orders: { $push: "$orderDetails" }, // Collect all orders with product details
//                 },
//             },
//         ]);

      
//         console.log("Orders aggregation result:", JSON.stringify(orders, null, 2));
       

//         // Check if orders exist
//         if (!orders || orders.length === 0) {
//             throw new Error("No orders found for the user.");
//         }

//         console.log("Orders fetched:", orders);

//         const {name,} = orders[0]
   
//         res.render("orderDetails", {
//            name,

//         });
        
        

//     } catch (error) {
//         console.error("Error fetching order details:", error.message);
//         res.status(500).render("pageNotFound", {
//             message: error.message || "Failed to fetch order details.",
//         });
//     }
// };







//--------------------------------------------------



// const getOrderDetails = async (req, res) => {
//     try {
//         const googleUser = req.user;
//         const sessionUser = req.session.user;

//         // Ensure user is logged in
//         const userId = sessionUser || googleUser;

//         if (!userId) {
//             throw new Error("User is not logged in.");
//         }

//         // Perform an aggregation to fetch order details
//         const orders = await User.aggregate([
//             {
//                 $match: { _id: new mongoose.Types.ObjectId(userId) }, // Match user by ID
//             },
//             {
//                 $lookup: {
//                     from: "orders", // Reference the 'Order' collection
//                     localField: "orderHistory", // Match user's order IDs
//                     foreignField: "_id", // Match with orders' _id
//                     as: "orderDetails", // Output array
//                 },
//             },
//             {
//                 $unwind: "$orderDetails", // Decompose the orderDetails array
//             },
//             {
//                 $lookup: {
//                     from: "products", // Reference the 'Product' collection
//                     localField: "orderDetails.orderedItems.product", // Match order items with products
//                     foreignField: "_id", // Match with products' _id
//                     as: "orderDetails.orderedItems.productDetails", // Output detailed product info
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$_id", // Group by user ID
//                     name: { $first: "$name" },
//                     email: { $first: "$email" },
//                     orders: { $push: "$orderDetails" }, // Collect all orders with product details
//                 },
//             },
//         ]);

//         // Check if orders exist
//         if (!orders || orders.length === 0) {
//             throw new Error("No orders found for the user.");
//         }

//         // Destructure the first order data
//         const { name, email, orders: userOrders } = orders[0]; // Destructure name, email, and orders array

//         // Example of further destructuring orders
//         const orderDetails = userOrders.map(order => {
//             const {
//                 _id: orderId,
//                 orderedItems,
//                 totalPrice,
//                 discount,
//                 finalAmount,
//                 address,
//                 status,
//                 paymentStatus,
//                 couponApplied,
//                 paymentMethod,
//                 createdOn
//             } = order;

//             // Further destructure orderedItems to extract product details
//             const productDetails = orderedItems.map(item => {
//                 const {
//                     productDetails: products
//                 } = item;

//                 return products.map(product => {
//                     const {
//                         _id: productId,
//                         productName,
//                         description,
//                         brand,
//                         category,
//                         regularPrice,
//                         salePrice,
//                         productOffer,
//                         quantity,
//                         color,
//                         productImages,
//                         isBlocked,
//                         status: productStatus
//                     } = product;

//                     return {
//                         productId,
//                         productName,
//                         description,
//                         brand,
//                         category,
//                         regularPrice,
//                         salePrice,
//                         productOffer,
//                         quantity,
//                         color,
//                         productImages,
//                         isBlocked,
//                         productStatus
//                     };
//                 });
//             });

//             return {
//                 orderId,
//                 orderedItems: productDetails,
//                 totalPrice,
//                 discount,
//                 finalAmount,
//                 address,
//                 status,
//                 paymentStatus,
//                 couponApplied,
//                 paymentMethod,
//                 createdOn
//             };
//         });

//         console.log(ordererdItems)

//         // Render the data to the frontend
//         res.render("orderDetails", {
//             name,
//             email,
//             orderDetails
//         });

//     } catch (error) {
//         console.error("Error fetching order details:", error.message);
//         res.status(500).render("pageNotFound", {
//             message: error.message || "Failed to fetch order details.",
//         });
//     }
// };



//-----------------------------------------------------


const getOrderDetails = async (req, res) => {
    try {
        const googleUser = req.user;
        const sessionUser = req.session.user;

        // Ensure user is logged in
        const userId = sessionUser || googleUser;

        if (!userId) {
            throw new Error("User is not logged in.");
        }

        // Perform an aggregation to fetch order details
        const orders = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }, // Match user by ID
            },
            {
                $lookup: {
                    from: "orders", // Reference the 'Order' collection
                    localField: "orderHistory", // Match user's order IDs
                    foreignField: "_id", // Match with orders' _id
                    as: "orderDetails", // Output array
                },
            },
            {
                $unwind: "$orderDetails", // Decompose the orderDetails array
            },
            {
                $lookup: {
                    from: "products", // Reference the 'Product' collection
                    localField: "orderDetails.orderedItems.product", // Match order items with products
                    foreignField: "_id", // Match with products' _id
                    as: "orderDetails.orderedItems.productDetails", // Output detailed product info
                },
            },
            {
                $group: {
                    _id: "$_id", // Group by user ID
                    name: { $first: "$name" },
                    email: { $first: "$email" },
                    orders: { $push: "$orderDetails" }, // Collect all orders with product details
                },
            },
        ]);

        // Check if orders exist
        if (!orders || orders.length === 0) {
            throw new Error("No orders found for the user.");
        }

        // Destructure the first order data
        const { name, email, orders: userOrders } = orders[0]; // Destructure name, email, and orders array

        // Example of further destructuring orders
        const orderDetails = userOrders.map(order => {
            const {
                _id: orderId,
                orderedItems,
                totalPrice,
                discount,
                finalAmount,
                address,
                status,
                paymentStatus,
                couponApplied,
                paymentMethod,
                createdOn
            } = order;

            // Since orderedItems is an object, we directly access it
            const productDetails = orderedItems.productDetails.map(product => {
                const {
                    _id: productId,
                    productName,
                    description,
                    brand,
                    category,
                    regularPrice,
                    salePrice,
                    productOffer,
                    quantity,
                    color,
                    productImages,
                    isBlocked,
                    status: productStatus
                } = product;

                return {
                    productId,
                    productName,
                    description,
                    brand,
                    category,
                    regularPrice,
                    salePrice,
                    productOffer,
                    quantity,
                    color,
                    productImages,
                    isBlocked,
                    productStatus
                };
            });

            return {
                orderId,
                orderedItems: productDetails,
                totalPrice,
                discount,
                finalAmount,
                address,
                status,
                paymentStatus,
                couponApplied,
                paymentMethod,
                createdOn
            };
        });

        // Render the data to the frontend
        res.render("orderDetails", {
            name,
            email,
            orderDetails
        });

    } catch (error) {
        console.error("Error fetching order details:", error.message);
        res.status(500).render("pageNotFound", {
            message: error.message || "Failed to fetch order details.",
        });
    }
};




const cancelOrder = async (req, res) => {
  const { id } = req.query;

  try {
      const order = await Order.findById(id);

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status !== 'Pending') {
          return res.status(403).json({ message: 'Cannot cancel this order' });
      }

      if (order.paymentMethod === 'COD') {
          order.status = 'Cancelled';
          await order.save();
          return res.json({ message: 'Order cancelled successfully' });
      }
      
      if (order.paymentMethod === 'online') {
          const userId = req.session.user;

          if (!userId) {
              return res.status(400).json({ message: 'User not authenticated' });
          }

          const amount = order.finalAmount;

          let wallet = await Wallet.findOne({ userId });
          if (!wallet) {
              wallet = new Wallet({
                  userId,
                  balance: amount,
                  transactions: [{
                      type: 'refund',
                      amount,
                      orderId: id,
                      description: 'Order refund',
                  }],
              });
          } else {
              wallet.balance += amount;
              wallet.transactions.push({
                  type: 'refund',
                  amount,
                  orderId: id,
                  description: 'Order refund',
              });
          }
     
          await wallet.save();
          order.status = 'Cancelled';
          await order.save();

          return res.json({ message: 'Order cancelled and refund processed successfully' });
      }
  } catch (error) {
      console.error('Error cancelling order:', error);
      return res.status(500).json({ message: 'Failed to cancel order' });
  }
};



module.exports = {
  getOrderDetails,
  cancelOrder,
}
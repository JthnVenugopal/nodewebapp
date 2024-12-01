const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/ProductSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');


// const getOrderDetails = async (req,res) => {
//     try {

//         const googleUser  = req.user; 
//         const sessionUser  = req.session.user; 
//         const userId = sessionUser  || googleUser ;

//         console.log("User : "+userId)

//         const {orderHistory} = userId;

//         const order = await User.findById(orderHistory);
         
//         console.log(order)
//         console.log(orderHistory);
        

        
//         res.render("orderDetails",{
         
//         }) 

//     } catch (error) {
//         console.error(error)
//     }
// }


const getOrderDetails = async (req, res) => {
    try {
        const googleUser = req.user;
        const sessionUser = req.session.user;

        // Ensure user is logged in
        const userId = sessionUser || googleUser;
        if (!userId) {
            throw new Error("User is not logged in.");
        }

        console.log("User: ", userId);

        // Perform an aggregation to fetch order details
        const orders = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId._id) }, // Match the user by ID

            },
            {
                $lookup: {
                    from: "orders", // MongoDB collection for Order
                    localField: "orderHistory", // Field in User containing order IDs
                    foreignField: "_id", // Field in Order matching the IDs
                    as: "orderDetails", // Output array field
                },
            },
            {
                $project: {
                    _id: 0, // Exclude the user's _id field
                    name: 1, // Include user's name
                    email: 1, // Include user's email
                    orderDetails: 1, // Include populated order details
                },
            },
        ]);

        // Check if orders exist
        if (!orders || orders.length === 0) {
            throw new Error("No orders found for the user.");
        }

        console.log("Orders fetched:", orders[0]);

        // Render the order details page
        res.render("orderDetails", {
            orders: orders[0].orderDetails, // Pass the populated order details to the view
            user: orders[0].name, // Optionally pass user name
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
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/ProductSchema");
const User = require("../../models/userSchema");
const mongoose = require('mongoose');



// const getOrderDetails = async (req, res) => {
//     try {
//         const orderId = req.query.id; 
       

//     const googleUser  = req.user; 
//     const sessionUser  = req.session.user; 
//     const userId = sessionUser  || googleUser ;

//         if (!userId) {
//             return res.redirect('/login');
//         }

//         const order = await Order.findById(orderId)
//             .populate({
//                 path: 'orderedItems.product', 
//             })
        
//             const addressdoc = await Address.findOne({userId}); 

//             const address = addressdoc.address.filter(addr => addr._id.toString() === order.address.toString());
            

//         if (!order) {
//             return res.status(404).send("Order not found.");
//         }

//         res.render('orderDetails', { order: order,address:address });
//     } catch (error) {
//         console.error("Error fetching order details:", error);
//         res.redirect('/pageNotFound');
//     }
// };

const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.id; 
        const googleUser  = req.user; 
        const sessionUser  = req.session.user; 
        const userId = sessionUser  || googleUser ;

        if (!userId) {
            return res.redirect('/login');
        }

        const order = await Order.findById(orderId)
            .populate({
                path: 'orderedItems.product', 
            })
        
            const addressdoc = await Address.findOne({userId}); 

            const address = addressdoc.address.filter(addr => addr._id.toString() === order.address.toString());
            

        if (!order) {
            return res.status(404).send("Order not found.");
        }

        res.render('orderDetails', { order: order,address:address });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.redirect('/pageNotFound');
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
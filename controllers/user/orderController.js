const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/ProductSchema");


// const getOrderDetails = async (req, res) => {
//   try {
//       const orderId = req.query.id; 
//       const sessionUser  = req.session.user;
//       const googleUser   = req.user;
//       const user = sessionUser  || googleUser ;

//       if (!user) {
//           return res.redirect('/login');
//       }

//       // Extract userId from the user object
//       const userId = user._id; // Assuming user has an _id field

//       const order = await Order.findById(orderId)
//           .populate({
//               path: 'orderedItems.product', 
//           });
      
//       const addressData = await Address.findOne({ userId }); 

//       console.log(addressData);
//       console.log(order)

      
//       if (!addressData) {
//           console.error("Address not found for user:", userId);
//           return res.status(404).send("Address not found.");
//       }

//       if (!order) {
//         return res.status(404).send("Order not found.");
//     }

//          // Filter the address based on the order's address
//       const address = addressData.address.filter(addr => addr._id.toString() === order.address.toString());

//       res.render('orderDetails', { 
//         order: order, 
//         address: address 
//         });

    

     

//   } catch (error) {
//       console.error("Error fetching order details:", error);
//       res.redirect('/pageNotFound');
//   }
// };

// const getOrderDetails = async (req, res) => {
//     try {
//         // Extract order ID from request parameters
//         const { orderId } = req.params;

//         // Fetch order details from the database
//         const order = await Order.findById(orderId).populate('products');

//         console.log(order);
//         console.log("Order ID:", orderId);
//         // Check if order was found
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         // Optionally fetch associated address and products if needed
//         const address = await Address.findById(order.shippingAddress);
//         const products = await Product.find({ _id: { $in: order.products } });

//         // Send the order details in the response
//         res.status(200).json({
//             order,
//             address,
            
//         });

//         res.render('orderDetails', { 
//                     order: order, 
//                     address: address,
//                     products,
//                     });
        
//     } catch (error) {
//         console.error('Error fetching order details:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

const getOrderDetails = async (req, res) => {
    try {
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
        
            const addressData = await Address.findOne({userId}); 

            const address = addressData.address.filter(addr => addr._id.toString() === order.address.toString());
            

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
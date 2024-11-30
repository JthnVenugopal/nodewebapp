const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/ProductSchema");
const User = require("../../models/userSchema");



const getOrderDetails = async (req, res) => {
    try {
        // Extract orderId from request parameters or query
        const orderId = req.query.id || req.params.orderId; // Adjust this line based on your routing

        const googleUser  = req.user; 
        const sessionUser  = req.session.user; 
        const user = sessionUser  || googleUser ;

        if (!user) {
            return res.redirect('/login');
        }

        const userId = user._id; // Assuming user has an _id field
        const userData = await User.findById(userId);
       

        
        // Fetch the order using the orderId
        const order = await Order.findById(orderId)
            .populate({
                path: 'orderedItems.product', 
            });

        console.log(order,userData)
        const addressData = await Address.findOne({ userId: user._id });

        if (!order) {
            return res.status(404).send("Order not found.");
        }

        if (!addressData) {
            console.error("Address not found for user:", user._id);
            return res.status(404).send("Address not found.");
        }

        // Filter the address based on the order's address
        const address = addressData.address.filter(addr => addr._id.toString() === order.address.toString());

        res.render('orderDetails', { 
            order: order, 
            address: address 
        });
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
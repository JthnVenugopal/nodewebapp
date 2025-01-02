const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');
const Product = require("../../models/productSchema");
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Razorpay = require('razorpay');
const Wishlist = require('../../models/wishlistSchema');
const Coupon = require('../../models/couponSchema');
const Wallet = require('../../models/walletSchema');
const Category = require('../../models/categorySchema');
const Variant = require('../../models/variantSchema');





const getRazorpay = async (req, res) => {
  try {

      const user = req.session.user || req.user;
    
      console.log("///////getRaazorpay");
    //   console.log("req.query/////////"+req.query);
      
      

      const { orderId, razorpayOrderId, razorpayKey, finalAmount, userName, userEmail, userPhone } = req.query;

      console.log(orderId,
          razorpayOrderId,
          razorpayKey,
          finalAmount,
          userName,
          userEmail,
          userPhone)

      res.render('razorpay-checkout', {
          orderId,
          razorpayOrderId,
          razorpayKey,
          finalAmount,
          userName,
          userEmail,
          userPhone,
          user : user,
      });
  } catch (error) {
      res.redirect('/pageNotFound');
  }
}

///////////////////////////////////////////////////////////////////////////////




const razorpaySuccess = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = req.session.user.id || req.user.id;

    console.log("///////////////razorpay//////////////////");

    const { paymentId, orderId, paymentStatus } = req.body;

    // Fetch the order using orderId and populate necessary fields
    const order = await Order.findById(orderId) // Use findById to correctly fetch the order by ObjectId
      .populate('user') // Populate user details if needed
      .populate('orderedItems.product'); // Populate product details if needed

    if (!order || order === null) {
      console.error('Order not found for orderId:', orderId);
      return res.status(400).json({ success: false, message: 'Order not found' });
    }

    if (paymentStatus === 'success') {
      order.paymentStatus = 'Completed';
      order.paymentId = paymentId;
      await order.save();

      await Cart.updateOne({ userId: order.user._id }, { $set: { items: [] } });

      await User.findByIdAndUpdate(
        order.user._id,
        { $push: { orderHistory: order._id } },
        { new: true }
      );

      const { orderedItems } = order;

      console.log('Ordered Items///////////:', orderedItems); 

      const variantIds = orderedItems.map(item => item.product.variant);

      console.log('Variants/////////////////:', variantIds);

      const variantsData = await Variant.find({ _id: { $in: variantIds } });

      console.log('Variants:', variantsData);

      const updateOperations = orderedItems.map(item => {
        const variantId = item.product.variant;
        const quantityToReduce = item.quantity;

        return {
          updateOne: {
            filter: { _id: variantId },
            update: { $inc: { quantity: -quantityToReduce } }
          }
        };
      });

      console.log('Update Operations:', JSON.stringify(updateOperations));

      const result = await Variant.bulkWrite(updateOperations);
      console.log('BulkWrite result:', result);

      return res.json({ success: true, orderId: order._id });
    } else {
      return res.status(400).json({ success: false, message: 'Payment failed' });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/////////////////////////////////////////////////////////////////////////////

const razorpayFailure = async (req, res) => {
  try {
      console.log('----------razorpayFailure------------')
      const { orderId } = req.body;
      console.log('Failed Order ID:', orderId);

      const order = await Order.findOne({ orderId: orderId });

      if (order) {
          order.paymentStatus = 'Pending';
          await order.save();
      }

      const userId = order.customer;
      await Cart.updateOne({ userId }, { $set: { items: [] } });
      await User.findByIdAndUpdate(
          userId,
          { $push: { orderHistory: order._id } },
          { new: true }
      );

      return res.json({ success: true });
  } catch (error) {
      console.error('Error updating failed order:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

////////////////////////////////////////////////////////////////////////////

const retryRazorpay = async (req, res) => {
  console.log('------------retryRazorpay--------------');
  const { orderId } = req.params;

  try {
      const existingOrder = await Order.findOne({ orderId });

      if (!existingOrder) {
          return res.status(404).send('Order not found.');
      }

      if (existingOrder.paymentMethod !== 'Razorpay') {
          return res.status(400).send('Payment method is not Razorpay.');
      }

      try {
          const razorpayOrder = await razorpay.orders.create({
              amount: existingOrder.finalAmount * 100,
              currency: 'INR',
              receipt: `order_rcptid_${Date.now()}`,
              notes: { userId: existingOrder.customer, addressData: existingOrder.address }
          });

          existingOrder.razorpayOrderId = razorpayOrder.id;
          existingOrder.status = 'Pending';
          await existingOrder.save();

          const userData = await User.findById(existingOrder.customer);

          return res.redirect(`/razorpay?orderId=${existingOrder.orderId}&razorpayOrderId=${razorpayOrder.id}&razorpayKey=${process.env.RAZORPAY_ID}&finalAmount=${existingOrder.finalAmount}&userName=${userData.name}&userEmail=${userData.email}&userPhone=${userData.phone}`);
      } catch (err) {
          console.error('Razorpay Order Creation Error:', err);
          return res.status(500).send('Failed to create Razorpay order. Please try again.');
      }
  } catch (error) {
      console.error('RetryRazorpay Error:', error);
      res.status(500).send('Server error occurred.');
  }
};

module.exports = {
  razorpaySuccess,
  getRazorpay,
  razorpayFailure,
  retryRazorpay,
}
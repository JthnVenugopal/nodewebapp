const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");
const { getUserWithAddresses } = require('../../utils/userUtils');
const Razorpay = require('razorpay');


const getCheckout = async (req, res) => {
  try {
  
    const userId =req.session.user.id ||  req.user;

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect('/login');
    }

    const cart = await Cart.findOne({ userId: user._id })
      .populate({
        path: 'items.productId',
        select: 'productName productImages variant',
        populate: {
          path: 'variant',
          select: 'productImages salePrice',
        },
      });

    const addresses = await Address.find({ userId: user._id });
    let totalAmount = cart.items.reduce((total, item) => total + item.totalPrice, 0);

    if (req.query.id) {
      const product = await Product.findById(req.query.id);
      if (!product) {
        return res.redirect('/pageNotFound');
      }
      totalAmount = product.salePrice;
      return res.render('checkout', { cart: null, product, addresses, totalAmount, user });
    } else {
      const cartItems = await Cart.findOne({ userId: user }).populate('items.productId');
      if (!cartItems) {
        return res.render('checkout', { cart: null, products: [], addresses, totalAmount, product: null, user });
      }
      totalAmount = cartItems.items.reduce((sum, item) => sum + item.totalPrice, 0);

      return res.render('checkout', {
        cart: cartItems,
        products: cartItems.items,
        addresses: addresses,
        totalAmount,
        product: null,
        user,
      });
    }

  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(500).send('Server Error');
  }
};


////////////////////////////////////////////////////////////////////////////

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY
});


///////////////////////////////////////////////////////////////////////////




// const placeOrder = async (req, res) => {
//   try {
//     const user = req.session.user || req.user;
//     const { addressId, payment_option } = req.body;
//     const userId = req.session.user?.id || req.user?._id;

//     if (!userId) {
//       return res.redirect('/login');
//     }

//     // Find the selected address
//     const userAddress = await Address.findOne({ userId: userId });
//     const selectedAddress = userAddress?.address.id(addressId);

//     console.log("Selected Address: ", selectedAddress);

//     if (!selectedAddress) {
//       return res.status(400).send("Selected address not found");
//     }

//     // Find the user's cart
//     const cart = await Cart.findOne({ userId }).populate("items.productId");
//     if (!cart) {
//       return res.status(404).send("Cart not found");
//     }

//     let totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
//     let orderedItems = cart.items.map(item => ({
//       product: item.productId._id,
//       quantity: item.quantity,
//       price: item.totalPrice / item.quantity,
//     }));

//     // Ensure payment method is valid
//     const validPaymentMethods = ["razorpay", "COD"]; 
//     if (!validPaymentMethods.includes(payment_option)) {
//       return res.status(400).send("Invalid payment method");
//     }

//     const newOrder = new Order({
//       orderedItems,
//       user: userId,
//       totalPrice,
//       finalAmount: totalPrice,
//       actualPrice: totalPrice,
//       address: {
//         house: selectedAddress.addressType, 
//         place: selectedAddress.city,
//         city: selectedAddress.city,
//         state: selectedAddress.state,
//         landMark: selectedAddress.landMark,
//         pin: selectedAddress.pincode,
//         contactNo: selectedAddress.phone
//       },
//       paymentMethod: payment_option,
//       paymentStatus: payment_option === "COD" ? "Pending" : "Not Applicable",
//       status: "Pending",
//     });

//     await newOrder.save();

//     // Reduce the quantity of each product in the inventory
//     for (const item of orderedItems) {
//       await Product.updateOne(
//         { _id: item.product },
//         { $inc: { quantity: -item.quantity } }
//       );
//     }

//     await Cart.updateOne({ userId }, { $set: { items: [] } });

//     console.log("New Order Created: ", newOrder);

//     if (payment_option === "razorpay") {
//       const razorpayOrder = await razorpay.orders.create({
//         amount: totalPrice * 100, 
//         currency: 'INR', 
//         receipt: `order_rcptid_${newOrder._id}`,
//       });
//       console.log("Razorpay Order Created: ", razorpayOrder);

//       return res.redirect(`/razorpay?orderId=${newOrder._id}&razorpayOrderId=${razorpayOrder.id}&razorpayKey=${process.env.RAZORPAY_ID}&finalAmount=${totalPrice}&userName=${user.name}&userEmail=${user.email}`);
//     }

//     res.render("orderConfirmation", { orderId: newOrder._id, user: req.user || req.session.user });

//   } catch (error) {
//     console.error("Error placing order: ", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

const placeOrder = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const { addressId, payment_option } = req.body;
    const userId = req.session.user?.id || req.user?._id;

    if (!userId) {
      return res.redirect('/login');
    }

    // Find the selected address
    const userAddress = await Address.findOne({ userId: userId });
    const selectedAddress = userAddress?.address.id(addressId);

    console.log("Selected Address: ", selectedAddress);

    if (!selectedAddress) {
      return res.status(400).send("Selected address not found");
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    let totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    console.log("totalPrice//////////"+totalPrice);
    

    let orderedItems = cart.items.map(item => ({
      product: item.productId._id,
      quantity: item.quantity,
      price: item.totalPrice / item.quantity,
    }));

    // Ensure payment method is valid
    const validPaymentMethods = ["razorpay", "COD"]; 
    if (!validPaymentMethods.includes(payment_option)) {
      return res.status(400).send("Invalid payment method");
    }

    const newOrder = new Order({
      orderedItems,
      user: userId,
      totalPrice,
      finalAmount: totalPrice,
      actualPrice: totalPrice,
      address: {
        house: selectedAddress.addressType, 
        place: selectedAddress.city,
        city: selectedAddress.city,
        state: selectedAddress.state,
        landMark: selectedAddress.landMark,
        pin: selectedAddress.pincode,
        contactNo: selectedAddress.phone
      },
      paymentMethod: payment_option,
      paymentStatus: payment_option === "COD" ? "Pending" : "Not Applicable",
      status: "Pending",
    });

    await newOrder.save();

    // Reduce the quantity of each product in the inventory
    for (const item of orderedItems) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { quantity: -item.quantity } }
      );
    }

    await Cart.updateOne({ userId }, { $set: { items: [] } });

    console.log("New Order Created: ", newOrder);

    if (payment_option === "razorpay") {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalPrice * 100, 
        currency: 'INR', 
        receipt: `order_rcptid_${newOrder._id}`,
      });
      console.log("Razorpay Order Created: ", razorpayOrder);

      return res.redirect(`/razorpay?orderId=${newOrder._id}&razorpayOrderId=${razorpayOrder.id}&razorpayKey=${process.env.RAZORPAY_ID}&finalAmount=${totalPrice}&userName=${user.name}&userEmail=${user.email}`);
    }

    res.render("orderConfirmation", { orderId: newOrder._id, user: req.user || req.session.user });

  } catch (error) {
    console.error("Error placing order: ", error);
    res.status(500).send("Internal Server Error");
  }
};



////////////////////////////////////////////////////////////////////////////////////


const postAddAddress = async (req, res) => { 
  console.log("-------------------------postaddress");
  try { 
    const userId = req.session.user || req.user; 
    const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body; 
    if (!userId) { 
      return res.status(401).send('User not authenticated');
     } 
const user = await User.findById(userId);
if (!user) {
  return res.status(404).send('User not found'); 
} 

const newAddress = {
    addressType, name, city, landMark, state, pincode, phone, altPhone 
  };
  
  const userAddress = await Address.findOne({ userId: user._id });
  
  if (!userAddress) { 
    const newAddressEntry = new Address({ userId: user._id, address: [newAddress], });
    console.log("-------------------------1");
    
    await newAddressEntry.save(); } 
    
else { userAddress.address.push(newAddress);
  console.log("-------------------------2");
    await userAddress.save(); } 
    
    res.render('/checkout',{
    newAddress : newAddress
    });



  } catch (error) { console.error("Error adding address", error); res.status(500).send("Internal Server Error"); } };


module.exports = {
  getCheckout,
  placeOrder,
  postAddAddress


}






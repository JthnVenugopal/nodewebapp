const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");
const { getUserWithAddresses } = require('../../utils/userUtils');


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






// const placeOrder = async (req, res) => {
//   try {
//     const { addressId, payment_option, singleProduct, discountInput, couponCodeInput } = req.body;
    
//     const userId = req.session.user || req.user;

//     if (!userId) {
//       console.log("User not logged in");
//       return res.redirect('/login');
//     }

//     const user = await getUserWithAddresses(userId); // Use the utility function here
//     if (!user) {
//       console.log("User not found");
//       return res.status(404).send("User not found");
//     }

//     console.log("User Addresses:", user.address); // Log addresses to debug structure

//     if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
//       console.error("Invalid or missing addressId:", addressId);
//       return res.status(400).send("Invalid address selected");
//     }

//     const selectedAddress = user.address.find(addr => addr._id.toString() === addressId);
//     if (!selectedAddress) {
//       console.error("Selected address not found:", addressId);
//       return res.status(400).send("Selected address not found");
//     }

//     const cart = await Cart.findOne({ userId }).populate("items.productId");
//     if (!cart) {
//       console.error("Cart not found for user:", userId);
//       return res.status(404).send("Cart not found");
//     }

//     let totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
//     if (isNaN(totalPrice)) {
//       console.log("Invalid totalPrice:", totalPrice);
//       return res.status(400).send("Invalid total price");
//     }

//     let orderedItems = [];
//     if (singleProduct) {
//       const product = JSON.parse(singleProduct);
//       orderedItems.push({
//         product: product._id,
//         quantity: 1,
//         price: product.salePrice,
//         regularPrice: product.regularPrice
//       });
//       totalPrice = product.salePrice;
//       await Product.findByIdAndUpdate(product._id, { $inc: { quantity: -1 } });
//     } else {
//       const cartItems = cart.items;
//       orderedItems = cartItems.map(item => ({
//         product: item.productId._id,
//         quantity: item.quantity,
//         price: item.totalPrice / item.quantity,
//         regularPrice: item.productId.regularPrice
//       }));
//       for (const item of cartItems) {
//         await Product.findByIdAndUpdate(item.productId._id, { $inc: { quantity: -item.quantity } });
//       }
//     }

//     let finalAmount = totalPrice - discountInput;
//     let actualPrice = totalPrice; // or however you define actualPrice

//     const paymentStatus = (payment_option === "Cash on delivery") ? "Pending" : "Not Applicable";
//     const paymentMethod = payment_option === "COD" ? "Cash on delivery" : payment_option;

//     const newOrder = new Order({
//       orderedItems,
//       user: userId,
//       totalPrice: totalPrice,
//       actualPrice: actualPrice,
//       finalAmount: finalAmount,
//       address: {
//         house: selectedAddress.house,
//         place: selectedAddress.place,
//         city: selectedAddress.city,
//         state: selectedAddress.state,
//         landMark: selectedAddress.landMark,
//         pin: selectedAddress.pin,
//         contactNo: selectedAddress.phone // Adjust this based on your schema
//       },
//       paymentMethod: paymentMethod,
//       couponCode: couponCodeInput,
//       discount: discountInput,
//       couponApplied: Boolean(couponCodeInput && discountInput),
//       paymentStatus: paymentStatus,
//       status: "Pending",
//     });

//     await newOrder.save();
//     await User.findByIdAndUpdate(userId, { $push: { orderHistory: newOrder._id } });

//     cart.items = [];
//     await cart.save();

//     res.render("orderConfirmation", { orderId: newOrder._id, user });

//   } catch (error) {
//     console.error("Error placing order:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

const placeOrder = async (req, res) => {

  try {


    // console.log("req: " + JSON.stringify(req.body, null, 2));

    console.log("--------------------placeorder--------------------------------");
    
    const { addressId, payment_option, singleProduct, discountInput, couponCodeInput } = req.body;


    // console.log(addressId, payment_option, singleProduct, discountInput, couponCodeInput);

    const userId = req.session.user.id || req.user;

    if (!userId) {
      console.log("User not logged in");
      return res.redirect('/login');
    }
     
    const userAddress = await Address.findOne({ userId: userId });
    // console.log("User Address: ", userAddress);

    const selectedAddress = userAddress.address[addressId]
   
    
    const user = await getUserWithAddresses(userId); // Use the utility function here
    if (!user) {
      console.log("User not found");
      return res.status(404).send("User not found");
    }

    console.log("User Addresses is :", selectedAddress); // Log addresses to debug structure

    // if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    //   console.error("Invalid or missing addressId:", addressId);
    //   return res.status(400).send("Invalid address selected");
    // }

    // const selectedAddress = user.address.find(addr => addr._id.toString() === addressId);
    // console.log("Selected Address:", selectedAddress); // Log selected address for debugging

    if (!selectedAddress) {
      console.error("Selected address not found:", addressId);
      return res.status(400).send("Selected address not found");
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      console.error("Cart not found for user:", userId);
      return res.status(404).send("Cart not found");
    }

    let totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    if (isNaN(totalPrice)) {
      console.log("Invalid totalPrice:", totalPrice);
      return res.status(400).send("Invalid total price");
    }

    let orderedItems = [];
    if (singleProduct) {
      const product = JSON.parse(singleProduct);
      orderedItems.push({
        product: product._id,
        quantity: 1,
        price: product.salePrice,
        regularPrice: product.regularPrice
      });
      totalPrice = product.salePrice;
      await Product.findByIdAndUpdate(product._id, { $inc: { quantity: -1 } });
    } else {
      const cartItems = cart.items;
      orderedItems = cartItems.map(item => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.totalPrice / item.quantity,
        regularPrice: item.productId.regularPrice
      }));
      for (const item of cartItems) {
        await Product.findByIdAndUpdate(item.productId._id, { $inc: { quantity: -item.quantity } });
      }
    }

    let finalAmount = totalPrice - discountInput;
    let actualPrice = totalPrice; // or however you define actualPrice

    const paymentStatus = (payment_option === "Cash on delivery") ? "Pending" : "Not Applicable";
    const paymentMethod = payment_option === "COD" ? "Cash on delivery" : payment_option;

    const newOrder = new Order({
      orderedItems,
      user: userId,
      totalPrice: totalPrice,
      actualPrice: actualPrice,
      finalAmount: finalAmount,
      address: {
        house: selectedAddress.addressType,
        place: selectedAddress.city,
        city: selectedAddress.city,
        state: selectedAddress.state,
        landMark: selectedAddress.landMark,
        pin: selectedAddress.pincode,
        contactNo: selectedAddress.phone // Adjust this based on your schema
      },
      paymentMethod: paymentMethod,
      couponCode: couponCodeInput,
      discount: discountInput,
      couponApplied: Boolean(couponCodeInput && discountInput),
      paymentStatus: paymentStatus,
      status: "Pending",
    });

    await newOrder.save();
    await User.findByIdAndUpdate(userId, { $push: { orderHistory: newOrder._id } });

    cart.items = [];
    await cart.save();

    res.render("orderConfirmation", { orderId: newOrder._id, user });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).send("Internal Server Error");
  }
};















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






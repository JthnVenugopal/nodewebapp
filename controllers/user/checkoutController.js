const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");
const { getUserWithAddresses } = require('../../utils/userUtils');
const Razorpay = require('razorpay');
const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema");

//////////////////////////////////////////////////////////////////////////

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

      console.log("cart////////////////////////", cart);

      const coupon = await Coupon.find({ status: "Active" });

      // console.log("Coupon/////////////", coupon);
      

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
        coupons: coupon,

      });
    }

  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(500).send('Server Error');
  }
};


//////////////////////////////////////////////////////////////////////////

const applyCoupon = async (req, res) => {
  try {
    console.log("applyCoupon////////////////////////");

    const couponCode = req.query.code;
    const pdtPrice = parseFloat(req.query.price);

    if (!couponCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    if (isNaN(pdtPrice) || pdtPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid product price' });
    }

    // Fetch the coupon from the database
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    // Validate minimum purchase amount
    if (pdtPrice < coupon.minPurchaseAmount) {
      return res.status(400).json({ success: false, 
      message: `Minimum purchase amount of ${coupon.minPurchaseAmount} not reached` 
       });
    }

 // Validate maximum purchase amount
if (pdtPrice > coupon.maxPurchaseAmount) {
  return res.status(400).json({
    success: false,
    message: `Maximum purchase amount of ${coupon.maxPurchaseAmount} reached, try with a lesser amount`
  });
}
    // Validate coupon status
    if (coupon.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Coupon is not active' });
    }

    // Validate coupon usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Validate coupon date range
    const currentDate = new Date();
    if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not valid at this time' });
    }

    // Assuming the coupon has a discount field that holds the discount value
    const discount = coupon.discountValue;

    // Perform any additional validation or business logic here

    // Increment the used count if coupon is valid
    coupon.usedCount += 1;
    await coupon.save();

    return res.status(200).json({ success: true, discount, message: 'Coupon applied successfully' });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

//////////////////////////////////////////////////////////////////////////



const removeCoupon= async (req, res) => {
  try {
      // Logic to handle coupon removal
      req.session.coupon = null; // Example: removing the coupon from session
  } catch (error) {
      console.error('Error removing coupon:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
  }
}


//////////////////////////////////////////////////////////////////////////

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY
});

//////////////////////////////////////////////////////////////////////////


const placeOrder = async (req, res) => {
  try {

    console.log("placeOrder////////////////////////");

    // console.log("req.body//////////", req.body);
    
    
    const user = req.session.user || req.user;
    const { addressId, payment_option, appliedCouponCode } = req.body; // Include appliedCouponCode
    const userId = req.session.user?.id || req.user?._id;

    if (!userId) {
      return res.redirect('/login');
    }


    // Find the selected address
    const userAddress = await Address.findOne({ userId: userId });
    const selectedAddress = userAddress?.address.id(addressId);

    // console.log("Selected Address: ", selectedAddress);

    if (!selectedAddress) {
      return res.status(400).send("Selected address not found");
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    let totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    console.log("totalPrice//////////" + totalPrice);

    let discount = 0;
    if (appliedCouponCode) {
      const coupon = await Coupon.findOne({ code: appliedCouponCode, status: 'Active' });

      console.log("applied-coupon//////////", coupon);

      if (coupon) {
        discount = coupon.discountValue;
      } else {
        return res.status(400).send("Invalid coupon code");
      }
    }

    const finalAmount = totalPrice - discount;

    console.log("final amt //////////"+finalAmount)

    let orderedItems = cart.items.map(item => ({
      product: item.productId._id,
      quantity: item.quantity,
      price: item.totalPrice / item.quantity,
    }));

   // Ensure payment method is valid
const validPaymentMethods = ["razorpay", "COD", "wallet"];
if (!validPaymentMethods.includes(payment_option)) {
  return res.status(400).send("Invalid payment method");
}

// Wallet Payment Handling
if (payment_option === "wallet") {
  const userWallet = await Wallet.findOne({ userId: req.session.user.id }).exec();

//console.log("userWallet//////////", userWallet);
  

  if (!userWallet || userWallet.balance < finalAmount) {
    return res.status(400).send("Insufficient wallet balance");
  }

  // Deduct the final amount from the user's wallet
  userWallet.balance -= finalAmount;

  // Add the transaction to the wallet's transaction history
  userWallet.transactions.push({
    type: "debit",
    amount: finalAmount,
    description: "Order payment"
  });

  await userWallet.save();
}


 // Check if COD is available for the final amount
 if (finalAmount > 1000 && payment_option === "COD") {
  return res.json({ message: "COD not available for Orders above 1000 price" });
}


    const newOrder = new Order({
      orderedItems,
      user: userId,
      totalPrice,
      discount, // Save the discount value
      finalAmount, // Save the final amount after applying discount
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


    console.log("newOrder//////////", newOrder);


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
        amount: finalAmount * 100, // Use the final amount after discount
        currency: 'INR',
        receipt: `order_rcptid_${newOrder._id}`,
      });
      console.log("Razorpay Order Created: ", razorpayOrder);

      return res.redirect(`/razorpay?orderId=${newOrder._id}&razorpayOrderId=${razorpayOrder.id}&razorpayKey=${process.env.RAZORPAY_ID}&finalAmount=${finalAmount}&userName=${user.name}&userEmail=${user.email}`);
    }

    res.render("orderConfirmation", { orderId: newOrder._id, user: req.user || req.session.user });

  } catch (error) {
    console.error("Error placing order: ", error);
    res.status(500).send("Internal Server Error");
  }
};

//////////////////////////////////////////////////////////////////////////


const postAddAddress = async (req, res) => { 
  console.log("-------------------------postaddress");
  try { 
    const userId = req.session.user.id || req.user.id; 
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

    const userAddress = await Address.findOne({ userId: userId });
  
    if (!userAddress) { 
      const newAddressEntry = new Address({ userId: user._id, address: [newAddress] });
      console.log("-------------------------1");
      await newAddressEntry.save(); 
    } else { 
      userAddress.address.push(newAddress);
      console.log("-------------------------2");
      await userAddress.save(); 
    } 
    
    // Send a success response with a message
    res.json({ success: true, message: 'Address added successfully' });

  } catch (error) { 
    console.error("Error adding address", error); 
    res.status(500).send("Internal Server Error");
  } 
};


//////////////////////////////////////////////////////////////////////////

const getOrderConfirmed = (req, res) => {
  const user = req.session.user || req.user;
  const { message, orderId } = req.query;

  if (!req.session.user) {
      return res.redirect('/login');
  }

  res.render('orderConfirmed', {
      message,
      orderId,
      redirectTo: '/order', 
      success: true,
      user,
  });
};

//////////////////////////////////////////////////////////////////////////

const getEditAddressCheckout = async (req, res) => {

  console.log("getEditAddressCheckout////////////////////////////")

  try {

    const user = req.session.user || req.user;
    const userId = user.id;
   
    //console.log("req//////////"+req.query)
    
    const  address  = {...req.query};
    //console.log(address)

    const addressId = Object.keys(address)[0];

    //console.log(addressId)

    const userAddressData = await Address.findOne({ userId }).populate('address')
    //console.log("userAddressData//////////"+userAddressData)
    
    const specificAddress = userAddressData.address.find(addr => addr._id.toString() === addressId);
    if (!specificAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }
    //console.log("selectedAddress//////////"+specificAddress)
    
  
    res.render('edit-address-checkout' ,{
      address: specificAddress,
      user,
    })
    

    

  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
};

//////////////////////////////////////////////////////////////////////////

// const postNewAddressCheckout = async (req,res) => {

//   try {

//     console.log("postNewAddressCheckout////////////////////");

//       console.log(req.body)

//       const {addressType,name,city,landMark,state,pincode,phone,altPhone} = req.body

     

//       const newAddress = {
//         addressType,
//         name,
//         city,
//         landMark,
//         state,
//         pincode,
//         phone,
//         altPhone
        
//       };

//       const user = req.session.user || req.user;
//       //console.log(req.query)
      
//       const userId = user.id;
//       const addressId = req.query.id
//       //console.log(addressId);

//       const userAddressData = await Address.findOne({ userId }).populate('address')
//       //console.log("userAddress//////////"+userAddressData)

//       const specificAddress = userAddressData.address.find(addr => addr._id.toString() === addressId);
//     if (!specificAddress) {
//       return res.status(404).json({ message: 'Address not found' });
//     }
//     //console.log("selectedAddress//////////"+specificAddress)
      
//       if (!userAddressData) {
        
//         userAddressData = new Address({
//           userId,
//           address: [newAddress]
//         });
//       } else {
        
//         userAddressData.address.push(newAddress);
//       }

//       await userAddressData.save();


      
//   } catch (error) {
    
//   }

// }

// const postNewAddressCheckout = async (req, res) => {
//   try {
//     console.log("postNewAddressCheckout////////////////////");
//     console.log(req.body);

//     // Extract address details from the request body
//     const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;

//     // Extract user information
//     const user = req.session.user || req.user;
//     const userId = user.id;
//     const addressId = req.query.id;

//     // Find the user's address data
//     const userAddressData = await Address.findOne({ userId }).populate('address');

//     if (!userAddressData) {
//       return res.status(404).json({ message: 'User address data not found' });
//     }

//     // Find the specific address to update
//     const specificAddress = userAddressData.address.find(addr => addr._id.toString() === addressId);
//     if (!specificAddress) {
//       return res.status(404).json({ message: 'Address not found' });
//     }

//     // Update the specific address with the new details
//     specificAddress.addressType = addressType;
//     specificAddress.name = name;
//     specificAddress.city = city;
//     specificAddress.landMark = landMark;
//     specificAddress.state = state;
//     specificAddress.pincode = pincode;
//     specificAddress.phone = phone;
//     specificAddress.altPhone = altPhone;

//     // Save the updated address data
//     await userAddressData.save();

//     // Respond with the updated address
//     res.status(200).json({ message: 'Address updated successfully', address: specificAddress });

    

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'An error occurred while updating the address' });
//   }
// };

const postNewAddressCheckout = async (req, res) => {
  try {
    console.log("postNewAddressCheckout////////////////////");
    console.log(req.body);

    // Extract address details from the request body
    const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;

    // Extract user information
    const user = req.session.user || req.user;
    const userId = user.id;
    const addressId = req.query.id;

    // Find the user's address data
    const userAddressData = await Address.findOne({ userId }).populate('address');

    if (!userAddressData) {
      return res.status(404).json({ message: 'User address data not found' });
    }

    // Find the specific address to update
    const specificAddress = userAddressData.address.find(addr => addr._id.toString() === addressId);
    if (!specificAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update the specific address with the new details
    specificAddress.addressType = addressType;
    specificAddress.name = name;
    specificAddress.city = city;
    specificAddress.landMark = landMark;
    specificAddress.state = state;
    specificAddress.pincode = pincode;
    specificAddress.phone = phone;
    specificAddress.altPhone = altPhone;

    // Save the updated address data
    await userAddressData.save();

    // Respond with a success message
    res.status(200).json({ success: true, message: 'Address updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while updating the address' });
  }
};

//////////////////////////////////////////////////////////////////////////

module.exports = {
  getCheckout,
  placeOrder,
  postAddAddress,
  getOrderConfirmed,
  applyCoupon,
  removeCoupon,
  getEditAddressCheckout,
  postNewAddressCheckout,

}

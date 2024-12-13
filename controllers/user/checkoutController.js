const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");

const getCheckout = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const googleUser  = req.user;
    const userId = sessionUser || googleUser;

      const user = await User.findById(userId);
      // console.log(user)



      if (!user) {
          return res.redirect('/login');
      }
      
      const cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
      //populate-retrieves the full product documents associated with those IDs
      
      const addresses = await Address.find({ userId: user._id });


      let totalAmount = cart.items.reduce((total, item) => total + item.totalPrice, 0);

      
      if (req.query.id) {
          const product = await Product.findById(req.query.id);
          if (!product) {
            return res.redirect('/pageNotFound');
          }
          totalAmount = product.salePrice;
          return res.render('checkout', { cart: null, product, addresses, totalAmount,user });
        } else {
          const cartItems = await Cart.findOne({ userId: user }).populate('items.productId');
          if (!cartItems) {
            return res.render('checkout', { cart: null, products: [], addresses, totalAmount, product: null ,user});
          }
          totalAmount = cartItems.items.reduce((sum, item) => sum + item.totalPrice, 0);


          return res.render('checkout', { 
            cart: cartItems,
             products: cartItems.items, 
             addresses:addresses, 
             totalAmount,
             product: null ,
             user});
        }
     
  } catch (error) {
      console.error('Error loading checkout page:', error);
      res.status(500).send('Server Error');
  }
};



const placeOrder = async (req, res) => {
  try {
      const { addressId, payment_option, singleProduct,discountInput,couponCodeInput,selectedAddressId } = req.body;
      const sessionUser = req.session.user;
      const googleUser  = req.user;
      const userId = sessionUser || googleUser;


      if (!userId) {
          console.log("User not logged in");
          return res.redirect('/login');
      }

     
      const user = await User.findById(userId).populate('address');

      console.log("Valid ObjectId:", mongoose.Types.ObjectId.isValid(addressId));


     

      if (!user) {
          console.log("User not found");
          return res.status(404).send("User not found");
      }

      if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
          console.error("Invalid or missing addressId:", addressId);
          return res.status(400).send("Invalid address selected");
      }

      
      
      const cart = await Cart.findOne({ userId }).populate("items.productId");

      
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
          });
          totalPrice = product.salePrice;
          await Product.findByIdAndUpdate(product._id, {
            $inc: { quantity: -1 }
        });
        
      } else if (cart) {
          const cartItems = cart.items;
          orderedItems = cartItems.map(item => ({
              product: item.productId._id,
              quantity: item.quantity,
              price: item.totalPrice / item.quantity,
          }));
          cartItems.forEach(async item=>{
            await Product.findByIdAndUpdate(item.productId.id,{
              $inc:{quantity:-item.quantity}
            })
          })
      }

      let finalAmount = totalPrice-discountInput;
      let paymentStatus;
      if(payment_option=="COD"){
          paymentStatus = "COD"
          
      }else{
          paymentStatus = "pending"
      }
      
      const newOrder = new Order({
          orderedItems,
          user: userId,
          totalPrice: totalPrice,
          finalAmount: finalAmount,
          address: addressId,
          paymentMethod: payment_option,
          couponCode:couponCodeInput,
          discount:discountInput,
          couponApplied: Boolean(couponCodeInput && discountInput),
          paymentStatus: "Pending",
          status: "Pending",
      });

     
      await newOrder.save();
     

      await User.findByIdAndUpdate(userId, { $push: { orderHistory: newOrder._id } });

      cart.items = [];
      await cart.save();

      
      res.render("orderConfirmation",{orderId:newOrder._id,user});

  } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).send("Internal Server Error");
  }
};





// const postAddaddress = async (req, res) => {
//   try {

//       const sessionUser = req.session.user;
//       const googleUser  = req.user;
//       const userId = sessionUser || googleUser;
      
//       if (!userId) {
//           return res.redirect("/login");
//       }

//       const userData = await User.findOne({ _id: userId });
//       if (!userData) {
//           return res.redirect("/pageNotFound");
//       }

//       const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;
//       if (!addressType || !name || !city || !state || !pincode || !phone) {
//           return res.status(400).send("Missing required fields");
//       }

//       const userAddress = await Address.findOne({ userId: userData._id });
//       if (!userAddress) {
//           const newAddress = new Address({
//               userId: userData._id,
//               address: [{ addressType, name, city, landMark, state, pincode, phone, altPhone }],
//           });
//           await newAddress.save();
//       } else {
//           userAddress.address.push({ addressType, name, city, landMark, state, pincode, phone, altPhone });
//           await userAddress.save();
//       }

//       res.render("/checkout",{
//         user:userData,
//         address:userAddress,
//         payment:payment,

//       });
//   } catch (error) {
//       console.error("Error adding address", error);
//       res.status(500).send("Internal Server Error");
//   }
// }






module.exports = {
  getCheckout,
  placeOrder,
  // postAddaddress


}






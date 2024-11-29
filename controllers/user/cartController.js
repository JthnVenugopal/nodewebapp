const User = require("../../models/userSchema")
const Category = require("../../models/categorySchema");
const Product = require("../../models/ProductSchema");
const Cart = require("../../models/cartSchema");


const getCart = async (req,res) => {
  try {

    const sessionUser = req.session.user;
    const googleUser  = req.user;
    const userId = sessionUser || googleUser;

      if (!userId) {
          return res.redirect('/login');
      }

      const user = await User.findById(userId);

      const cartItems = await Cart.findOne({ userId: userId }).populate('items.productId','productName productImages salePrice');

      if (!cartItems) {
          return res.render('cart', { cart: null, products: [], totalAmount: 0, user:user });
      }

      const totalAmount = cartItems.items.reduce((sum, item) => sum + item.totalPrice, 0);

      res.render('cart', { cart: cartItems, products: cartItems.items, totalAmount, user:user});
  } catch (error) {
      console.error(error);
      res.redirect('/page-not-found');
  }
}

const addToCart = async (req, res) => {
  try {

    const sessionUser = req.session.user;
    const googleUser  = req.user;
    const userId = sessionUser || googleUser;
      if (!userId) {
          return res.redirect('/login');
      }

      const productId = req.query.id;
      const quantity = parseInt(req.body.quantity) || 1;
      
      let cart = await Cart.findOne({ userId });
      if (!cart) {
          cart = new Cart({ userId, items: [] });
      }

      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }

      const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));

      if (itemIndex > -1) {
         
          cart.items[itemIndex].quantity += quantity;
          cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * product.salePrice;
      } else {
         
          cart.items.push({
              productId,
              quantity,
              price: product.salePrice, 
              totalPrice: quantity * product.salePrice
          });
      }

      await cart.save();
      res.redirect('/cart');
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const googleUser  = req.user;
    const userId = sessionUser || googleUser;

      if (!userId) {
          return res.redirect('/login');
      }

      const productId = req.query.id; 

      
      const cart = await Cart.findOne({ userId });
      if (!cart) {
          return res.status(404).json({ message: "Cart not found" });
      }

     
      const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
      if (itemIndex === -1) {
          return res.status(404).json({ message: "Product not in cart" });
      }

     
      cart.items.splice(itemIndex, 1);

      
      await cart.save();

      
      res.redirect('/cart');
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred while removing the product" });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
      const { productId, quantity } = req.body;
      const userId = req.session.user;
      

     
      const cart = await Cart.findOne({ userId });
      if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

      
      const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
      if (itemIndex === -1) return res.status(404).json({ success: false, message: "Product not in cart" });

     
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });

     
      if (quantity > product.quantity) {
          return res.status(400).json({ success: false, message: "Exceeds available stock" });
      }

      
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].totalPrice = quantity * product.salePrice;

      
      await cart.save();

      
      res.json({ success: true, newTotalPrice: cart.items[itemIndex].totalPrice });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error updating quantity" });
  }
};



module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity
}
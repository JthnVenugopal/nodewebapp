
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Variant = require("../../models/variantSchema");

const getCart = async (req, res) => {
  try {
    const userId = req.session.user.id || req.user;

    if (!userId) {
      return res.status(401).json({ error: "User  not authenticated" });
    }

    const cart = await Cart.findOne({ userId: userId })
      .populate({
        path: 'items.productId',
        select: 'productName variant',
        populate: {
          path: 'variant',
          select: 'productImages salePrice',
        },
      })
      .populate('items.variantId');

    if (!cart) {
      return res.render('cart', {
        user: userId,
        items: [],
      });
    }

    res.render('cart', {
      user: userId,
      items: cart.items,
    });

  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//---------------------------------------------------------------



const addToCart = async (req, res) => {
  try {
    const user = req.session.user.id || req.user;

    if (!user) {
      return res.status(401).send('User  not authenticated');
    }

    const { variantId, productId, quantity, size, price } = req.body;
    const parsedQuantity = parseInt(quantity);

    // Find the variant and product
    const variant = await Variant.findById(variantId);
    const product = await Product.findById(productId);

    if (!variant || !product) {
      return res.status(404).send('Variant or Product not found');
    }

    // Find the user's cart
    let cart = await Cart.findOne({ userId: user })
    .populate('items.productId')
    .populate('items.variantId');


    // If the cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({ userId: user, items: [] });
    }

    // Check if the item already exists in the cart
    const existingItemIndex = cart.items.findIndex(item => item.variantId.toString() === variantId);

    if (existingItemIndex > -1) {
      // If the item exists, update the quantity and total price
      cart.items[existingItemIndex].quantity += parsedQuantity;
      cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * price; // Update total price
    } else {
      // If the item doesn't exist, add a new item to the cart
      cart.items.push({
        productId: productId,
        variantId: variantId,
        quantity: parsedQuantity,
        size: size,
        totalPrice: price * parsedQuantity,
        price: price,
      });
    }

    // Save the cart
    await cart.save();

    // Redirect to the cart page to prevent form resubmission
    res.redirect('/cart');

  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send('Internal Server Error');
  }
};


//-----------------------------------------------------

const removeFromCart = async (req, res) => {
  try {
    const user = req.session.user.id || req.user;

    if (!user) {
      return res.status(401).send('User  not authenticated');
    }

    const cartItemId = req.params.cartItemId; // Get the cart item ID from the request parameters

    // Find the user's cart
    let cart = await Cart.findOne({ userId: user });

    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    // Find the index of the item to remove
    const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);

    if (itemIndex === -1) {
      return res.status(404).send('Item not found in cart');
    }

    // Get the quantity of the item to remove
    const quantityToRemove = cart.items[itemIndex].quantity;

    // Find the variant associated with the item
    const variantId = cart.items[itemIndex].variantId;
    const variant = await Variant.findById(variantId);

    if (!variant) {
      return res.status(404).send('Variant not found');
    }

    // Add the quantity back to the variant
    variant.quantity += quantityToRemove;
    await variant.save();

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Redirect to the cart page to update the view
    res.redirect('/cart');

  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
};
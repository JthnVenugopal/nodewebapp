
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Variant = require("../../models/variantSchema");
const Wishlist = require("../../models/wishlistSchema")



const getCart = async (req, res) => {
  try {

    const user = req.session.user || req.user;

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
      user : user ,
      
    });

  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/////////////////////////////////////////////////////////////////////


const addToCart = async (req, res) => {
  try {
    const user = req.session.user?.id || req.user?._id;

    if (!user) {
      return res.status(401).send('User not authenticated');
    }

    const { variantId, productId, quantity, size, price, wishlistItemId } = req.body;
    const parsedQuantity = parseInt(quantity);

    console.log("variantId//////////" + variantId);
    console.log("productId//////////" + productId);
    console.log("wishlistId//////////" + wishlistItemId);

    // Find the variant and product
    const variant = await Variant.findById(variantId);
    const product = await Product.findById(productId);

    if (!variant || !product) {
      return res.status(404).send('Variant or Product not found');
    }

    // Remove item from Wishlist
    if (wishlistItemId) {
      const wishlistItem = await Wishlist.findByIdAndDelete(wishlistItemId); // Delete the item by wishlistItemId
      if (wishlistItem) {
        console.log("Item removed from Wishlist using wishlistItemId:", wishlistItemId);
      } else {
        console.log("No item found in Wishlist with wishlistItemId:", wishlistItemId);
      }
    }

    // Find the user's cart
    let cart = await Cart.findOne({ userId: user })
      .populate('items.productId')
      .populate('items.variantId');

    console.log("cart///////Data" + cart);

    // If the cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({ userId: user, items: [] });
    }

    console.log("CART:", cart.items);

    // Function to update existing item
    const updateExistingItem = (index) => {
      cart.items[index].quantity += parsedQuantity;
      cart.items[index].totalPrice = cart.items[index].quantity * price; // Update total price
    };

    // Function to add new item
    const addNewItem = () => {
      cart.items.push({
        productId: productId,
        variantId: variantId,
        quantity: parsedQuantity,
        size: size,
        totalPrice: price * parsedQuantity,
        price: price,
      });
    };

    // Check if the item already exists in the cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.productId._id.toString() === productId.toString() &&
      item.variantId._id.toString() === variantId.toString()
    );

    if (existingItemIndex > -1) {
      updateExistingItem(existingItemIndex);
    } else {
      addNewItem();
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


///////////////////////////////////////////////////////////////////////

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



///////////////////////////////////////////////////////////////////////




const updateCartItem = async (req, res) => {
  try {

    console.log("updateCartItem/////////////////////////////////////////");
    
      const { id } = req.params;
      const { quantity } = req.body;

      console.log('Received request to update quantity for item ID:', id, 'New Quantity:', quantity);

      // Validate quantity
      if (quantity < 1 || quantity > 5) {
          return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 5' });
      }

      // Find the cart and update the quantity
      const cart = await Cart.findOneAndUpdate(
          { 'items._id': id },
          { $set: { 'items.$.quantity': quantity } },
          { new: true }
      ).populate('items.productId');


      console.log("cartData////"+cart);
      

      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart item not found' });
      }

      // Find the updated item
      const updatedItem = cart.items.find(item => item._id.toString() === id);
      if (!updatedItem) {
          return res.status(404).json({ success: false, message: 'Updated cart item not found' });
      }

      console.log("updatedItem///////////////////////////"+updatedItem)

      // Calculate the new total price for the item
      const newTotalPrice = updatedItem.quantity * updatedItem.price;
      updatedItem.totalPrice = newTotalPrice;

      console.log("newTotalPrice///////////////////////////"+newTotalPrice)

      // Log the new total price for debugging
      console.log('New total price for item ID:', id, 'is:', newTotalPrice);

      // Save the updated cart
      await cart.save();

      // Respond with the new total price
      res.json({ success: true, newTotalPrice });
  } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


//////////////////////////////////////////////////////////////////////
module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  
};
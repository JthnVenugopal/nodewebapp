const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const Wishlist = require("../../models/wishlistSchema");


const addToWishlist = async (req, res) => {
  try {

      console.log("////////////////////////addToWishlist////////////////////////////");

      const { productId, variantId, color, name } = req.body;
      const userId = req.session.user?.id || req.user?.id;

      if (!productId || !variantId || !color || !name || !userId) {
          return res.status(400).send("Missing required fields.");
      }

      const productData = await Product.findById(productId);
      const variantData = await Variant.findById(variantId);

      // console.log("VariantData/////////////////////////"+variantData);
      
      if (!productData || !variantData) {
          return res.status(404).send("Product or Variant not found.");
      }

      const wishlist = await Wishlist.findOne({ userId });

      if (wishlist) {  // Check if the product and variant already exist in the wishlist
          const existingItem = wishlist.items.find(
              (item) => item.variant._id.toString() === variantId.toString()
          );

          if (existingItem) {
              return res.status(400).send("Variant already in wishlist.");
          }

          // Add new product and variant data to existing wishlist
          wishlist.items.push({
              product: productData,
              variant: variantData,
          });
          wishlist.updatedAt = Date.now();
          await wishlist.save();

      } else {
          // Create a new wishlist
          const newWishlist = new Wishlist({
              userId,
              items: [
                  {
                      product: productData,
                      variant: variantData,
                      price: productData.price,
                  },
              ],
          });
          await newWishlist.save();
      }

      res.json({ success: true, message: 'Added to wishlist', redirectUrl: '/wishlist' });
    
    

  } catch (error) {
      console.error("Error in addToWishlist:", error);
      res.status(500).send("An error occurred while adding to the wishlist.");
  }
};


///////////////////////////////////////////////////////////////////////////////


// const loadWishlist = async (req, res) => {
//   try {
//       console.log("-------------------------loadWishlist---------------------------");

//       const userId = req.session.user?.id || req.user?.id;

//       if (!userId) {
//           return res.status(401).send("Unauthorized. Please log in.");
//       }

//       const wishlist = await Wishlist.findOne({ userId }).populate("items.product items.variant");

//       // console.log("Wishlist data : //////////////////"+wishlist)


//       const {items}  = wishlist

//       // console.log("items data : //////////////////"+items)

//       console.log("////////////////"+wishlist.items.length);

//       if (wishlist.items.length === 0) {
//         res.redirect('empty-wishlist')
//     } else{

//       const [{ product, variant }] = wishlist.items;

//     }




        
      
    
    
      

//       // console.log("Product Data////////////////"+JSON.stringify(product));
//       // console.log("Variant Data////////////////"+JSON.stringify(variant));

      


//       if (!wishlist || wishlist.items.length === 0) {
//           return res.render("wishlist", {
//               user: req.session.user || req.user,
//               items: [],
//               message: "Your wishlist is empty.",
//           });
//       }

//       res.render("wishlist", {
//           user: req.session.user || req.user,
//           items: items,
//           product : product,
//           variant : variant,

//       });

//   } catch (error) {
//       console.error("Error in loadWishlist:", error);
//       res.status(500).send("An error occurred while loading the wishlist.");
//   }
// };


const loadWishlist = async (req, res) => {
  try {
    console.log("-------------------------loadWishlist---------------------------");

    const userId = req.session.user?.id || req.user?.id;

    if (!userId) {
      return res.status(401).send("Unauthorized. Please log in.");
    }

    const wishlist = await Wishlist.findOne({ userId }).populate("items.product items.variant");

    if (!wishlist || wishlist.items.length === 0) {
      return res.render("wishlist", {
        user: req.session.user || req.user,
        items: [],
        message: "Your wishlist is empty."
      });
    }

    // For debug purposes
    console.log("Wishlist data:", wishlist);

    const { items } = wishlist;
    console.log("Items data:", items);

    // Destructuring to get product and variant from the first item
    const [{ product, variant }] = items;

    // For debug purposes
    console.log("Product Data:", JSON.stringify(product));
    console.log("Variant Data:", JSON.stringify(variant));

    // Render the wishlist page with the fetched data
    res.render("wishlist", {
      user: req.session.user || req.user,
      items: items,
      product: product,
      variant: variant
    });

  } catch (error) {
    console.error("Error in loadWishlist:", error);
    res.status(500).send("An error occurred while loading the wishlist.");
  }
};


//////////////////////////////////////////////////////////////////////////////


const removeFromWishlist = async (req, res) => {
  try {
    console.log("////////////////////// removeFromWishlist /////////////////////////");

    // Extract user and userId safely
    const user = req.session?.user || req.user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const userId = user.id;

    const { wishlistItemId } = req.body;

    console.log("Wishlist Item ID:", wishlistItemId);

    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      console.log("No matching wishlist found for the user.");
      return res.status(404).json({ error: "Wishlist not found" });
    }

    // Find the item in the wishlist
    const itemIndex = wishlist.items.findIndex(item => item._id.toString() === wishlistItemId);
    if (itemIndex === -1) {
      console.log("Wishlist item not found.");
      return res.status(404).json({ error: "Wishlist item not found" });
    }

    // Remove the item from the wishlist
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    console.log("Wishlist item removed successfully");

    // Redirect or send a success response
    res.redirect("/wishlist");
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist
};

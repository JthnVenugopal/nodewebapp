const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Brand = require("../../models/brandSchema");
const Variant = require("../../models/variantSchema");

const loadShoppingPage = async (req, res) => { 
  try { 
    const user = req.session.user || req.user;

    // Fetch all products initially
    const products = await Product.find({ isBlocked: false }).populate('variant'); 
    const categories = await Category.find({ isListed: true }); 
    const brands = await Brand.find({ isBlocked: false }); 

    res.render('shop', { 
      user: user,
      products: products,
      categories: categories, 
      brands: brands,
    }); 
  } catch (error) {
    console.error("Error loading shopping page:", error);
    res.status(500).send("Internal Server Error"); 
  } 
};

const filterProduct = async (req, res) => { 
  try { 
    const user = req.session.user || req.user; // Ensure user is fetched correctly

    // Extract filter criteria from the request body
    const { category, brand, minPrice, maxPrice, sort, search } = req.body; 

    // Build the filter object
    let filter = { isBlocked: false }; // Ensure only unblocked products are included

    // Filter by category if provided
    if (category) { 
      filter.category = category; // Assuming category is an ObjectId 
    }

    // Filter by brand if provided
    if (brand) { 
      filter.brand = brand; // Assuming brand is an ObjectId 
    }

    // Filter by price range if provided
    if (minPrice || maxPrice) { 
      filter.price = {}; 
      if (minPrice) { 
        filter.price.$gte = parseFloat(minPrice); // Ensure it's a number 
      } 
      if (maxPrice) { 
        filter.price.$lte = parseFloat(maxPrice); // Ensure it's a number 
      } 
    }

    // Search functionality
    if (search) { 
      filter.productName = { $regex: search, $options: 'i' }; // Case-insensitive search 
    }

    // Fetch filtered products with sorting
    let productsQuery = Product.find(filter).populate('variant'); 

    // Sorting logic
    if (sort) { 
      const sortOptions = {}; 
      switch (sort) { 
        case 'popularity': 
          sortOptions.popularity = -1; // Descending 
          break; 
        case 'priceAsc': 
          sortOptions['variant.salePrice'] = 1; // Ascending 
          break; 
        case 'priceDesc': 
          sortOptions['variant.salePrice'] = -1; // Descending 
          break; 
        case 'averageRating': 
          sortOptions.averageRating = -1; // Descending 
          break; 
        case 'nameAsc': 
          sortOptions.productName = 1; // Ascending 
          break; 
        case 'nameDesc': 
          sortOptions.productName = -1; // Descending 
          break; 
        default: 
          break; 
      } 
      productsQuery = productsQuery.sort(sortOptions); 
    } 

    // Execute the query
    const products = await productsQuery.lean(); // Use lean() for better performance 

    // Fetch categories and brands for the filter form
    const categories = await Category.find({ isListed: true }); 
    const brands = await Brand.find({ isBlocked: false }); 

    // Render the shop page with filtered products and available categories and brands
    res.render('shop', { 
      user: user, 
      products: products, 
      categories: categories, 
      brands: brands, 
    }); 
  } catch (error) { 
    console.error("Error filtering products:", error); 
    res.status(500).send("Internal Server Error"); 
  } 
};

module.exports = {
  loadShoppingPage,
  filterProduct,
};
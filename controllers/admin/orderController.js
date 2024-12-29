const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");

/////////////////////////////////////////////////

// const getOrders = async (req, res) => {
//     if (req.session.admin) {
//         try {
//             const page = parseInt(req.query.page) || 1;
//             const limit = 5;
//             const skip = (page - 1) * limit;

//             const totalOrders = await Order.countDocuments();
//             const totalPages = Math.ceil(totalOrders / limit);

//             const orders = await Order.find()
//             .sort({ createdOn: -1 })
//             .populate('user') 
//             .populate('address')          
//             .populate('orderedItems.product')
//             .skip(skip) 
//             .limit(limit);

            
//             res.render("adminOrder", {
//                 orders: orders,
//                 totalPages,
//                 currentPage: page
//             });
//         } catch (error) {
//             console.error('Error loading orders:', error);
//             res.redirect("/admin/pageerror");
//         }
//     } else {
//         res.redirect("/admin/login");
//     }
// };

const getOrders = async (req, res) => {
    if (req.session.admin) {
        try {
            // Get the current page from query params, default to 1 if not provided
            const page = parseInt(req.query.page) || 1;
            const limit = 5; // Number of orders to display per page
            const skip = (page - 1) * limit; // Calculate the number of documents to skip

            // Get the total count of orders
            const totalOrders = await Order.countDocuments();

            // Calculate the total number of pages
            const totalPages = Math.ceil(totalOrders / limit);

            // Fetch the orders from the database with sorting, pagination, and population of references
            const orders = await Order.find()
                .sort({ createdAt: -1 }) // Sort orders by creation date in descending order
                .populate('user') // Populate user details in the order
                .populate('address') // Populate address details in the order
                .populate('orderedItems.product') // Populate product details in the ordered items
                .skip(skip) // Skip the appropriate number of documents
                .limit(limit); // Limit the results to the defined number of orders per page

            // Render the adminOrder view with the fetched orders and pagination details
            res.render("adminOrder", {
                orders: orders,
                totalPages,
                currentPage: page
            });
        } catch (error) {
            console.error('Error loading orders:', error);
            res.redirect("/admin/pageerror"); // Redirect to an error page in case of an exception
        }
    } else {
        res.redirect("/admin/login"); // Redirect to the admin login page if the session is not an admin
    }
};

/////////////////////////////////////////////////

const updateOrderStatus = async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: "Unauthorized. Please log in as an admin." });
    }

    try {
        const { orderId, status } = req.body;

        if (!orderId || typeof orderId !== 'string' || !status || typeof status !== 'string') {
            console.error("Invalid orderId or status");
            return res.status(400).json({ message: "Order ID and status are required and must be strings." });
        }

        const updatedOrder = await Order.findOneAndUpdate({orderId:orderId}, { status }, { new: true });

        if (!updatedOrder) {
            console.error("Order not found"); 
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: "Order status updated successfully", updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error); 
        res.status(500).json({ message: "An error occurred while updating the order status" });
    }
};

/////////////////////////////////////////////////

const getAdminOrderDetails = async (req, res) => {
    if(req.session.admin){
        try {
            const orderId = req.query.id; 
    
            
            if (!orderId) {
                return res.status(400).send("Order ID is required.");
            }
    
           
            const order = await Order.findById(orderId)
                .populate(
                    'orderedItems.product',
                );
    
            if (!order) {
                return res.status(404).send("Order not found.");
            }
    
            
            const addressDoc = await Address.findOne({ userId: order.user }); 
            
           
            const address = addressDoc.address.filter(
                (addr) => addr._id.toString() === order.address.toString()
            );
    
            res.render('adminOrderDetails', { order, address });
        } catch (error) {
            console.error("Error fetching admin order details:", error);
            res.redirect('/pageNotFound'); 
        }
    }
};


////////////////////////////////////////////////////
module.exports = {
    getOrders,
    updateOrderStatus,
    getAdminOrderDetails,
    

};
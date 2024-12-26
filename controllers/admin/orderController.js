const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");

/////////////////////////////////////////////////

const getOrders = async (req, res) => {
    if (req.session.admin) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const skip = (page - 1) * limit;

            const totalOrders = await Order.countDocuments();
            const totalPages = Math.ceil(totalOrders / limit);

            const orders = await Order.find()
            .sort({ createdOn: -1 })
            .populate('user') 
            .populate('address')          
            .populate('orderedItems.product')
            .skip(skip) 
            .limit(limit);

            
            res.render("adminOrder", {
                orders: orders,
                totalPages,
                currentPage: page
            });
        } catch (error) {
            console.error('Error loading orders:', error);
            res.redirect("/admin/pageerror");
        }
    } else {
        res.redirect("/admin/login");
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

/////////////////////////////////////////////////

const getSalesReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate, page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10
        let matchCriteria = { status: "Delivered" };

        // Determine the date range based on filterType
        if (filterType === 'salesToday') {
            const today = new Date();
            matchCriteria.createdOn = {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            };
        } else if (filterType === 'salesWeekly') {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            matchCriteria.createdOn = {
                $gte: startOfWeek,
                $lt: new Date()
            };
        } else if (filterType === 'salesMonthly') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            matchCriteria.createdOn = {
                $gte: startOfMonth,
                $lt: new Date()
            };
        } else if (filterType === 'salesYearly') {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            matchCriteria.createdOn = {
                $gte: startOfYear,
                $lt: new Date()
            };
        } else if (startDate && endDate) {
            matchCriteria.createdOn = {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            };
        }

        // Get total count of records
        const totalCount = await Order.countDocuments(matchCriteria);
        const totalPages = Math.ceil(totalCount / limit);

        // Fetch the sales report with pagination
        const salesReport = await Order.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdOn" } },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }, // Sort by date
            { $skip: (page - 1) * limit }, // Skip records for pagination
            { $limit: limit } // Limit the number of records returned
        ]);

        res.render('salesReport', { salesReport, filterType, startDate, endDate, totalPages, currentPage: page, limit });
        
    } catch (error) {
        console.error("Error fetching sales report:", error);
        res.redirect('/pageNotFound');
    }
}

/////////////////////////////////////////////////////////////
module.exports = {
    getOrders,
    updateOrderStatus,
    getAdminOrderDetails,
    getSalesReport,

};
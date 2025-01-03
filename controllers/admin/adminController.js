const User = require("../../models/userSchema");
const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const Order = require("../../models/orderSchema");

const pageerror = async (req,res) => {
    res.render("admin-error")
}

//--------------------------------------------

const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    res.render("admin-login",{message:null})
}

const login = async (req,res) => {
    try {
        const {email,password} = req.body;
        const admin = await User.findOne({email,isAdmin:true})
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin = true;
                req.session.save();
                return res.redirect("/admin")
            }else{
                return res.redirect("/admin/login")
            }
        }else{
            return res.redirect("/admin/login")
        }
    } catch (error) {
        console.log("login error",error)
        return res.redirect("/pageerror")
    }
}


//-------------------------------------------------

const getCategorySalesData = async (startDate, endDate) => {
    console.log("/////////getCategorySalesData//////////");
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    const pipeline = [
        {
            $match: {
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        { $unwind: "$orderedItems" },
        {
            $lookup: {
                from: 'products',
                localField: 'orderedItems.product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: "$productInfo" },
        {
            $group: {
                _id: "$productInfo.category",
                totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        { $unwind: "$categoryInfo" },
        {
            $project: {
                category: "$categoryInfo.name",
                totalSales: 1
            }
        },
        { $sort: { totalSales: -1 } }
    ];

    try {
        const result = await Order.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error('Error in getCategorySalesData:', error);
        throw error;
    }
};

const getPaymentMethodsData = async (startDate, endDate) => {
    console.log("/////////getPaymentMethodsData//////////");

    const pipeline = [
        {
            $match: {
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        {
            $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ];

    try {
        const result = await Order.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error('Error in getPaymentMethodsData:', error);
        throw error;
    }
};

const getTopSellingItems = async (type, limit, startDate, endDate) => {
    console.log("/////////getTopSellingItems//////////");

    let groupBy, lookupField, nameField;

    switch (type) {
        case 'product':
            groupBy = '$orderedItems.product';
            lookupField = 'products';
            nameField = 'productName';
            break;
        case 'category':
            groupBy = '$productInfo.category';
            lookupField = 'categories';
            nameField = 'name';
            break;
        default:
            throw new Error(`Unsupported type: ${type}`);
    }

    const pipeline = [
        {
            $match: {
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        { $unwind: '$orderedItems' },
        {
            $lookup: {
                from: 'products',
                localField: 'orderedItems.product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' },
        {
            $group: {
                _id: groupBy,
                totalQuantity: { $sum: '$orderedItems.quantity' },
                totalRevenue: { $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] } }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: lookupField,
                localField: '_id',
                foreignField: '_id',
                as: 'details'
            }
        },
        { $unwind: '$details' },
        {
            $project: {
                _id: 1,
                totalQuantity: 1,
                totalRevenue: 1,
                name: `$details.${nameField}`
            }
        }
    ];

    try {
        const result = await Order.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error(`Error in getting top selling ${type}:`, error);
        throw error;
    }
};

const loadDashboard = async (req, res) => {
    try {
        console.log("/////////loadDashboard//////////");
        console.log("req.query/////", req.query.filter);

        const filter = req.query.filter || 'yearly';
        const customStartDate = req.query.startDate;
        const customEndDate = req.query.endDate;

        console.log(customStartDate, customEndDate);

        let startDate, endDate;
        const now = new Date();

        switch (filter) {
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'weekly':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'daily':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                startDate = new Date(customStartDate);
                endDate = new Date(customEndDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        }

        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        const categorySalesData = await getCategorySalesData(startDate, endDate);
        const paymentMethodsData = await getPaymentMethodsData(startDate, endDate);

        const topProducts = await getTopSellingItems('product', 10, startDate, endDate);
        const topCategories = await getTopSellingItems('category', 10, startDate, endDate);

        const chartData = {
            categorySalesData: categorySalesData.length ? categorySalesData : [{ category: 'No Data', totalSales: 0 }],
            paymentMethodsData: paymentMethodsData.length ? paymentMethodsData : [{ _id: 'No Data', count: 0 }],
        };

        res.render("dashboard", {
            ...chartData,
            topProducts,
            topCategories,
            filter,
            customStartDate: formatDate(startDate),
            customEndDate: formatDate(endDate)
        });
    } catch (error) {
        console.log("Unexpected error during loading dashboard", error);
        res.status(500).send("An error occurred while loading the dashboard");
    }
};


//-----------------------------------------
const logout = async (req,res) => {
    try {
        
        req.session.destroy((err)=>{
            if(err){
                console.log("Error destroying Session",err);
                return res.redirect("/admin/pageerror")
            }
            res.redirect("/admin/login")
        })

    } catch (error) {
        console.log("Unexpected error during logout",error);
        res.redirect("/admin/pageerror");
    }
}


//-----------------------------------------
module.exports = {
  loadLogin,
  login,
  loadDashboard,
  pageerror,
  logout

}
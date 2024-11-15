
const User = require("../../models/userSchema");
//---------------------------------------------------------------------
const customerInfo = async (req,res) => {
    try {
        const search = ""; //search button 
        if(req.query.search){
            search = req.query.search;
        }
        let page = 1;
        if(req.query.page){
            page = req.query.page;
        } 
        const limit = 3;// 3 users in one pagination 
        const userData = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ],
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();
//---------------------------------------------------------------------
        const count = await User.find({ // to count total pages
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ],
        }).countDocuments();

        res.render("customers", { 
            data: userData, 
            totalPages: Math.ceil(count / limit), 
            currentPage: parseInt(page) 
        })


    } catch (error) {
        console.error("Error fetching customer data:", error);
        res.status(500).send("Internal Server Error");
    }
}
//---------------------------------------------------------------

const customerBlocked = async (req,res)=>{
    try {
        let id = req.query.id;
        // const objectId = mongoose.Types.ObjectId(id);
        await User.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/users");
    } catch (error) {
        res.redirect("/pageerror")
    }
}

//-----------------------------------------------------------------

const customerunBlocked = async (req,res)=>{
    try {
        let id = req.query.id;
        // const objectId = mongoose.Types.ObjectId(id);
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/users");
    } catch (error) {
        res.redirect("/pageerror")
    }
}


//------------------------------------------------------------------
module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked
}
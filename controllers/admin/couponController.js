const Coupon = require("../../models/couponSchema");
const mongoose = require("mongoose");


const loadCoupon = async(req,res) =>{
  try {
    
    console.log("loadCoupon///////////////////");
    
    const findCoupons = await Coupon.find({})

    console.log("findCoupons///////////////////"+findCoupons)
    
    return res.render("coupon",{
            coupons : findCoupons,
    });


  } catch (error) {
    return res.redirect("/pageerror");
    console.log(error)
  }
}

////////////////////////////////////////////////

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      minPurchaseAmount,
      maxPurchaseAmount,
      startDate,
      endDate,
      discountType,
      discountValue,
      description,
      usageLimit,
      status
    } = req.body;

    // Server-side validation
    if (!code || !minPurchaseAmount || !maxPurchaseAmount || !startDate || !endDate || 
        !discountType || !discountValue || !description || !usageLimit || !status) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: "End date must be after start date." });
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(), // Ensure code is uppercase
      minPurchaseAmount: parseFloat(minPurchaseAmount),
      maxPurchaseAmount: parseFloat(maxPurchaseAmount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      discountType,
      discountValue: parseFloat(discountValue),
      description,
      usageLimit: parseInt(usageLimit),
      usedCount: 0, // Initialize usedCount to 0
      status
    });

    await newCoupon.save();
    return res.redirect("/admin/coupon");

  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ error: "An error occurred while creating the coupon." });
  }
};

///////////////////////////////////////////////////

const editCoupon = async (req, res) => {
  try {

    const id = req.query.id;
    const findCoupon = await Coupon.findOne({ _id: id }); 


    // console.log("findCoupon///////////////////"+findCoupon)

    res.render("editCoupon", {
      findCoupon,        

    
    })

  }
  catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ error: "An error occurred while editing the coupon." });
  }
}

/////////////////////////////////////////////////



const updateCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    const oid = new mongoose.Types.ObjectId(couponId);
    
    // Check if the coupon exists
    const selectedCoupon = await Coupon.findOne({ _id: oid });
    if (!selectedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    // Prepare the update data
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    // Update the coupon
    const updatedCoupon = await Coupon.updateOne(
      { _id: oid },
      {
        $set: {
          code: req.body.couponCode,
          startDate: startDate,
          endDate: endDate,
          discountType: req.body.discountType,
          discountValue: parseInt(req.body.discountValue),
          usageLimit: parseInt(req.body.usageLimit),
          description: req.body.description,
          minPurchaseAmount: parseInt(req.body.minPurchaseAmount),
          maxPurchaseAmount: parseInt(req.body.maxPurchaseAmount),
        },
      }
    );

    console.log("updatedCoupon///////////////////"+JSON.stringify(updatedCoupon));
    

    // Check if the update was successful
    if (updatedCoupon.modifiedCount > 0) {
      return res.status(200).json({ success: true, message: "Coupon updated successfully." });
    } else {
      return res.status(400).json({ success: false, message: "Coupon not updated." });
    }
  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({ success: false, message: "An error occurred while updating the coupon." });
  }
};



///////////////////////////////////////////////


const deleteCoupon = async (req, res) => {
  try {
      const { id } = req.body; // Get the coupon ID from the request body

      const result = await Coupon.findByIdAndDelete(id);

      if (!result) {
          return res.status(404).json({ message: "Coupon not found." });
      }

      return res.status(200).json({ message: "Coupon deleted successfully." });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "An error occurred while deleting the coupon." });
  }
};


////////////////////////////////////////////////

module.exports = {
  loadCoupon,
  createCoupon,
  editCoupon,
  updateCoupon,
  deleteCoupon,


}
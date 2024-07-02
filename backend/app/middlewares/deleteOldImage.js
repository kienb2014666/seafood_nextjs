const mongoose = require('mongoose');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const cloudinary = require('cloudinary').v2;

const deleteOldImage = async (req, res, next) => {
  const { cid } = req.params;
  if (!mongoose.Types.ObjectId.isValid(cid)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Category ID',
    });
  }

  try {
    const currentCategory = await Category.findById(cid);
    console.log('Current Category:', currentCategory);
    if (currentCategory && currentCategory.image) {
      console.log('Deleting old image with public_id:', currentCategory.image.public_id);
      const result = await cloudinary.uploader.destroy(currentCategory.image.public_id);
      console.log('Old image deleted from Cloudinary:', result);
    }
    next();
  } catch (error) {
    console.error('Error in deleteOldImage middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the old image',
      error: error.message,
    });
  }
};
const deleteOldImageProduct = async (req, res, next) => {
  const { cid } = req.params;
  if (!mongoose.Types.ObjectId.isValid(cid)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Category ID',
    });
  }

  try {
    const currentProduct = await Product.findById(cid);
    console.log('Current Product:', currentProduct);
    if (currentProduct && currentProduct.thumb) {
      console.log('Deleting old image with public_id:', currentProduct.thumb.public_id);
      const result = await cloudinary.uploader.destroy(currentProduct.thumb.public_id);
      console.log('Old image deleted from Cloudinary:', result);
    }
    next();
  } catch (error) {
    console.error('Error in deleteOldImage middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the old image',
      error: error.message,
    });
  }
};


module.exports = { deleteOldImage, deleteOldImageProduct };

const { query } = require('express');
const Product = require('../models/product.model');
const asyncHandler = require('express-async-handler');
makeSKU = require('uniqid');

const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description, category, origin, status, specifications, variant } = req.body;

  const thumb = req.files && req.files.thumb && req.files.thumb[0] ? {
    url: req.files.thumb[0].path,
    public_id: req.files.thumb[0].filename
  } : null;

  const images = req.files && req.files.images ? req.files.images.map(el => ({
    url: el.path,
    public_id: el.filename
  })) : [];

  if (thumb) req.body.thumb = thumb;
  if (images.length) req.body.images = images;

  if (!(name && price && description && category && origin && status && specifications && variant)) {
    return res.status(400).json({ success: false, message: 'Missing inputs' });
  }
  const newProduct = await Product.create(req.body);
  return res.status(200).json({
    success: !!newProduct,
    message: newProduct ? 'Product added successfully' : 'Product addition failed'
  });
});
// add variant
const addVariant = asyncHandler(async(req, res) => {
  const { variant, price, title, } = req.body;
  const {pid} = req.params;
  const thumb = req.file ? {
    url: req.file.path,
    public_id: req.file.filename
  } : null;

  if (thumb) req.body.thumb = thumb;
  if (!(title && price && variant)) {
    return res.status(400).json({ success: false, message: 'Missing inputs' });
  }
  const addVariant = await Product.findByIdAndUpdate(
    pid,
    {
        $push: {
            variants: {
                sku: makeSKU().toUpperCase(),
                title,
                price,
                variant,
                thumb,
            },
        },
    },
    { new: true }
);
  return res.status(200).json({
    success: addVariant ? true : false,
    mes: addVariant ? 'Updated variant successfully' : 'Cannot update variant!'
  });
  

});
const getProduct = asyncHandler(async(req, res) => {
  const  {pid} = req.params;
  const product = await Product.findById(pid).populate({
    path: 'ratings',
    populate: {
      path: 'postedBy',
      select: 'name'
    }
  });
  return res.status(200).json({
    success: product ? true : false,
    data: product ? product : 'Not data'
  });
  

});

const getAllProduct = asyncHandler(async(req, res) => {
  const queries = {...req.query};
  // Tách các trường đặc biệt ra khỏi query
  const excludeFields = ['limit', 'sort', 'page', 'fields'];
  excludeFields.forEach(el => delete queries[el])

  // Định dạng lại các operatirs cho đúng cú pháp của moogose
  let queryString = JSON.stringify(queries);
  queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
  const  formatQueries = JSON.parse(queryString);

  // Filtering 
  let queryObject = {}
  if(queries?.q){
    delete formatQueries.q;
    queryObject = {
      $or: [
        {name: {$regex: queries.q, $options: 'i'}},
        {category: {$regex: queries.q, $options: 'i'}},
      ]
    }
  }
  const qr = {...formatQueries, ...queryObject};

  let queryCommand = Product.find(qr);

  //sorting
  if(req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    queryCommand = queryCommand.sort(sortBy);
  }
  // Field Limiting
  if(req.query.fields){
    const fields = req.query.fields.split(',').join(' ');
    queryCommand = queryCommand.select(fields);
  }
  //
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;
  queryCommand = queryCommand.skip(skip).limit(limit);

  // Execute  \query
  const queryExecute = await queryCommand.exec();
  const counts = await Product.countDocuments(formatQueries);
  return res.status(200).json({
      success: queryExecute.length > 0,
      data: queryExecute,
      counts
  });
});

  
const updateProduct = asyncHandler(async(req, res) => {
  const {pid} = req.params;
  const thumb = req.files && req.files.thumb && req.files.thumb[0] ? {
    url: req.files.thumb[0].path,
    public_id: req.files.thumb[0].filename
  } : null;

  const images = req.files && req.files.images ? req.files.images.map(el => ({
    url: el.path,
    public_id: el.filename
  })) : [];

  if (thumb) req.body.thumb = thumb;
  if (images.length) req.body.images = images;
  const updateProduct =  await Product.findByIdAndUpdate(pid, req.body, {new: true});
  return res.status(200).json({
    success: updateProduct ? true : false,
    mes: updateProduct ? 'Updated Product successfully' : 'Cannot update product!'
  });
  

});

const deleteProduct = asyncHandler(async(req, res) => {
  const {pid} = req.params;
  const deleteProduct =  await Product.findByIdAndDelete(pid);
  return res.status(200).json({
    success: deleteProduct ? true : false,
    mes: deleteProduct ? 'Deleted Product' : 'Cannot delete product!'
  });
  

});
const deleteVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;

  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $pull: { variants: { _id: variantId } } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Variant deleted successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

const ratings = asyncHandler(async(req,res) => {
  const {_id} = req.user;
  const {star, comment, pid} = req.body;
  if(!star || !pid) throw new Error('Missing Inputs!');
  const ratingProduct = await Product.findById(pid);
  const alreadyRating = ratingProduct?.ratings?.find(el => el.postedBy.toString() === _id);
  console.log(alreadyRating);
  if(alreadyRating){
    // update star and comments
    await Product.updateOne({
      ratings: { $elemMatch: alreadyRating}
    }, {
      $set: { "ratings.$.star": star, "ratings.$.comment": comment,"ratings.$.updatedAt": Date.now() }
    }, { new: true});

  }else{
    // add star and commnents
    await Product.findByIdAndUpdate(pid, {
      $push: {ratings: {star, comment, postedBy: _id,  updatedAt: Date.now() }}

    },{new: true} );

  }
  // totals ratings
  const updatedProduct = await Product.findById(pid);
  const ratingCount = updatedProduct.ratings.length;
  const sumRatings = updatedProduct.ratings.reduce((sum, el) =>sum + +el.star, 0)
  updatedProduct.totalRatings = Math.round(sumRatings * 10/ratingCount) / 10;
  await updatedProduct.save();
  return res.status(200).json({
     status:true,
     updatedProduct
  })
})

// upload 
// const uploadImagesProduct = asyncHandler(async (req, res) => {
//   const { pid } = req.params;
//   if(!req.files) throw new Error('Missing Inputs!');
//   const response = await Product.findByIdAndUpdate(pid, {$push: {image:  { $each: req.files.map(el => el.path)}}});
//   res.status(200).json({
//     status: response  ? true : false,
//     updatedProduct: response ? response : 'Cannot upload images product'
//   })
// });
const getCountRatings = asyncHandler(async (req, res) => {
  const oneStarCount = await Product.countDocuments({ totalRatings: { $gte: 0, $lte: 1 } });
  const twoStarCount = await Product.countDocuments({ totalRatings: { $gte: 1, $lte: 2 } });
  const threeStarCount = await Product.countDocuments({ totalRatings: { $gte: 2, $lte: 3 } });
  const fourStartCount = await Product.countDocuments({ totalRatings: { $gte: 3, $lte: 4 } });
  const fiveStartCount = await Product.countDocuments({ totalRatings: { $gte: 4, $lte: 5 } });

  const result = {
      '0-1 sao': oneStarCount,
      '1-2 sao': twoStarCount,
      '2-3 sao': threeStarCount,
      '3-4 sao': fourStartCount,
      '4-5 sao': fiveStartCount,
  };

  res.status(200).json({
      success: result ? true : false,
      data: result
  });
});
const updateCoupon = asyncHandler(async(req, res) => {
  const { pid } = req.params; 
  const { coupon } = req.body; 
    const product = await Product.findById(pid);
    if(coupon > 100) throw Error('Please add discount code below 100');
    product.coupon = coupon;
    const updatedCoupon = await product.save();

    res.status(200).json({
      success: updatedCoupon ? true : false,
      message: updatedCoupon ? 'Added successfully' : "Not added successfully"
    });
})
module.exports = {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  ratings,
  addVariant,
  deleteVariant,
  getCountRatings,
  updateCoupon
  
}
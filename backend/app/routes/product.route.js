const express = require('express');
const products = require('../controllers/product.controller');
const { route } = require('../../app');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');
const {deleteOldImageProduct} = require('../middlewares/deleteOldImage')
const uploader = require('../config/cloudinaryConfig');



const router = express.Router();

router.route('/').post( [verifyAccessToken, isAdmin],
  uploader.fields([
    { name: 'thumb', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]), 
  products.createProduct
);

router.route('/').get( products.getAllProduct);
router.route('/ratings').put(verifyAccessToken, products.ratings);

  
router.route('/:pid').delete([verifyAccessToken, isAdmin],products.deleteProduct);

router.route('/:pid').put([verifyAccessToken, isAdmin],
  uploader.fields(
    [
      {name: 'images', maxCount: 10},
      {name: 'thumb', maxCount: 1}
    ]),products.updateProduct);
router.route('/add-variant/:pid').put([verifyAccessToken, isAdmin],uploader.single('thumb'), products.addVariant);
router.route('/add-coupon/:pid').put( products.updateCoupon);
router.route('/add-variant/:productId/:variantId').delete([verifyAccessToken, isAdmin], products.deleteVariant);
router.route('/count').get([verifyAccessToken, isAdmin],products.getCountRatings);
router.route('/:pid').get(products.getProduct);


module.exports = router;
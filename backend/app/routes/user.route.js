const express = require('express');
const users = require('../controllers/user.controller');
const { route } = require('../../app');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');


const router = express.Router();
router.route('/register').post(users.register);
router.route('/finalregister/:token').get(users.finalregister);
router.route('/login').post(users.login);
router.route('/refreshtoken').post(users.reFreshAccessToken);
router.route('/current').get(verifyAccessToken , users.getCurrent);
router.route('/address').put(verifyAccessToken , users.updateAddress );
router.route('/logout').get( users.logout);
router.route('/forgotpassword').post( users.forgotPassword);
router.route('/resetpassword').put( users.resetPassword);
router.route('/add-cart').put( verifyAccessToken, users.updateCart);
router.route('/update-cart').put( verifyAccessToken, users.updateOneCart);
router.route('/remove-all-cart').delete(verifyAccessToken,users.removeAllCart);
router.route('/remove-cart/:pid').delete( verifyAccessToken, users.removeCart);
router.route('/').get([verifyAccessToken, isAdmin],users.getUsers);
router.route('/get-user/:uid').get(users.getUserId);
router.route('/:uid').delete([verifyAccessToken, isAdmin],users.deleteUsers);
router.route('/current').put(verifyAccessToken,users.updateCurrent);
router.route('/wishlist/:pid').put(verifyAccessToken,users.updateWishList);
router.route('/update-user/:uid').put(users.updateUser);
router.route('/:uid').put([verifyAccessToken, isAdmin],users.updateByAdmin);
router.route('/get-all-order').get(users.getAllUsersWithOrders);



module.exports = router;

// CREATE (POST) + (PUT) - body
// GET + DELETE - query
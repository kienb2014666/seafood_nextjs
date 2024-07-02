const express = require('express');
const categoryController = require('../controllers/category.controller');
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken');
const { deleteOldImage } = require('../middlewares/deleteOldImage');
const uploader = require('../config/cloudinaryConfig');

const router = express.Router();

router.route('/')
    .post([verifyAccessToken, isAdmin], uploader.single('image'), categoryController.createCategory)
    .get(categoryController.getCategories);

router.route('/:cid')
    .get([verifyAccessToken, isAdmin],categoryController.getCategory)
    .put([verifyAccessToken, isAdmin],deleteOldImage, uploader.single('image'),  categoryController.updateCategory)
    .delete([verifyAccessToken, isAdmin],deleteOldImage,categoryController.deleteCategory);
router.route('/:slug').get(categoryController.getCategoryNameBySlug);

module.exports = router;

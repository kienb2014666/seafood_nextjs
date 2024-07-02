const expressAsyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const Order = new  mongoose.Schema({
    products:[{
        product: {type: mongoose.Types.ObjectId, ref: 'Product'},
        quantity: Number,
        variant: String, 
        thumb: String,
        name: String,
        price: Number
    }] ,
    status: {
        type: String,
        default: 'Processing',
        enum: ['Cancelled', 'Processing', 'Delivering', ' Succeed']
    },
    total: {type: Number},
    // coupon: {type: mongoose.Types.ObjectId, ref: 'Coupon'},
    orderBy: {
        type:mongoose.Types.ObjectId, ref: 'user'
    },
    
}, {
  timestamps: true,
});


//Add plugins

module.exports = mongoose.model('Order', Order);
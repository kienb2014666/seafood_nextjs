const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');



const User = new  mongoose.Schema({
  name: {type: String, maxLength:255, require: true},
  password: {type: String, maxLength:255, require: true},
  email: {type: String, maxLength: 255, require: true},
  phone: {type: String, maxLength: 255, require: true},
  address: {type: String, maxLength: 255, require: true },
  role: {
    type: String, 
    enum: [2002, 2004],
    default: 2004,
  },
  cart: [{
    product: { 
      type: mongoose.Types.ObjectId, 
      ref: 'Product' },
    quantity: {type: Number},
    variant:  {type: String},
    price: {type: Number},
    thumb: {type: String},
    name: {type: String}
    
  }],
  wishlist: [{type: mongoose.Types.ObjectId, ref: 'Product'}],
  isBlocked: { type: Boolean, default: false},
  refreshToken: {type: String,},
  passwordChangedAt: {  type: String},
  passwordResetToken: { type: String },
  passwordResetExpires: { type: String},  
  registerToken: { type: String },

}, {
  timestamps: true,
});

User.pre('save', async function(next) {
  if(!this.isModified('password')){
    next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
});
User.methods = {
  isCorrectPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  },
  createPasswordChangeToken: function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000; 
    return resetToken;
  }
}
module.exports = mongoose.model('User', User);

const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
const mongooseDelete = require('mongoose-delete');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String },
  origin: { type: String },
  status: { type: String },
  specifications: { type: String },
  variant: { type: String },
  quantity: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  thumb: {
    url: String,
    public_id: String
  },
  images: [
    {
      url: String,
    }
  ],
  price: { type: Number, required: true },
  slug: { type: String, slug: 'name', unique: true },
  ratings: [
    {
      star: { type: Number },
      postedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
      comment: { type: String },
      updatedAt: {
        type: Date
      }
    }
  ],
  totalRatings: { type: Number, default: 0 },
  variants: [
    {
      sku: String,
      variant: String,
      price: Number,
      thumb: {
        url: String,
        public_id: String
      },
      title: String
    }
  ],
  coupon: {type: Number},
}, {
  timestamps: true,
});

// Add plugins
mongoose.plugin(slug);
ProductSchema.plugin(mongooseDelete, { 
  deletedAt: true,
  overrideMethods: 'all',
});

ProductSchema.virtual('categoryName', {
  ref: 'Category', // Reference to the "Category" collection
  localField: 'category',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Product', ProductSchema);

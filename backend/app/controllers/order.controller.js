const { query } = require('express');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');

const createOrder = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    const { products, total, status } = req.body;
    const response = await Order.create({products, total, orderBy: _id, status});
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product with id ${item.product} not found`);
      if (product.quantity < item.quantity) throw new Error(`Not enough quantity for the product ${product.name}`);
      product.quantity -= item.quantity;
      product.sold += item.quantity;
      await product.save();
    }

    return res.status(200).json({
        success: response ? true: false,
        mes: res ? 'Orders will be shipped soon' : 'Please again'
    })
    
});

const updateStatus = asyncHandler(async(req, res) => {
    const {oid} = req.params;
    const {status} = req.body;
    const response = await Order.findByIdAndUpdate(oid, {status}, {new: true});
    return res.status(200).json({
        success: response ? true : false,
        update: response ? 'Updated successfully' : 'Something went wrong'
    });
});
const getOrderUser = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    const response = await Order.find({orderBy: _id});
    return res.status(200).json({
        success: response ? true : false,
        message: response ? response : 'Cannot get Order'
    })
})
const getOrderAdmin = asyncHandler(async(req, res) => {
    const response = await Order.find();
    return res.status(200).json({
        success: response ? true : false,
        message: response ? response : 'Cannot get Order'
    })
})
const getOrderId = asyncHandler(async(req, res) => {
    const { oid } = req.params;
    const response = await Order.findById(oid);
    return res.status(200).json({
        success: response ? true : false,
        message: response ? response : 'Cannot get Order'
    })
})
// get status
const getCountStatus = asyncHandler(async (req, res) => {
        const processingCount = await Order.countDocuments({ status: 'Processing' });
        const deliveringCount = await Order.countDocuments({ status: 'Delivering' });
        const cancelledCount = await Order.countDocuments({ status: 'Cancelled' });
        const succeedCount = await Order.countDocuments({ status: 'Succeed' });

        const result = {
            Processing: processingCount,
            Delivering: deliveringCount,
            Cancelled: cancelledCount,
            Succeed: succeedCount
        };

        res.status(200).json({
            success: result ? true : false,
            data: result
        });
});
const getTotalAmountByDay = asyncHandler(async (req, res) => {
    const totalsByDay = await Order.aggregate([
        {
          $match: {
            createdAt: { $exists: true } 
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalAmount: { $sum: '$total' }
          }
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: '%m/%d/%Y',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day'
                  }
                }
              }
            },
            totalAmount: { $multiply: ['$totalAmount', 23500] } // Nhân tổng totalAmount với 23.500
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);
      return res.status(200).json({
        success: true ? true : false,
        data: totalsByDay
      });
  });
  const getTotalAmountByMonth = asyncHandler(async (req, res) => {
    const totalsByMonth = await Order.aggregate([
      {
        $match: {
          createdAt: { $exists: true } // Đảm bảo có trường createdAt trong document
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' }, // Nhóm theo tháng trong năm của trường createdAt
            year: { $year: '$createdAt' } // Lấy năm của trường createdAt
          },
          totalAmount: { $sum: '$total' } // Tính tổng của trường total
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          totalAmount: { $multiply: ['$totalAmount', 23500] } // Nhân tổng totalAmount với 23.500
        }
      },
      {
        $sort: { year: 1, month: 1 } // Sắp xếp theo năm và tháng
      }
    ]);
  
    return res.status(200).json({
      success: true,
      data: totalsByMonth
    });
  });
  const getTotalAmountByYear = asyncHandler(async (req, res) => {
    const totalsByYear = await Order.aggregate([
      {
        $match: {
          createdAt: { $exists: true } // Đảm bảo có trường createdAt trong document
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' } // Lấy năm của trường createdAt
          },
          totalAmount: { $sum: '$total' } // Tính tổng của trường total
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          totalAmount: { $multiply: ['$totalAmount', 23500] } // Nhân tổng totalAmount với 23.500
        }
      },
      {
        $sort: { year: 1 } // Sắp xếp theo năm 
      }
    ]);
  
    return res.status(200).json({
      success: true,
      data: totalsByYear
    });
  });
 const getCountOrder = asyncHandler(async(req, res) => {
    const order = await Order.countDocuments();
    return res.status(200).json({
      success: order ? true : false,
      data: order
    })

  })
module.exports = {
    createOrder,
    updateStatus,
    getOrderUser,
    getOrderAdmin,
    getOrderId,
    getCountStatus,
    getTotalAmountByDay,
    getTotalAmountByMonth,
    getTotalAmountByYear,
    getCountOrder
}
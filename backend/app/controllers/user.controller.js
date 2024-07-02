const User = require('../models/user.model');
const Order = require('../models/order.model');
const asyncHandler = require('express-async-handler');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');
const crypto = require('crypto-js');
const makeToken = require('uniqid');

// const register = asyncHandler(async(req, res) =>{
//     const {email, password, name, phone, address} = req.body;
//     if(!email || !password || !name ||!phone)
//     return res.status(400).json({
//         success: false,
//         message: 'Missing inputs'
//     })
//     const user = await User.findOne({email});
//     if(user){
//        throw new Error('User has existed!');
//     }else{
//         const newUser = await User.create(req.body);
//         return res.status(200).json({
//             success: newUser ? true : false,
//             message: newUser ? 'Register is successfully. Please go login' : 'Something went wrong'
//         });
//     }
       
// });
const register = asyncHandler(async(req, res) => {
    const {email, password, name, phone,  address} = req.body;
    if(!email || !password || !name ||!phone ||!address)
        return res.status(400).json({
            success: false,
            message: 'Missing inputs'
        });
        const user = await User.findOne({email});
       if(user) throw new Error('User has existed!');
       else{
        const token = makeToken();
        res.cookie('dataRegister',{ ...req.body, token}, {httpOnly: true, maxAge: 15*60*1000});        
        const html = `Xin vui lòng click vào link dưới đây để hoàn tất quá trình đăng ký. Link này sẽ hết hạn sau 15 phút kể từ bây giờ. 
         <a href=${process.env.URL_SERVER}/api/user/finalregister/${token}>Click here</a>` 
         await sendMail({email, html, subject: 'Hoàn tất đăng ký tài khoản'});
         return res.status(200).json({
            success: true,
            message: 'Please check your email to active account'
         })
        }
})
// const finalregister = asyncHandler(async(req, res) => {
//     const cookie = req.cookies;
//     const {token} = req.params;
//     if(!cookie || cookie?.dataRegister?.token !== token) 
//     res.clearCookie('finalregister');
//     return res.redirect(`${process.env.URL_CLIENT}/finalregister/failed`);
    
//     const newUser = await User.create({
//         email:cookie.dataRegister.email,
//         password:cookie.dataRegister.password,
//         phone:cookie.dataRegister.phone,
//         name:cookie.dataRegister.name,
// });
//     res.clearCookie('finalregister');
//     if(newUser) return res.redirect(`${process.env.URL_CLIENT}/finalregister/success`);
//     else {redirect(`${process.env.URL_CLIENT}/finalregister/failed`); }

// });
const finalregister = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    const { token } = req.params;
    console.log(token);
    console.log(cookie);
    if (!cookie || cookie?.dataRegister?.token !== token)  return res.redirect(`${process.env.URL_CLIENT}/finalregister/failed`);
    res.clearCookie('dataRegister');
    const newUser = await User.create({
        email: cookie?.dataRegister?.email,
        password: cookie?.dataRegister?.password,
        phone: cookie?.dataRegister?.phone,
        name: cookie?.dataRegister?.name,
        address: cookie?.dataRegister?.address,

    });
    console.log(newUser);
    res.clearCookie('dataRegister');
        if (newUser) return res.redirect(`${process.env.URL_CLIENT}/finalregister/success`);
        else return res.redirect(`${process.env.URL_CLIENT}/finalregister/failed`);
        
});

// refresh token -> dùng để cấp mới access token
// Access token -> xác thực, phân quyền người dùng
const login= asyncHandler(async(req, res) =>{
    const {email, password} = req.body;
    if(!email || !password )
    return res.status(400).json({
        success: false,
        message: 'Missing inputs'
    })
   const response = await User.findOne({email});
   if(response && await response.isCorrectPassword(password)){
    // tách password và role ra khỏi response
    const {password, role, refreshToken ,...userData}  = response.toObject(); 
   //tạo access token
    const accessToken = generateAccessToken(response._id, role);
   //tạo refresh token
    const newRefreshToken = generateRefreshToken(response._id);
    // Lưu refresh token vào database
    await User.findByIdAndUpdate(response._id, { newRefreshToken}, {new: true});
    // luu refresh token vào  cookies
    res.cookie('reFreshToken', newRefreshToken, {httpOnly: true, maxAge: 7*24*60*60*1000});

    return res.status(200).json({
        success: userData ? true : false,
        message: userData ? 'Dăng nhập thành công' : 'Tài khoản hoặc mật khẩu không chính xác',
        accessToken,
        userData,
        role
       })
   }else{
      throw new Error('Invalid credentials!'); 
   }
       
});
const getCurrent= asyncHandler(async(req, res) =>{
    
    const {_id} = req.user;
    const user = await User.findById(_id).select('-reFreshToken -password').populate({
        path: 'cart',
        populate: {
            path: 'product',
            select: 'name thumb price'
        }
    });
    return res.status(200).json({
        success: true,
        rs: user ? user : 'User not Found!'
    })
       
});
const getUserId= asyncHandler(async(req, res) =>{
    const {uid} = req.params;
    const user = await User.findById(uid)
    return res.status(200).json({
        success: user ? true : false,
        rs: user
    })      
});

const reFreshAccessToken = asyncHandler(async(req, res) => {
    const cookie = req.cookies;
    console.log(cookie);
    if(!cookie && !cookie.reFreshToken) throw new Error('No refresh token in cookies!');
    
    jwt.verify(cookie.reFreshToken, process.env.JWT_SECRET, async (err, decode) => {
        if(err) throw new Error('Invalid refresh token!');

        const response = await User.findOne({_id: decode._id, refreshToken: cookie.reFreshToken});
        return res.status(200).json({
            success: response ? true : false,
            newAccessToken: response ? generateAccessToken(response._id, response.role) : 'Refresh token not matched' 
        })
    })
}) 
const logout = asyncHandler(async(req, res) => {
    const cookie = req.cookies;
    if(!cookie || !cookie.reFreshToken) throw new Error('No refresh token cookies');
    // Xoas refresh token ở db
    await User.findOneAndUpdate({refreshToken: cookie.reFreshToken}, {refreshToken: ''}, {new: true} )
    // Xóa refresh token ở cookie trình duyệt
    res.clearCookie('reFreshToken', {
        httpOnly: true,
        secure: true
    });
    return res.status(200).json({
        success: true,
        message: 'Logout'
    })
})
// Client send mail
// server check email valid => send mail + password change token
// Client check mai => click link 
// Client send mail include token
// check token
//change password
const forgotPassword = asyncHandler(async(req, res) => {
    const { email } = req.body;
    if (!email) throw new Error('Missing email!');
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found!');
    
    // Tạo reset token và lưu vào cơ sở dữ liệu
    const resetToken = user.createPasswordChangeToken();
    await user.save();

    const html = `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn. Link này sẽ hết hạn sau 15 phút kể từ bây giờ. 
    <a href=${process.env.URL_CLIENT}/reset-password/${resetToken}>Click here</a>`

    const data = {
        email,
        html,
        subject: 'Forgot Password'
    }
    const rs = await sendMail(data);
    return res.status(200).json({
        success: rs? false : true,
        message: rs? 'Please try again' : 'Check your mail'
    });

});
const resetPassword = asyncHandler(async (req, res) =>{
    const {password, token} = req.body;
    if(!password || !token) throw new Error('Missing Inputs!')
    const passwordResetToken = crypto.SHA256(token).toString(crypto.enc.Hex);
    const user = await User.findOne({passwordResetToken, passwordResetExpires:{$gt: Date.now()}});
    if (!user) throw new Error('Invalid reset token')
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordChangedAt = Date.now();
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(200).json({
        success: user ? true : false,
        message: user ? 'Updated password' : 'Something went wrong'
    });

});

const getUsers = asyncHandler(async(req, res) => {
    const queries = {...req.query};
  // Tách các trường đặc biệt ra khỏi query
    const excludeFields = ['limit', 'sort', 'page', 'fields'];
    excludeFields.forEach(el => delete queries[el])

    // Định dạng lại các operatirs cho đúng cú pháp của moogose
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`);
    const  formatQueries = JSON.parse(queryString);

    // Filtering 
    if(queries?.name) formatQueries.name = {$regex: queries.name, $options: 'i'}
    // if(req.query.Search) {
    //     query = {$or: [
    //         {name: {$regex: req.query.Search, $options: 'i'}},
    //         {email: {$regex: req.query.Search, $options: 'i'}}
    //     ]}
    // }
    if(req.query.Search) {
        delete formatQueries.Search;
        formatQueries['$or'] = [
            {name: {$regex: req.query.Search, $options: 'i'}},
            {email: {$regex: req.query.Search, $options: 'i'}},
           
         
        ]
    }
    let queryCommand = User.find(formatQueries);

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
    const counts = await User.countDocuments(formatQueries);
    return res.status(200).json({
        success: queryExecute.length > 0,
        userData: queryExecute,
        counts
    });
})
const deleteUsers = asyncHandler(async(req, res) => {
    const  {uid} = req.params;
    if(!uid) throw new Error('Not Find Id');
    const response = await User.findByIdAndDelete(uid);
    return res.status(200).json({
        success: response ? true : false,
        mes: response ? `User with email ${response.email} deleted` : 'No use delete'
    })
})

const updateCurrent = asyncHandler(async(req, res) => {
    const  {_id} = req.user;
    const {name, email, phone, address} = req.body;
    const data = {name, email, phone, address}
    if(!_id || Object.keys(req.body).length === 0) throw new Error('Missing Input');
    const response = await User.findByIdAndUpdate(_id,data,{new: true}).select('-password -role');
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? `User with email ${response.email} updated` : 'Some thing went wrong'
    })
})
const updateUser = asyncHandler(async(req, res) => {
    const  {uid} = req.params;
    const {name, email, phone, address} = req.body;
    const data = {name, email, phone, address}
    if(!uid || Object.keys(req.body).length === 0) throw new Error('Missing Input');
    const response = await User.findByIdAndUpdate(uid,data,{new: true}).select('-password -role');
    return res.status(200).json({
        success: response ? true : false,
        updateUser: response ? `User with email ${response.email} updated` : 'Some thing went wrong'
    })
})

const updateByAdmin = asyncHandler(async(req, res) => {
    const {uid} = req.params;
    if(Object.keys(req.body).length === 0) throw new Error('Missing Input');
    const response = await User.findByIdAndUpdate(uid, req.body,{new: true}).select('-password -role');
    return res.status(200).json({
        success: response ? true : false,
        mes: response ? `User with email ${response.email} updated` : 'Some thing went wrong'
    })

})

const updateAddress = asyncHandler(async(req, res) => {
    const  {_id} = req.user;
    if(!req.body.address) throw new Error('Missing Input');
    const response = await User.findByIdAndUpdate(_id, {$push: {address: req.body.address}},{new: true});
    return res.status(200).json({
        success: response ? true : false,
        updateAddress: response ? response : 'Cannot update address'
    })
})

const updateCart = asyncHandler(async(req, res) => {
    const {_id} = req.user;
    const {pid, quantity = 1, variant, price, thumb, name} = req.body;
    if(!pid || !quantity || !variant) throw new Error('Missing Inputs!');
    const user = await User.findById(_id).select('cart');
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid && el.variant.toString() === variant);
    if(alreadyProduct){
        const response = await User.updateOne(
            { cart: { $elemMatch: alreadyProduct } },
            { $set: { 'cart.$.quantity': alreadyProduct.quantity + quantity, 'cart.$.variant': variant, 'cart.$.price': price, 'cart.$.thumb': thumb, 'cart.$.name': name  } },
            { new: true }
        );
        return res.status(200).json({
            success: response ? true : false,
            mes: response ?  'Added successfully' : "Not added successfully"
        });
    } else {
        const response = await User.findByIdAndUpdate(
            _id,
            { $push: { cart: { product: pid, quantity, variant, price , thumb, name} } },
            { new: true }
        );
        return res.status(200).json({
            success: response ? true : false,
            mes: response ?  'Added successfully' : "Not added successfully"
        });
    }
});
const updateOneCart = asyncHandler(async(req, res) => {
    const {_id} = req.user;
    const {pid, quantity = 1, variant, price, thumb, name} = req.body;
    if(!pid || !quantity || !variant) throw new Error('Missing Inputs!');
    const user = await User.findById(_id).select('cart');
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid && el.variant.toString() === variant);
    if(alreadyProduct){
        const response = await User.updateOne(
            { cart: { $elemMatch: alreadyProduct } },
            { $set: { 'cart.$.quantity': quantity, 'cart.$.variant': variant, 'cart.$.price': price, 'cart.$.thumb': thumb , 'cart.$.name': name } },
            { new: true }
        );
        return res.status(200).json({
            success: response ? true : false,
            mes: response ?  'Added successfully' : "Not added successfully"
        });
    } else {
        return res.status(404).json({
            success: false,
            mes: 'Not found product in cart'

        });
    }
});
const removeCart = asyncHandler(async(req, res) => {
    const {_id} =req.user;
    const {pid} = req.params;
    const user = await User.findById(_id).select('cart');
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid);
    if(!alreadyProduct){
        return res.status(404).json({
            success: true,
            mes: "No find cart"
        })
    }
    const response = await User.findByIdAndUpdate(_id, {$pull: {cart: {product:pid}}}, {new : true});
        return res.status(200).json({
            success: response ? true : false,
            mes: response ? 'Deleted successfully' : 'Som thing went wrong'
        })

})
const getAllUsersWithOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find({});
        const userOrders = await Promise.all(orders.map(async order => {
            const user = await User.findById(order.orderBy).select('-cart -wishlist -role -password -isBlocked -createdAt -updatedAt');
            if (!user) {
                return null; 
            }
            return {
                user,
                order
            };
        }));
        const filteredUserOrders = userOrders.filter(item => item !== null);

        res.status(200).json({
            success: true,
            data: filteredUserOrders
        });
    } catch (error) {
        console.error('Error fetching users with orders:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
const updateWishList = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const { _id } = req.user;
    const user = await User.findById(_id);
    const alreadyInWishList = user.wishlist?.includes(pid);

    if (alreadyInWishList) {
        const response = await User.findByIdAndUpdate(
            _id,
            { $pull: { wishlist: pid } },
            { new: true }
        );
        return res.status(200).json({
            success: response ? true : false,
            mes: response ? "Removed from favorites list product" : "Delete failed",
        });
    } else {
        const response = await User.findByIdAndUpdate(
            _id,
            { $push: { wishlist: pid } },
            { new: true }
        );
        return res.status(200).json({
            success: response ? true : false,
            mes: response ? "Added from favorites list product" : "Add failed",
        });
    }
});
const removeAllCart = async (req, res) => {
    const {_id}= req.user; 
      const updatedCart = await User.findByIdAndUpdate(
        _id,
        { $set: { cart: [] } },
        { new: true }
      );
      res.status(200).json({ 
        success: updatedCart ? true : false, 
        message: updatedCart
    });
  };

module.exports = {
    register,
    finalregister,
    login,
    getCurrent,
    reFreshAccessToken,
    logout,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUsers,
    updateCurrent,
    updateByAdmin,
    updateAddress,
    updateCart,
    updateOneCart,
    removeCart,
    getAllUsersWithOrders,
    updateUser,
    getUserId,
    updateWishList,
    removeAllCart
}

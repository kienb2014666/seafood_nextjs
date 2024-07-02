
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');
var cookieParser = require('cookie-parser');
const usersRouter = require('./app/routes/user.route');
const productsRouter = require('./app/routes/product.route');
const categoryRouter = require('./app/routes/category.route');
const orderRouter = require('./app/routes/order.route');
const {notFound, errorHandler} = require('./app/middlewares/errHandle');


const app =express();

app.use(cookieParser());
const corsOptions ={
    origin: process.env.URL_CLIENT, 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true,
  }));app.use(express.json());

app.use('/api/user', usersRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productsRouter);
app.use('/api/order', orderRouter);


app.use(notFound);
app.use(errorHandler);


app.get('/', (req, res) => {
    res.json({message: "Welcome to backend web_seafood."});
});

module.exports = app;
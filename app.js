const express = require('express');
const cookieParser = require('cookie-parser');
const router = require('./router/router');
const { checkUser } = require('./middleware/middleware');
const port = 3000;
const app = express();

// set view engine
app.set('view engine','ejs');

// port
app.listen(port);

// middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('*', checkUser);
app.get('/',(req,res)=>{res.render('home')});
app.use(router);
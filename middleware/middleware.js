const express = require('express');
const jwt = require('jsonwebtoken');

module.exports.createToken = (id,email) => {
    return jwt.sign(({id,email}), 'avdo secret', { expiresIn: 840000 * 10 });
}

module.exports.checkUser = (req,res,next) => {
    const token = req.cookies.jwt;

    if(token){
        jwt.verify(token, 'avdo secret', function(err,result){
            if(err){
                console.log(err);
                res.locals.user = null;
                next();
            }
            else{
                res.locals.user = result.email;
                next();
            }
        })
    }
    else{
        res.locals.user = null;
        next();
    }
}
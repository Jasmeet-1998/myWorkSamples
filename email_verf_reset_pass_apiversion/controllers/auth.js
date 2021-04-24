const router=require('express').Router(),
      User=require('../models/Users'),
      jwt=require('jsonwebtoken'),
      bcrypt=require('bcrypt');

// Mailgun config
const mailgun = require("mailgun-js");


// New User Creation After Email Verification Is Done by JWT token appended activation link.
router.post('/newUser',async (req,res) =>{
  try{


    if( !req.body.name|| !req.body.email|| !req.body.password) return res.json({Error:'Please Check Wheather You have provided Name,Email,Password for the New User'});

    // check for duplication
    //const emailExist=await User.findOne({email:req.body.email});
    //if(emailExist) return res.status(400).send('Email Already Exists');

    // Hash the password
    const salt=await bcrypt.genSalt(10);
    const hashPassword=await bcrypt.hash(req.body.password,salt);

    const {name,email,password}=req.body;

    // Creating a unique jwttoken to send for verification of email
    const token=jwt.sign(
      {name,email,password},
      process.env.JWT_ACTIV_TOKEN,
      {expiresIn: '10m'
    });

    //Sending Email via Mailgun
    const DOMAIN = process.env.DOMAIN_MAILGUN;
    const mg = mailgun({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: DOMAIN
    });
    const act_link= `<html><body><a href="${process.env.CLIENT_URL}/activate/${token}">Activate Your Account</a></body></html>`
    console.log(`Trying to Send Mail To ${req.body.name} with Email: ${req.body.email}...`);
    const data = {
      from: 'fromMailgun@hello.com',
      to: req.body.email,
	    subject: 'Account Activation Link',
	    html: act_link
    };
    mg.messages().send(data, function (error, body) {
      if(error){
        console.log('Email Not sent');
        return res.json({
          Error:"Mailgun was not able to send the Email!"
        });
      }
      return res.status(200).send(`Account Activation Link Sent at Email: ${email}! Please Click on that Link to activate your Account.`);
    });

    // // Create new User
    // const user=new User({
    //   name:req.body.name,
    //   email:req.body.email,
    //   password:hashPassword
    // });
    //
    // // Add user to the database
    //
    // const savedUser=await user.save();
    // res.send({user_created:user._id});

  }catch(err){
    console.log(err);
    res.status(400).send(err);
  }
});


module.exports=router;

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
//const passportLocalMongoose = require('passport-local-mongoose');
//const http = require('http');
const ejs = require("ejs");
//app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");

const passport = require('passport');
//const { initialize, passport } = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//const { initializingPasssport } = require('./passportConfig');
const expressSession = require('express-session');
//const connectEnsureLogin = require('connect-ensure-login');

// const crypto = require('crypto');
// const verificationCode = crypto.randomBytes(20).toString('hex');
// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'shahachyut1412@gmail.com',
//     pass: 'shreenathji1412'
//   }
// });
// const verificationLink = 'https://localhost:3000/verify?code=${verificationCode}';

const dbURL = 'mongodb+srv://202001449:ITPROJECT_69@cluster0.dtdhh6b.mongodb.net/passport?retryWrites=true&w=majority'
mongoose.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})
	.then((result) => app.listen(3000, () => console.log('Server started on port 3000')))
	.catch((err) => console.log(err));


const userSchema = new mongoose.Schema({
	name: String,
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	
	followers : [String],
	following : [String],
});
//add new schema followers and following for each user
const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    prf_image: {
        type: String,
        default: 'default.png',
    },
    bg_image: {
        type: String,
        default: 'default.png',
    },
    description: {
        type: String,
        maxlength: 100,
    },
    about: {
        type: String,
        maxlength: 500,
    },
});
const postSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	title: { type: String, required: true },
	description: { type: String, required: true },
});







const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);
const Post = mongoose.model('Post', postSchema);

//const Followers = mongoose.model('Followers', followersSchema);

	
	passport.use(new LocalStrategy(async(username, password, done) => {
		try{
			const user = await User.findOne({username });
			if(!user) return done(null,false);
			let submittedPassword = password;
			let storedPassword = user.password;
			const passwordMatch = await bcrypt.compare(submittedPassword, storedPassword);
			
			if(passwordMatch){
				return done(null, user);
			}
			else{
				return done(null,false);
			}
			
			
		}catch(error){
			return done(error);
		}
	}));
	isAuthenticated = (req, res, next) => {
		if(req.user) return next();
		res.redirect('/login');
	};

	passport.serializeUser((user, done) => done(null, user.id));

	passport.deserializeUser(async(id, done) => {
		try{
			const user = await User.findById(id);
			done(null, user);
		}catch(error){
			done(error);
		}
	});




app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(expressSession({secret: "secret" , resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
	  
	  res.render('index');
});

app.get('/register', (req, res) => {
	  
	  res.render('register');
	  
});

app.get('/login', (req, res) => {
	res.render('login');
});


app.post('/register',async (req, res) => {
	const user = await User.findOne({username : req.body.username});

	if(user) return res.status(400).send("User already registered");
	console.log(req.body);

	// //check password length should be greater than or equal to 8
	// if(req.body.password.length < 8) return res.status(400).send("Password should be greater than or equal to 8 characters");
	// //should contain atleast one uppercase letter
	// if(!req.body.password.match(/[A-Z]/)) return res.status(400).send("Password should contain atleast one uppercase letter");
	// //should contain atleast one special character
	// if(!req.body.password.match(/[!@#$%^&*]/)) return res.status(400).send("Password should contain atleast one special character");

	//verify email

	//encrypt password
	
	const hashedPassword = await bcrypt.hash(req.body.password, 10);
	req.body.password = hashedPassword;
	const newUser = await User.create(req.body);

	
	  
	res.status(201).send(newUser);
	//res.redirect('/verify')

});

app.post('/login',passport.authenticate('local',{failureRedirect:'/register',successRedirect:'/profile'}), (req, res) => {
	
});

// app.get('/profile',isAuthenticated,(req,res)=>{
// 	res.send(req.user);
// });

app.get('/logout',(req,res)=>{
	req.logout(function(err){
		if(err) return next(err);
		res.redirect('/');
	});
	
});
app.get('/follow',isAuthenticated,(req,res)=>{
	res.render('follow');
});
app.get('/unfollow',isAuthenticated,(req,res)=>{
	res.render('unfollow');
});
//add a follower in the followers array of a user
app.post('/follow',async (req,res)=>{
	//get the username of the user who is being followed
	const follwedUser = req.body.username;
	//get the username of the user who is following
	const follower = req.user.username;

	//check if the user is already following the user

	//add the follower in the followers array of the user
	const x = await User.findOneAndUpdate({username : follwedUser},{$push : {followers : follower}},{new : true})
	.then((result)=>{
		;
	})
	.catch((err)=>{
		res.send(err);
	});
	//add the user in the following array of the follower
	const y = await User.findOneAndUpdate({username : follower},{$push : {following : follwedUser}},{new : true})
	.then((result)=>{
		res.send('done');
	})
	.catch((err)=>{
		res.send(err);
	});
});
//unfollow a user
app.post('/unfollow',async (req,res)=>{
	//get the username of the user who is being unfollowed
	const unfollwedUser = req.body.username;
	//get the username of the user who is unfollowing
	const unfollower = req.user.username;

	//delete the unfollower in the followers array of the user
	const Updatedfolloweduser =await User.findOneAndUpdate({username : unfollwedUser},{$pull : {followers : unfollower}},{new : true})
	.then((result)=>{
		;
	})
	.catch((err)=>{
		res.send(err);
	});
	//delete the user in the following array of the unfollower
	const UpdatedfollowedrserUser = await User.findOneAndUpdate({username : unfollower},{$pull : {following : unfollwedUser}},{new : true})
	.then((result)=>{
		res.send('done');
	})
	.catch((err)=>{
		res.send(err);
	});

});
app.get('/profile',isAuthenticated,(req,res)=>{
	res.render('profile');
});
app.post('/profile',async(req,res)=>{
		try {
		  const username  = req.user.username;
		 // const post = await User.findById(username).populate('posts');
		//   if (!user) {
		// 	return res.status(404).json({ msg: 'User not found' });
		//   }
	  
		  // extract required fields from user object
		  const { name, prf_image, bg_image, description, about, followers, following, posts } = user;
	  
		  // extract required fields from posts object
		  const userPosts = posts.slice(0, 2).map(post => {
			const { _id, title, description } = post;
			return { _id, title, description };
		  });
	  
		  const profileData = {
			name,
			profilePicture,
			coverPicture,
			shortBio,
			longBio,
			followers: followers.length,
			following: following.length,
			posts: userPosts
		  };
	  
		  return res.json(profileData);
		} catch (error) {
		  console.error(error.message);
		  return res.status(500).json({ msg: 'Server error' });
		}
});




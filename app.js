if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }

  const express			= require('express');
  const session			= require('express-session');
  const hbs				= require('express-handlebars');
  const mongoose		= require('mongoose');
  const passport		= require('passport');
  const localStrategy	= require('passport-local').Strategy;
  const bcrypt			= require('bcrypt');
  const app				= express();
  const flash           = require('express-flash')
  const methodOverride  = require('method-override')
  
  mongoose.connect(process.env.CONNECTION_STRING);
  
  // Middleware
  app.engine('hbs', hbs.engine({ extname: '.hbs' }));
  app.set('view engine', 'hbs');
  app.use(express.static(__dirname + '/public'));
  app.use(session({
      secret: "verygoodsecret",
      resave: false,
      saveUninitialized: true
  }));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  
  // Passport.js
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.serializeUser(function (user, done) {
      done(null, user.id);
  });
  
  passport.deserializeUser(function (id, done) {
      User.findById(id, function (err, user) {
          done(err, user);
      });
  });


/*function (err, user) {
          if (err) return done(err);
          if (!user) return done(null, false, { message: 'Incorrect username.' });
  
          bcrypt.compare(password, user.password, function (err, res) {
              if (err) return done(err);
              if (res === false) return done(null, false, { message: 'Incorrect password.' });
              
              return done(null, user);
          });*/
  passport.use(new localStrategy((username, password, done) =>{
      User.findOne({ username: username }, new Promise((resolve, reject)=>{
	      if(err) return reject(err);
	      if(!user) return reject(null, false, {message:'Incorrect username.'});

	      bcrypt.compare(password, user.password, function(err, res) {
		      if(err) return reject(err);
		      if(res === false) return reject(null, false, {message: 'Incorrect password.'});

		      resolve(null, true, user);
	      });
      })
	.then((err, user)=> done(null, user))
	.catch((err, failure, message)=>done(err, failure, message)));
  }));
  
  function isLoggedIn(req, res, next) {
      if (req.isAuthenticated()) return next();
      res.redirect('/login');
  }
  
  function isLoggedOut(req, res, next) {
      if (!req.isAuthenticated()) return next();
      res.redirect('/');
  }
  
  // ROUTES
  app.get('/', isLoggedIn, (req, res) => {
      res.render("index", { title: "Home" });
  });
  
  app.get('/login', isLoggedOut, (req, res) => {
      const response = {
          title: "Login",
          error: req.query.error
      }
  
      res.render('login', response);
  });

  app.get('/register', (req,res) => {
    res.render("register", { title: "Register" });
  });

  app.post('/register', async (req,res) => {
    try {
        const hashedPassword = await bcrypt.hash(res.body.password, 10);
        const newUser = new User({
            email: res.body.email,
            password: hashedPassword
        })
        newUser.save();
        console.log('Success');
        res.redirect('/');
    }
    catch {
        console.log('Failure');
        res.redirect('/register')
    }
 
  });

  app.post('/login', passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login?error=true'
  }));
  
  app.get('/logout', function (req, res) {
	req.logout(function(err) {
        if (err) { return next(err)}
        res.redirect('/');
    });
  });
  
  app.listen(3000, () => {
      console.log("Listening on port 3000");
  });

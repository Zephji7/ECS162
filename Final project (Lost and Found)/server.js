// We need many modules

// some of the ones we have used before
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const FormData = require("form-data");
const fs = require('fs');
const request = require('request');

// where to temporily store images
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname+'/images')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
// let upload = multer({dest: __dirname+"/assets"});
let upload = multer({storage: storage});

const ECS162_KEY = '0o3ru1b9y0';
const CLIENT_ID = '467047567449-kaasmv3ielldjrdrs1812hteonsjk635.apps.googleusercontent.com';
const CLIENT_SECRET = 'srF68QucrgJ_j9GI8snuD97r';

// and some new ones related to doing the login process
const passport = require('passport');
// There are other strategies, including Facebook and Spotify
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Some modules related to cookies, which indicate that the user
// is logged in
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');

// Setup passport, passing it information about what we want to do
passport.use(new GoogleStrategy(
  // object containing data to be sent to Google to kick off the login process
  // the process.env values come from the key.env file of your app
  // They won't be found unless you have put in a client ID and secret for 
  // the project you set up at Google
    {
      clientID: CLIENT_ID, //process.env.CLIENT_ID
      clientSecret: CLIENT_SECRET, //process.env.CLIENT_SECRET
      callbackURL: '/auth/accepted',
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo', // where to go for info
      scope: ['profile','email']  // the information we will ask for from Google
    },
  // function to call to once login is accomplished, to get info about user from Google;
  // it is defined down below.
  gotProfile));


// Start setting up the Server pipeline
const app = express();
console.log("setting up pipeline")

// take HTTP message body and put it as a string into req.body
app.use(bodyParser.urlencoded({extended: true}));

// puts cookies into req.cookies
app.use(cookieParser());

// pipeline stage that echos the url and shows the cookies, for debugging.
app.use("/", printIncomingRequest);

// Now some stages that decrypt and use cookies

// express handles decryption of cooikes, storage of data about the session, 
// and deletes cookies when they expire
app.use(expressSession(
  { 
    secret:'bananaBread',  // a random string used for encryption of cookies
    maxAge: 6 * 60 * 60 * 1000, // Cookie time out - six hours in milliseconds
    // setting these to default values to prevent warning messages
    resave: true,
    saveUninitialized: false,
    // make a named session cookie; makes one called "connect.sid" as well
    name: "ecs162-session-cookie"
  }));

// Initializes request object for further handling by passport
app.use(passport.initialize()); 

// If there is a valid cookie, will call passport.deserializeUser()
// which is defined below.  We can use this to get user data out of
// a user database table, if we make one.
// Does nothing if there is no cookie
app.use(passport.session()); 

// currently not used
// using this route, we can clear the cookie and close the session
app.get('/logoff',
  function(req, res) {
    res.clearCookie('google-passport-example');
    res.clearCookie('ecs162-session-cookie');
    res.redirect('/');
  }
);


// The usual pipeline stages

// Public files are still serverd as usual out of /public
app.get('/*',express.static('public'));

// special case for base URL, goes to index.html
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/webpage/index.html');
});

// stage to serve files from /user, only works if user in logged in

// If user data is populated (by deserializeUser) and the
// session cookie is present, get files out 
// of /user using a static server. 
// Otherwise, user is redirected to public splash page (/index) by
// requireLogin (defined below)
app.get('/user/*', requireUser, requireLogin, express.static('.'));

/*app.get('/user/', requireUser, requireLogin, (req, res)=>{
    res.sendFile(__dirname + '/user/seeker-finder.html');
});*/


// Now the pipeline stages that handle the login process itself

// Handler for url that starts off login with Google.
// The app (in public/index.html) links to here (note not an AJAX request!)
// Kicks off login process by telling Browser to redirect to Google.
app.get('/auth/google', passport.authenticate('google'));
// The first time its called, passport.authenticate sends 302 
// response (redirect) to the Browser
// with fancy redirect URL that Browser will send to Google,
// containing request for profile, and
// using this app's client ID string to identify the app trying to log in.
// The Browser passes this on to Google, which brings up the login screen. 


// Google redirects here after user successfully logs in. 
// This second call to "passport.authenticate" will issue Server's own HTTPS 
// request to Google to access the user's profile information with the  	
// temporary key we got from Google.
// After that, it calls gotProfile, so we can, for instance, store the profile in 
// a user database table. 
// Then it will call passport.serializeUser, also defined below.
// Then it either sends a response to Google redirecting to the /setcookie endpoint, below
// or, if failure, it goes back to the public splash page. 
app.get('/auth/accepted', 
  passport.authenticate('google', 
    { successRedirect: '/setcookie', failureRedirect: '/?email=notUCD' }
  )
);

// One more time! a cookie is set before redirecting
// to the protected homepage
// this route uses two middleware functions.
// requireUser is defined below; it makes sure req.user is defined
// The second one makse sure the referred request came from Google, and if so,
// goes ahead and marks the date of the cookie in a property called 
// google-passport-example
app.get('/setcookie', requireUser,
    function(req, res) {
    console.log("setcookie is being called!");
    //console.log(req.get('Referer'));
    //if(req.get('Referer') && req.get('Referer').indexOf("google.com")!=-1){
        // mark the birth of this cookie
        res.cookie('google-passport-example', new Date());
        res.redirect('/user/seeker-finder.html');
    //} else {
    //    console.log("setcookie redirects to index.html!");
    //    res.redirect('/');
    //}
}
);

// uploading image to "http://ecs162.org:3000/images/bxin/" + filename
app.post("/img", upload.single('newImage'), function (request, response) {
    console.log("Recieved",request.file.originalname,request.file.size,"bytes")
    if(request.file) {
        // file is automatically stored in /images,
        // even though we can't see it.
        // We set this up when configuring multer
        console.log('Uploaded file name is ' + request.file.originalname);
        sendMediaStore('/images/' + request.file.originalname,request,response);
    }
    else throw 'error';
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});


// Some functions called by the handlers in the pipeline above


// Function for debugging. Just prints the incoming URL, and calls next.
// Never sends response back. 
function printIncomingRequest (req, res, next) {
    console.log("Serving",req.url);
    if (req.cookies) {
      console.log("cookies",req.cookies)
    }
    next();
}

// function that handles response from Google containint the profiles information. 
// It is called by Passport after the second time passport.authenticate
// is called (in /auth/accepted/)
function gotProfile(accessToken, refreshToken, profile, done) {
    let dbRowID;
    console.log("Google profile",profile);
    if (profile.emails[0].value.includes('@ucdavis.edu')) {
        dbRowID = 1;
    }
    else {
        dbRowID = 2;
        request.get('https://accounts.google.com/o/oauth2/revoke', {
        qs:{token: accessToken }},  function (err, res, body) {
        console.log("revoked token");
        })
    }
    // here is a good place to check if user is in DB,
    // and to store him in DB if not already there. 
    // Second arg to "done" will be passed into serializeUser,
    // should be key to get user out of database.
    // key for db Row for this user in DB table.
    // Note: cannot be zero, has to be something that evaluates to
    // True.  

    done(null, dbRowID); 
}

// Part of Server's sesssion set-up.  
// The second operand of "done" becomes the input to deserializeUser
// on every subsequent HTTP request with this session's cookie. 
// For instance, if there was some specific profile information, or
// some user history with this Website we pull out of the user table
// using dbRowID.  But for now we'll just pass out the dbRowID itself.
passport.serializeUser((dbRowID, done) => {
    console.log("SerializeUser. Input is",dbRowID);
    done(null, dbRowID);
});

// Called by passport.session pipeline stage on every HTTP request with
// a current session cookie (so, while user is logged in)
// This time, 
// whatever we pass in the "done" callback goes into the req.user property
// and can be grabbed from there by other middleware functions
passport.deserializeUser((dbRowID, done) => {
    console.log("deserializeUser. Input is:", dbRowID);
    // here is a good place to look up user data in database using
    // dbRowID. Put whatever you want into an object. It ends up
    // as the property "user" of the "req" object. 
    let userData = {userData: dbRowID};
    done(null, userData);
});

function requireUser (req, res, next) {
    console.log("requireUser is called!");
    if (req.user.userData==2) {
    res.redirect('/?email=notUCD');
    } else {
    console.log("user is",req.user.userData);
    next();
    }
};

function requireLogin (req, res, next) {
    console.log("requireLogin is called!");
    console.log("checking:",req.cookies);
    if (!req.cookies['ecs162-session-cookie']) {
    res.redirect('/');
    } else {
    next();
    }
};

// handles the upload to the media storage API
function sendMediaStore(filename, serverRequest, serverResponse) {
    let apiKey = ECS162_KEY;
    if (apiKey === undefined) {
        serverResponse.status(400);
        serverResponse.send("No API key provided");
    } else {
        // we'll send the image from the server in a FormData object
        let form = new FormData();

        // we can stick other stuff in there too, like the apiKey
        form.append("apiKey", apiKey);
        // stick the image into the formdata object
        form.append("storeImage", fs.createReadStream(__dirname + filename));
        // and send it off to this URL
        form.submit("http://ecs162.org:3000/fileUploadToAPI", function(err, APIres) {
            // did we get a response from the API server at all?
            if (APIres) {
                // OK we did
                console.log("API response status", APIres.statusCode);
                // the body arrives in chunks - how gruesome!
                // this is the kind stream handling that the body-parser
                // module handles for us in Express.
                let body = "";
                APIres.on("data", chunk => {
                    body += chunk;
                });
                APIres.on("end", () => {
                    // now we have the whole body
                    if (APIres.statusCode != 200) {
                        serverResponse.status(400); // bad request
                        serverResponse.send(" Media server says: " + body);
                    } else {
                        serverResponse.status(200);
                        serverResponse.send(body);
                        fs.unlink(__dirname + filename, (err)=>{
                            if(err) throw err;
                            console.log(filename + ' has been deleted!');
                        });
                    }
                });
            } else { // didn't get APIres at all
                serverResponse.status(500); // internal server error
                serverResponse.send("Media server seems to be down.");
            }
        });
    }
}

//====================================Create database=======================================

// This creates an interface to the file if it already exists, and makes the
// file if it does not.
const itemDB = new sqlite3.Database("items.db", err => {
  if (err) {
    console.log(err.message);
  } else {
    console.log("items.db connected");
  }
});

const requestDB = new sqlite3.Database("requests.db", err => {
  if (err) {
    console.log(err.message);
  } else {
    console.log("requests.db connected");
  }
});

// Actual table creation; only runs if database files are not found or empty
// Does the database table exist?
let cmd =
  " SELECT name FROM sqlite_master WHERE type='table' AND name='ItemTable' ";
itemDB.get(cmd, function(err, val) {
  // console.log(err, val);
  if (val == undefined) {
    console.log("No items.db - creating one");
    createItemDB();
  } else {
    console.log("items.db file found");
  }
});

cmd =
  " SELECT name FROM sqlite_master WHERE type='table' AND name='RequestTable' ";
requestDB.get(cmd, function(err, val) {
  // console.log(err, val);
  if (val == undefined) {
    console.log("No requests.db - creating one");
    createRequestDB();
  } else {
    console.log("requests.db file found");
  }
});

function createItemDB() {
  // explicitly declaring the rowIdNum protects rowids from changing if the
  // table is compacted; not an issue here, but good practice
  const cmd =
    "CREATE TABLE ItemTable (rowIdNum INTEGER PRIMARY KEY, title TEXT, category TEXT, description TEXT, image TEXT, dateTime TEXT, location TEXT)";
  itemDB.run(cmd, function(err, val) {
    if (err) {
      console.log("items.db creation failure", err.message);
    } else {
      console.log("Created items.db");
    }
  });
}

function createRequestDB() {
  // explicitly declaring the rowIdNum protects rowids from changing if the
  // table is compacted; not an issue here, but good practice
  const cmd =
    "CREATE TABLE RequestTable (rowIdNum INTEGER PRIMARY KEY, title TEXT, category TEXT, description TEXT, image TEXT, dateTime TEXT, location TEXT)";
  requestDB.run(cmd, function(err, val) {
    if (err) {
      console.log("requests.db creation failure", err.message);
    } else {
      console.log("Created requests.db");
    }
  });
}

//====================================Request Handling=========================================
// Also serve static files out of /images
app.use("/images", express.static("images"));

// Handle a post request containing JSON
app.use(bodyParser.json());

app.post("/saveInfo", function(req, res) {
    /*
  console.log(
    "/saveInfo received: " +
      req.body.isSeeker +
      "\n" +
      req.body.title +
      "\n" +
      req.body.category +
      "\n" +
      req.body.description +
      "\n" +
      req.body.image +
      "\n" +
      req.body.date +
      "\n" +
      req.body.time +
      "\n" +
      req.body.location
  );*/

  // finder inserts into items
  if (req.body.isSeeker == false) {
    let cmd =
      "INSERT INTO ItemTable (title, category, description, image, dateTime, location) VALUES (?,?,?,?,?,?)";
    itemDB.run(
      cmd,
      req.body.title,
      req.body.category,
      req.body.description,
      req.body.image,
      req.body.date + " " + req.body.time,
      req.body.location,
      function(err) {
        if (err) {
          res.status(404).send("Found item not saved");
        } else {
          res.send("Found item saved");
        }
      }
    );

    // DEBUG dump the whole database
    let checkDB = "SELECT * FROM ItemTable";
    itemDB.all(checkDB, function(err, rows) {
      if (err) {
        console.log(err);
      } else {
        console.log(rows);
      }
    });

    // seeker inserts into requests
  } else {
    let cmd =
      "INSERT INTO RequestTable (title, category, description, image, dateTime, location) VALUES (?,?,?,?,?,?)";
    requestDB.run(
      cmd,
      req.body.title,
      req.body.category,
      req.body.description,
      req.body.image,
      req.body.date + " " + req.body.time,
      req.body.location,
      function(err) {
        if (err) {
          res.status(404).send("Request not saved");
        } else {
          res.send("Request saved");
        }
      }
    );

    // DEBUG dump the whole database
    let checkDB = "SELECT * FROM RequestTable";
    requestDB.all(checkDB, function(err, rows) {
      if (err) {
        console.log(err);
      } else {
        console.log(rows);
      }
    });
  }
});

app.post("/searchInfo", function(req, res) {
    /*
  console.log(
    "/searchInfo received: " +
      req.body.isSeeker +
      "\n" +
      req.body.title +
      "\n" +
      req.body.category +
      "\n" +
      req.body.startDate +
      "\n" +
      req.body.startTime +
      "\n" +
      req.body.endDate +
      "\n" +
      req.body.endTime +
      "\n" +
      req.body.location
  );*/

  if (req.body) {
    // finder searches in RequestTable
    if (req.body.isSeeker === false) {
      let cmd =
        "SELECT * FROM RequestTable WHERE title = ? OR category = ? OR location = ? OR (dateTime BETWEEN ? AND ?)";
      requestDB.all(
        cmd,
        req.body.title,
        req.body.category,
        req.body.location,
        req.body.startDate + " " + req.body.startTime,
        req.body.endDate + " " + req.body.endTime,
        function(err, rows) {
          if (err) {
            res
              .status(404)
              .send("Database error, unable to search with given information.");
          } else {
            console.log(rows);
            let result = JSON.stringify(rows);
            res.send(result);
            res.end();
          }
        }
      );

    // seeker searches in ItemTable
    } else {
      let cmd =
        "SELECT * FROM ItemTable WHERE title = ? OR category = ? OR location = ? OR (dateTime BETWEEN ? AND ?)";
      
      itemDB.all(
        cmd,
        req.body.title,
        req.body.category,
        req.body.location,
        req.body.startDate + " " + req.body.startTime,
        req.body.endDate + " " + req.body.endTime,
        function(err, rows) {
          if (err) {
            res
              .status(404)
              .send("Database error, unable to search with given information.");
          } else {
            console.log(rows);
            let result = JSON.stringify(rows);
            res.send(result);
            res.end();
          }
        }
      );
    }
  } else {
    res.status(404).send("Request body not found");
  }
});

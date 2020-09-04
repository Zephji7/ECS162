// server.js
// where your node app starts

// include modules
const express = require('express');

const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const sql = require("sqlite3").verbose();
const url = require('url');
const FormData = require("form-data");


let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname+'/images')    
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
// let upload = multer({dest: __dirname+"/assets"});
let upload = multer({storage: storage});


// begin constructing the server pipeline
const app = express();

//create the database
const postCdDB = new sql.Database("postcards.db");

let cmd = " SELECT name FROM sqlite_master WHERE type='table' AND name='postcard_info' ";
postCdDB.get(cmd, function (err, val) {
  console.log(err, val);
  if (val == undefined) {
    console.log("Database file NOT Found - creation proceeding");
    createpostCdDb();
  } else {
    console.log("Database file Found");
  }
});

function createpostCdDb() {
  const cmd = 'CREATE TABLE postcard_info ( id TEXT PRIMARY KEY UNIQUE, imageSrc TEXT, backgroundColor TEXT, fontFamily TEXT, postMessage TEXT)';
  postCdDB.run(cmd, function(err, val) {
    if (err) {
      console.log("Database FAILED to create", err.message);
    } else {
      console.log("Database creation SUCCESSFUL");
    }
  });
}




// "randomly" generate string
function ranString() {
  let r = Math.random().toString(36).substring(2);
  return r;
}

// generate id
function idGen() {
  let id = "";
  id = id.concat(ranString(), ranString());
  return id;
}

// Serve static files out of public directory
app.use(express.static('public'));

// Also serve static files out of /images
app.use("/images",express.static('images'));

// Handle GET request to base URL with no other route specified
// by sending creator.html, the main page of the app
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/public/creator.html');
});

// Next, the the two POST AJAX queries

// Handle a post request to upload an image. 
app.post('/upload', upload.single('newImage'), function (request, response) {
  console.log("Recieved",request.file.originalname,request.file.size,"bytes")
  if(request.file) {
    // file is automatically stored in /images, 
    // even though we can't see it. 
    // We set this up when configuring multer
    sendMediaStore("/images/"+request.file.originalname, request, response);
    response.end("recieved "+request.file.originalname);
  }
  else throw 'error';
});


// Handle a post request containing JSON
app.use(bodyParser.json());
// gets JSON data into req.body
app.post('/saveDisplay', express.json(), function (req, res) {
  console.log("postCard recieved");
  if (req.body){
    //res.end(req.body.image);
  } else throw 'error';

  let imgSrc = req.body.image;
  let fontFamily = req.body.font;
  let bgColor = req.body.color;
  let postMessage = req.body.message;
  let postId = idGen();
  
  cmd = "INSERT INTO postcard_info ( id, imageSrc, backgroundColor, fontFamily, postMessage) VALUES (?,?,?,?,?) ";
  postCdDB.run(cmd, postId, imgSrc, bgColor, fontFamily, postMessage, function(err) {
    if (err) {
      console("DB insert error", err.message);
    } else {
      //let newId = this.lastID;
      res.end(postId);
    }
  });

/*
  // write the JSON into postcardData.json
  fs.writeFile(__dirname + '/public/postcardData.json', JSON.stringify(req.body), (err) => {
    if(err) {
      res.status(404).send('postcard not saved');
    } else {
      res.send("All well")
    }
  })*/
  
});


// The GET AJAX query is handled by the static server, since the 
// file postcardData.json is stored in /public

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

function handlepostCardList(req, res, next) {
  let postcardId = req.query.id;
  let cmd = "SELECT * FROM postcard_info WHERE id = ?";
  console.log(postcardId)
  postCdDB.get(cmd, postcardId, dataCallback);

  function dataCallback(err, postcardData) {
    if (err) {
      console.log("error: ", err.message);
      next();
    } else {
      res.send(JSON.stringify(postcardData));
      console.log("postcard retrieved SUCCESSFULLY");
    }
  }
}

app.get('/showpostcard*', handlepostCardList);



function sendMediaStore(filename, serverRequest, serverResponse) {
  let apiKey = process.env.ECS162KEY;
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
            fs.unlink(__dirname + filename, function (err) {
              if (err) throw err;
              console.log('image file deleted on Glitch!');
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
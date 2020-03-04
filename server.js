'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
// dns and options are part of dns.lookup to make sure legit site
const dns = require('dns');
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
let valid = require('valid-url');
var cors = require('cors');

var app = express();

const dotenv = require("dotenv");

dotenv.config();
// Basic Configuration 
var port = process.env.PORT || 3000;

let urlSchema = new mongoose.Schema({
  'original_url': String,
  'short_url': String
});
let ShortUrl = mongoose.model('ShortUrl',urlSchema);

/** this project needs a db !! **/ 
// CONNECT THE DATABASE RUNNING ON DEFAULT PORT 27017
// mongoose.connect(process.env.LOCAL_DATABASE, { useNewUrlParser: true }); 
// mongoose.set( 'useUnifiedTopology', true );

// CONNECT TO MONGODB ATLAS DATABASE - pass URI key to connect
mongoose.connect(process.env.DB_URI, {
  userNewUrlParser: true,
  useCreateIndex: true
}).then(() => {
  console.log("Connected to DB!");
}).catch(err => {
  console.log("Error: ", err.message);
});


app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new',(req,res)=>{
  let original_url = req.body.url; // Get the original url

  let urlId;
  // Regex to test if the url is valid
  let regexUrlCheck = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;;
  if(regexUrlCheck.test(original_url)){ 
    // If valid url
    ShortUrl.count({}, function (error, numOfDocs) {
      // Get the amount of urls, create new url object, save to database, render json format
      urlId = numOfDocs; // Save the count of urls found to use as short_url id
      let newUrl = { original_url, 'short_url': urlId }; // Create the new object to save
      ShortUrl.create(newUrl, (err, url) => {
        // Create the new object and return it in a JSON page to /api/shorturl/new
        err ? console.log(err) : res.json(newUrl);
      })
    }); 
  }else{
    // If original_url doesnt test positive for regex, then error
    res.json({ "error": "invalid URL" })
  }
});

// your first API endpoint... 
app.get("/:id", function (req, res) {
  // Return the most recent post
  ShortUrl.findOne({'short_url':req.params.id},(err,foundUrl)=>{ 
    err ? console.log(err) : res.redirect(foundUrl.original_url)
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
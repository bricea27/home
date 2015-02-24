var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var request = require('request');
var bcrypt = require('bcrypt');
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("users.db");
var app = express();
var secret = require('./secret.json');


var googKey = secret["key1"];
var forecastKey = secret["key2"];

app.use(session({
  secret: "penguin",
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));


app.get('/', function(req, res){
  res.render("index.ejs", {});
});

app.post('/user', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var city = req.body.city;

  if (password != confirmPassword) {
    res.redirect("/")
  } else
  var hash = bcrypt.hashSync(password, 10);

  db.run("INSERT INTO users (username, password, city) VALUES (?, ?, ?)", username, hash, city, function(err){
    if (err) { throw err; }
      req.session.valid_user = true;
      res.redirect("/" + username);
  });
});

app.post('/session', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  db.get("SELECT * FROM users WHERE username = ?", username, function(err, row){
      if (err) { throw err; }
      if (row) {
        var passwordMatches = bcrypt.compareSync(password, row.password);
        if (passwordMatches) {
          req.session.valid_user = true;
          res.redirect("/" + username);
        }
      } else {
        res.redirect("/");
      }
    }
  );
});

app.get("/:username", function(req, res){
  var username = req.params.username;

  if (req.session.valid_user === true) {
    db.get("SELECT * FROM users WHERE username = ?", username, function(err, row){
      if (err) { throw err; }
      if (row) {
        var city = row.city;
        res.render("user.ejs", {username: username, city: city})
      }else {
        // req.session.valid_user = false;
        res.redirect("/");
      }
    });
  } else {
    req.session.valid_user = false;
    res.redirect("/");
  }

});


//get weather info
app.get("/:username/weather", function(req, res){
  var username = req.params.username;
  db.get("SELECT * FROM users WHERE username = ?", username, function(err, row){
    if (err) { throw err; }
    if (row) {
      var city = row.city;
      //geocode call
      var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + city + "&key=" + googKey;
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          data = JSON.parse(body);
          var lat = data.results[0].geometry.location.lat;
          var long = data.results[0].geometry.location.lng;
        }
        //weather call
        var url2 = "https://api.forecast.io/forecast/" + forecastKey + "/" + lat + "," + long;
        request(url2, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            data = JSON.parse(body);
            res.send(data);
          }
        })
      })
    }else {
      res.redirect("/");
    }
  });
});

//change city
app.get("/:username/weather/:city", function(req, res){
  var newCity = req.params.city;
  var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + newCity + "&key=" + googKey;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      data = JSON.parse(body);
      var lat = data.results[0].geometry.location.lat;
      var long = data.results[0].geometry.location.lng;
    }
    //weather call
    var url2 = "https://api.forecast.io/forecast/" + forecastKey + "/" + lat + "," + long;
    request(url2, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        data = JSON.parse(body);
        res.send(data);
      }
    })
  })
});

app.delete('/session', function(req, res){
  req.session.valid_user = false;
  res.redirect("/");
});

var server = app.listen(3000, function() {
  console.log('Server is listening on port 3000');
});

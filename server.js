const express = require('express');
const bodyParser= require('body-parser');
var request = require('request'); 
const { conjureState } = require('./secret_tools.js');
require('dotenv').load();
const app = express();
var querystring = require('querystring');

app.use(bodyParser.urlencoded({extended: true}))



var mysql = require('mysql')
var connection = mysql.createConnection({
  host     : process.env.DATABASE_HOST,
  user     : process.env.DATABASE_USER,
  password : process.env.DATABASE_PASSWORD,
  database : process.env.DATABASE_NAME
});

connection.connect()

connection.query('SELECT * FROM users', function (err, rows, fields) {
  if (err) throw err

  console.log(rows);
})

connection.end()

app.listen(3000, function(){
	console.log(process.env.DATABASENAME);

	console.log('server on');
});


app.get('/', (req, res) => {
	console.log('On home page');
	res.sendFile(__dirname + '/index.html');
	console.log(__dirname);
})

app.get('/login', (req, res) => {
	console.log('On login');
	res.sendFile(__dirname + '/login.html');
})

app.get('/spotify-auth', (req, res) => {
	console.log('in spotify auth');	
	var scope = 'user-read-private user-read-email';
	res.redirect('https://accounts.spotify.com/authorize?' +
	  querystring.stringify({
		response_type: 'code',
		client_id: process.env.APP_CLIENT_ID,
		scope: scope,
		redirect_uri: process.env.APP_REDIRECT_URL,
		state: conjureState(16)
	  }));
})

app.get('/userpage', function(req, res) {
	console.log('user page');
	res.sendFile(__dirname + '/userpage.html');
})

app.get('/callback', function(req, res) {

	// your application requests refresh and access tokens
	// after checking the state parameter
  console.log('in callback');

	console.log('code: ' + req.query.code);
	console.log('state: ' + req.query.state);
	console.log('cookies: ' + req.cookies);
	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	console.log(storedState);
  
	if (state === null) {
	  res.redirect('/#' +
		querystring.stringify({
		  error: 'state_mismatch'
		}));
	} else {
	  res.clearCookie(state);
	  var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		form: {
		  code: code,
		  redirect_uri: process.env.APP_REDIRECT_URL,
		  grant_type: 'authorization_code'
		},
		headers: {
		  'Authorization': 'Basic ' + (new Buffer(process.env.APP_CLIENT_ID + ':' + process.env.APP_CLIENT_SECRET)
		  .toString('base64'))
		},
		json: true
	  };
  
	  request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
  
		  var access_token = body.access_token,
			  refresh_token = body.refresh_token;
  
		  var options = {
			url: 'https://api.spotify.com/v1/me',
			headers: { 'Authorization': 'Bearer ' + access_token },
			json: true
		  };
  
		  // use the access token to access the Spotify Web API
		  request.get(options, function(error, response, body) {
			console.log('body: ' + body);
			console.log('response: ' + response);
		  });

		  console.log('token: ' + access_token);
  
		  // we can also pass the token to the browser to make requests from there
		  res.redirect('/userpage?' +
			querystring.stringify({
			  access_token: access_token,
			  refresh_token: refresh_token
			}));
		} else {
		  res.redirect('/#' +
			querystring.stringify({
			  error: 'invalid_token'
			}));
		}
	  });
	}
  });	

app.post('/quotes', (req, res) => {
	console.log('On posts page');
	console.log(req.body)
	res.send('ON POSTS');
})

app.get('/posts', (req, res) => {
	res.send('on posts');
})
console.log('Hello World');


const express = require('express');
const app = express();
const bodyParser= require('body-parser');
const request = require('request'); 
const ejs = require('ejs');
const { conjureState } = require('./secret_tools.js');
const querystring = require('querystring');

require('dotenv').load();

app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs');

var userInfo;
var tokenInfo;



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
	res.sendFile(__dirname + '/index.html');
	console.log(__dirname);
})

app.get('/login', (req, res) => {
	res.sendFile(__dirname + '/login.html');
})

app.get('/spotify-auth', (req, res) => {
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
	console.log('64: ' + userInfo);
	userInfo = JSON.parse(userInfo);
	console.log(userInfo);
	res.render('userpage', {
		displayName: userInfo['display_name'],
		accessToken: tokenInfo['access_token']
	});
})

app.get('/callback', function(req, res) {

	// your application requests refresh and access tokens
	// after checking the state parameter

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
		
			  tokenInfo = {access_token: access_token};
  
		  var options = {
			url: 'https://api.spotify.com/v1/me',
			headers: { 'Authorization': 'Bearer ' + access_token },
			json: true
		  };
  
		  // use the access token to access the Spotify Web API
		  request.get(options, function(error, response, body) {
			userInfo = JSON.stringify(body);
			console.log(response);
			console.log(userInfo);
		  });
		  
		  setTimeout(() => {
			// pass token as query parameter 
			console.log('124: ' + JSON.stringify(response));
			console.log('125: ' + JSON.stringify(body));
			console.log(userInfo);
			
			res.redirect('/userpage?' +
				querystring.stringify({
				  access_token: access_token,
				  refresh_token: refresh_token
			}));	
		  }, 1500);
			  

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

	res.send('ON POSTS');
})

app.get('/posts', (req, res) => {
	res.send('on posts');
})



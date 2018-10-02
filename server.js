const express = require('express');
const app = express();
const https = require('https');

var io = require('socket.io')(process.env.PORT || 8000);

const path = require('path');
const bodyParser= require('body-parser');
const request = require('request'); 
const ejs = require('ejs');
const { conjureState } = require('./secret_tools.js');
const querystring = require('querystring');


// const PORT = process.env.PORT || 3000;
require('dotenv').load();

app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs');

var userInfo;
var tokenInfo;

app.use(express.static(path.join(__dirname, 'client/public')));



// var mysql = require('mysql')
// var connection = mysql.createConnection({
//   host     : process.env.DATABASE_HOST,
//   user     : process.env.DATABASE_USER,
//   password : process.env.DATABASE_PASSWORD,
//   database : process.env.DATABASE_NAME
// });

// connection.connect()

// connection.query('SELECT * FROM users', function (err, rows, fields) {
//   if (err) throw err

//   console.log(rows);
// })

// connection.end();

app.listen( process.env.PORT || 3000, function(){
	console.log(process.env.DATABASENAME);
	console.log(process.env.PORT);
	console.log('server on');
});

app.use(express.static('./frontend/dist/frontend'));

app.get('/main', (req, res) => {
	res.sendFile(__dirname + '/index.html');
	console.log(__dirname);
})

app.get('/frontend', function(req, res) {
	console.log(__dirname);
	res.sendFile(__dirname + '/frontend/dist/frontend/index.html');
})

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
})




app.get('/login', (req, res) => {
	res.sendFile(__dirname + '/login.html');
})

 io.on('connect', function(socket){
	console.log('connected');
	socket.on('disconnect', function(){
		console.log('disconnect');
	})
})

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});
app.get('/playback', (req, res) => {
	console.log('57: ' + userInfo);
	/**
	 * playBackInfo{ 
	 * 		currentSongInfo: {
	 * 		
	 * }
	 * }
	 */
	var scope = 'user-read-currently-playing';
	var playBackInfo = {
		currentSongInfo: {
			name: null
		}
	};
	
  var options = {
		url: 'https://api.spotify.com/v1/me/player/currently-playing',
		headers: { 'Authorization': 'Bearer ' + tokenInfo['access_token'] },
		json: true
		};
		request.get(options, function(error, response, body) {
			userInfo = JSON.stringify(body);
			console.log('curent: '+ JSON.stringify(response, null, 4));
			if(response['statusCode'] === 200)
			{
				playBackInfo['currentSongInfo']['name'] = response['body']['item']['name'];
			}
			else{
				playBackInfo['currentSongInfo']['name'] = 'NO SONG PLAYING';
			}
	
			});
			io.on('connection', function (socket) { // Notify for a new connection and pass the socket as parameter.
				console.log('new connection');
				setInterval(function () {
					console.log('in interval');
					request.get(options, function(error, response, body) {
						userInfo = JSON.stringify(body);
						console.log('curent: '+ JSON.stringify(response, null, 4));
						if(response['statusCode'] === 200)
						{
							playBackInfo['currentSongInfo']['name'] = response['body']['item']['name'];
						}
						else{
							playBackInfo['currentSongInfo']['name'] = 'NO SONG PLAYING';
						}
						io.emit('update-value', [playBackInfo]);
						socket.emit('update-value', playBackInfo); // Emit on the opened socket.
						})
				}, 1000);
		
		});
	setTimeout(() => {
		console.log(playBackInfo);
		res.render('playback_sdk', {
			access_token: tokenInfo['access_token'],
			playBackInfo: playBackInfo
		});
}, 1500)
})

app.get('/react', (req, res) => {
	console.log('in react');
	// res.sendFile(__dirname + '/front-end/client/public/index.html');
	res.sendFile(path.join(__dirname+'/front-end/client/public/index.html'));
})

app.get('/spotify-auth', (req, res) => {
	var scope = 'user-read-private user-read-email user-read-currently-playing user-modify-playback-state user-read-playback-state';
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
	console.log('bla: ' + JSON.stringify(userInfo['followers']));
	console.log('bla: ' + JSON.stringify(userInfo['images']));
	console.log('bla: ' + JSON.stringify(userInfo['images']['url']));
	console.log(userInfo);
	res.render('userpage', {
		displayName: userInfo['display_name'],
		accessToken: tokenInfo['access_token'],
		profilePictureLink: userInfo['images'][0]['url']
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

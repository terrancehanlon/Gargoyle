const express = require('express');
const app = express();
const https = require('https');

var fs = require('fs');

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
var playlists = [];

app.use(express.static(path.join(__dirname, 'client/public')));



// var mysql = require('mysql')
// var connection = mysql.createConnection({
//   host     : process.env.DATABASE_HOST,
//   user     : process.env.DATABASE_USER,
//   password : process.env.DATABASE_PASSWORD,
//   database : process.env.DATABASE_NAME
// });

// connection.connect()

// connection.query('SELECT * FROM playlist', function (err, rows, fields) {
//   if (err) throw err

//   console.log(rows);
// })


// connection.end();

app.listen(process.env.PORT || 3000);

app.use(express.static('./frontend/dist/frontend'));

app.get('/main', (req, res) => {
	res.sendFile(__dirname + '/index.html');
	console.log(__dirname);
	console.log(aws);
})

app.get('/frontend', function(req, res) {
	console.log(__dirname);
	res.sendFile(__dirname + '/frontend/dist/frontend/index.html');
})

app.get('/global', function(req, res) {
	res.sendFile( __dirname + '/frontend/dist/frontend/index.html');
})

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
})


app.get('/all', (req, res) => {
	connection.query('SELECT * FROM playlist', function (err, rows, fields) {
		if (err) throw err
	
		console.log(rows);
	})
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
	console.log("HERE2");
	res.redirect('https://accounts.spotify.com/authorize?' +
	  querystring.stringify({
		response_type: 'code',
		client_id: process.env.APP_CLIENT_ID,
		scope: scope,
		redirect_uri: process.env.APP_REDIRECT_URL,
		state: conjureState(16)
	  }));2
})
app.get('/playlist/:playListId', (req, res) => {
	console.log(req.params);
	res.render('playlist', {
			id: req.params['playListId'],
			accessToken: tokenInfo['accessToken']
	})
})
app.get('/playlists', (req, res) => {
	 console.log(tokenInfo);
	 let count;
	 
	 var options = {
		url: 'https://api.spotify.com/v1/me/playlists',
		headers: { 'Authorization': 'Bearer ' + tokenInfo['access_token'] },
		json: true
		};
		request.get(options, function(error, response, body){
			console.log(JSON.stringify(response, null, 4));
			console.log('******************************************-----------------------*************************************');
			console.log('******************************************-----------------------*************************************');
			console.log('******************************************-----------------------*************************************');
			console.log('Play lists :');
			console.log('============================================================================================================');
			let  = [];
			let names = [];
			for(let item of body['items'])
			{
				if(item['images'].length == 1){
					console.log(item['id']);
					let playList_obj = {
						"name": item['name'],
						"image": item['images'][0]['url'],
						"id": item['id']
					}
					names.push(playList_obj);
					
				}

			}
			playlists['names'] = names;	
			// console.log(JSON.stringify(body, null, 4));
			
			 count = body['total'];
			console.log(count);
		})

		setTimeout(() => {
			console.log(playlists);
			res.render('playlists', {
				playListInfo: {count: count, names: playlists['names']}
			})
		}, 1000)
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

app.get('/all', (req, res) => {
	let count = 0;
	// connection.query('SELECT * FROM playlist', function (err, rows, fields) {
	// 	if (err) throw err;
	// 	count++;
	// 	console.log(rows);
	// 	console.log(count);
	// })
	console.log(playlists);
	console.log('test here');
	res.send("test test");
})

app.post('/add', (req, res) => {
	console.log('on add');
	console.log(req);

})

app.get('/posts', (req, res) => {
	res.send('on posts');
})

app.get('*', (req, res) => {
	res.send("error", 404);
})

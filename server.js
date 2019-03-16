const Query = require('./queries');
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

const query = new Query();

// const PORT = process.env.PORT || 3000;
require('dotenv').load();

app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs');

var tokenInfo;
var playlists = [];

app.use(express.static(path.join(__dirname, 'client/public')));
app.use(function(req, res, next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, application/json");
next();
})


var mysql = require('mysql')
var connection = mysql.createConnection({
  host     : process.env.DATABASE_HOST,
  user     : process.env.DATABASE_USER,
  password : process.env.DATABASE_PASSWORD,
  database : process.env.DATABASE_NAME
});

connection.connect()




// connection.end();

app.listen(process.env.PORT || 3005);

app.get('/frontend', function(req, res) {
	console.log(__dirname);
	res.sendFile(__dirname + '/frontend/dist/frontend/index.html');
})

app.get('/global', function(req, res) {
	res.sendFile( __dirname + '/frontend/dist/frontend/index.html');
})

app.get('/', (req, res) => {
	// console.log('in root');
	res.sendFile(__dirname + '/land.html');
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
app.get('/playlist/:playListId', (req, res) => {
	console.log(req.params);
	res.render('playlist', {
			id: req.params['playListId'],
			accessToken: tokenInfo['accessToken']
	})
})
app.get('/user/:userId', (req, res) => {

})
app.get('/playlists', (req, res) => {
	 let count;
	 
	 var options = {
		url: 'https://api.spotify.com/v1/me/playlists',
		headers: { 'Authorization': 'Bearer ' + tokenInfo['access_token'] },
		json: true
		};
		request.get(options, function(error, response, body){
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
			console.log(JSON.stringify(body, null, 4));
			
			 count = body['total'];
			console.log(count);
		})

		setTimeout(() => {
			console.log(playlists);
			res.render('playlists', {
				playListInfo: {count: count, names: playlists['names']}
			})
			return response;
		}, 1000)
});



app.get('/userpage', function(req, res) {
	let userInfo = JSON.parse(req.query.userInfo);
	console.log(JSON.stringify(userInfo, null, 2));
	console.log(userInfo['id']);
	// console.log(userInfo['images']);
	
	query.checkIfExists(connection, userInfo['id']);

	res.render('userpage', {
		displayName: userInfo['display_name'],
		accessToken: tokenInfo['access_token'],
		profilePictureLink: userInfo['images'][0]['url']
	});
})

app.get('/featured-list', function(req, res){
	 // Website you wish to allow to connect
	 res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

	 // Request methods you wish to allow
	 res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	 // Request headers you wish to allow
	 res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	 // Set to true if you need the website to include cookies in the requests sent
	 // to the API (e.g. in case you use sessions)
	 res.setHeader('Access-Control-Allow-Credentials', true);
	
	 console.log("in featured list");
	connection.query("SELECT * FROM user", function(err, rows, fields){
		if(err) return err;

		console.log('rows: ' + JSON.stringify(rows));

		res.send(JSON.stringify(rows));
	})
})

app.get('/create-account', function(req, res){
	console.log(req.query.username);
	res.render("login", {

	});
	// connection.query("INSERT INTO user (id) " + "VALUES(" + "\'" + userInfo['id'] + "\'"  + ')', function(err, rows, fields){
	// 	if(err) console.log(err);

	// } )
})


app.get('/callback', function(req, res) {
	var userInfo;

	// your application requests refresh and access tokens
	// after checking the state parameter

	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;
  
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
		  });
		  
		  setTimeout(() => {
			res.redirect('/userpage?' +
				querystring.stringify({
					userInfo: userInfo,
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
	res.send("ERROR");
})

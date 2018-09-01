const express = require('express');
const bodyParser= require('body-parser');
require('dotenv').load();
const app = express();

app.use(bodyParser.urlencoded({extended: true}))


const MongoClient = require('mongodb').MongoClient

// MongoClient.connect('mongodb://<terrance>:<Thssplayer27123!>p%40ds137812.mlab.com:37812/express-tutorial', (err, client) => {

//   // ... start the server

//   if(err) return console.log(err);

//   db = client.db('express-tutorial')

//   app.listen(3000, function() {

// 	console.log();

// })
// })

//MongoClient.connect('mongodb://<terrance>:<Thssplayer27123!>p%40ds137812.mlab.com:37812/express-tutorial', { useNewUrlParser: true});

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

app.post('/quotes', (req, res) => {
	console.log('On posts page');
	console.log(req.body)
	res.send('ON POSTS');
})

app.get('/posts', (req, res) => {
	res.send('on posts');
})
console.log('Hello World');


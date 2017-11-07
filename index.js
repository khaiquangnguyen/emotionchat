var express = require("express");
var app = express();
var path = require('path')
var port = 8000;
// testing
// var io = require('socket.io').listen(app.listen(port));
// heroku deploy
var io = require('socket.io').listen(app.listen(process.env.PORT || port));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(path.join(__dirname, "public")));


io.sockets.on('connection', function (socket) {
    console.log('a user connected');    
    socket.emit('id', {
        message: socket.id
    });
    socket.on('send', function (msg) {
        io.emit('send', {
            data: msg,
            clientid: socket.id
        });
    });
    socket.on('emoji', function (msg) {
        io.emit('emoji', {
            data: msg,
            clientid: socket.id
        });
    });
    socket.on('emotions', function (msg) {
        io.emit('emotions', {
            data: msg,
            clientid: socket.id
        });
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
      });
});

console.log("Listening on port " + port);
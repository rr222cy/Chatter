var mongo = require('mongodb').MongoClient,
	client = require('socket.io').listen(8080).sockets;

// Connecting to mongoDB
mongo.connect('mongodb://127.0.0.1/chat', function(err, db) {
	if (err) throw err;

	client.on('connection', function(socket) {

		// Retrieving collection that will be used
		var col = db.collection('messages'),
			sendStatus = function (s) {
				socket.emit('status', s);
			};

		// Emit all messages when a client connects
		col.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
			if(err) throw err;
			socket.emit('output', res);
		});

		// Waiting for input
		socket.on('input', function(data) {
			var name = data.name,
				message = data.message,
				whitespacePattern = /^\s*$/;

			if(whitespacePattern.test(name) || whitespacePattern.test(message)) {
				sendStatus('Both name and message must be given.');
			}
			else {
				col.insert({name: name, message: message}, function() {

					// Emit latest messages to ALL clients
					client.emit('output', [data]);

					sendStatus({
						message: "Message sent!",
						clear: true
					});
				});
			}			
		});
	});
});
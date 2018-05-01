//require our websocket library//
var WebSocketServer = require('ws').Server;

//creating a websocket server at port 9090 
var wss = new WebSocketServer({
    port: 9090
});

//all connected to the server users 
var users = {};
var clients = [];
var key;

function isInArray(key) {
    var count = clients.length;
    if (count >= 1) {
        for (var i = 0; i < count; i++) {
            if (clients[i] == key) {
                return true;
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
}

//when a user connects to our sever 
wss.on('connection', function(connection) {

    console.log("User connected");

    //when server gets a message from a connected user
    connection.on('message', function(message) {

        var data;
        //accepting only JSON messages 
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }

        //switching type of the user message
        switch (data.header.subtype) {
            //when a user tries to login

            case "0":
                key = data.header.s_id;
                if (isInArray(key) === true) {
                    //sendTo(connection, {type: "6"});
                    sendTo(connection, {
                        header: {
                            s_id: -1,
                            r_id: data.header.s_id,
                            type: '0',
                            subtype: '0',
                            result: '0'
                        },
                        payload: {}
                    });
                    break;
                } else {
                    //sendTo(connection, {type: "5", peerarray: clients});
                    sendTo(connection, {
                        header: {
                            s_id: -1,
                            r_id: data.header.s_id,
                            type: '0',
                            subtype: '0',
                            result: '1'
                        },
                        payload: {
                            peerarray: clients
                        }
                    });
                    clients.push(key);
                    users[key] = connection;
                    connection.name = key;
                    break;
                }
                break;

            case "1":
                //for ex. UserA wants to call UserB 
                console.log("Sending offer to: ", data.header.r_id);

                //if UserB exists then send him offer details 
                var conn = users[data.header.r_id];

                if (conn != null) {
                    //setting that UserA connected with UserB 
                    connection.otherName = data.header.r_id;

                    // sendTo(conn, { type: "1", offer: data.offer, name: connection.name, peerarray: clients }); 
                    sendTo(conn, {
                        header: {
                            s_id: data.header.s_id,
                            r_id: data.header.r_id,
                            type: '0',
                            subtype: '1',
                            result: ''
                        },
                        payload: {
                            offer: data.payload.offer,
                            peerarray: clients
                        }
                    })
                }

                break;

            case "2":
                console.log("Sending answer to: ", data.header.r_id);
                //for ex. UserB answers UserA 
                var conn = users[data.header.r_id];

                if (conn != null) {
                    connection.otherName = data.header.r_id;
                    //sendTo(conn, { type: "2", answer: data.answer });
                    sendTo(conn, {
                        header: {
                            s_id: data.header.s_id,
                            r_id: data.header.r_id,
                            type: '0',
                            subtype: '2',
                            result: ''
                        },
                        payload: {
                            answer: data.payload.answer
                        }
                    })
                }

                break;

            case "3":
                console.log("Sending candidate to:", data.header.r_id);
                var conn = users[data.header.r_id];

                if (conn != null) {
                    //sendTo(conn, { type: "3", candidate: data.candidate });
                    sendTo(conn, {
                        header: {
                            s_id: data.header.s_id,
                            r_id: data.header.r_id,
                            type: '0',
                            subtype: '3',
                            result: ''
                        },
                        payload: {
                            candidate: data.payload.candidate
                        }
                    })
                }

                break;

            case "4":
                console.log("Disconnecting from", data.payload.s_id);
                var conn = users[data.payload.s_id];
                conn.otherName = null;

                //notify the other user so he can disconnect his peer connection 
                if (conn != null) {
                    //sendTo(conn, { type: "leave" });
                    sendTo(conn, {
                        header: {
                            s_id: data.payload.s_id,
                            r_id: '',
                            type: '0',
                            subtype: '4',
                            result: ''
                        },
                        payload: {}
                    })
                }

                break;

            default:
                //sendTo(connection, { type: "error", message: "Command not found: " + data.type });
                send(connection, {
                    header: {
                        s_id: '',
                        r_id: '',
                        type: '0',
                        subtype: '5',
                        result: ''
                    },
                    payload: {}
                })
                break;
        }
    });

    //when user exits, for example closes a browser window 
    //this may help if we are still in "offer","answer" or "candidate" state 
    connection.on("close", function() {

        if (connection.name) {
            console.log("Disconnecting from ", connection.name);
            delete users[connection.name];
            clients.splice(clients.indexOf('connection.name'), 1);
            console.log(clients);
        }
    });

});

function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
}

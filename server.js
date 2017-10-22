//require our websocket library 
var WebSocketServer = require('ws').Server;
 
//creating a websocket server at port 9090 
var wss = new WebSocketServer({port: 9090}); 

//all connected to the server users 
var users = {};
var clients=[];

function isInArray(key){
	var count=clients.length;
	if(count>=1){
			for(var i=0;i<count;i++){
			if(clients[i] == key){
				return true;
			}
			else{
				return false;
			}
		}
	}
	else{
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
      switch (data.type) {
         //when a user tries to login

	case "0":
	    var key=data.uuid;
            if(isInArray(key) === true){
               sendTo(connection, {type: "6"});
	       break;
	    }
            else{
		sendTo(connection, {type: "5", peerarray: clients});
	       	clients.push(key);
		users[key] = connection; 
		connection.name = key; 
		break;
		}
	   break;
				
         case "1": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offer to: ", data.name); 
				
            //if UserB exists then send him offer details 
            var conn = users[data.name];
				
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
					
               sendTo(conn, { 
                  type: "1", 
                  offer: data.offer, 
                  name: connection.name,
		  peerarray: clients
               }); 
            } 
				
            break;  
				
         case "2": 
            console.log("Sending answer to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
				
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "2", 
                  answer: data.answer 
               }); 
            } 
				
            break;  
				
         case "3": 
            console.log("Sending candidate to:",data.name); 
            var conn = users[data.name];  
				
            if(conn != null) { 
               sendTo(conn, { 
                  type: "3", 
                  candidate: data.candidate 
               });
            } 
				
            break;  
				
         case "leave": 
            console.log("Disconnecting from", data.name); 
            var conn = users[data.name]; 
            conn.otherName = null; 
				
            //notify the other user so he can disconnect his peer connection 
            if(conn != null) { 
               sendTo(conn, { 
                  type: "leave" 
               }); 
            }  
				
            break;  
				
         default: 
            sendTo(connection, { 
               type: "error", 
               message: "Command not found: " + data.type 
            }); 
				
            break; 
      }  
   });  
	
   //when user exits, for example closes a browser window 
   //this may help if we are still in "offer","answer" or "candidate" state 
   connection.on("close", function() { 
	
      if(connection.name) { 
      delete users[connection.name]; 
		
         if(connection.otherName) { 
            console.log("Disconnecting from ", connection.otherName);
            var conn = users[connection.otherName]; 
            conn.otherName = null;  
				
            if(conn != null) { 
               sendTo(conn, {  
                  type: "leave" 
               });
            }  
         } 
      } 
   });  
	
//   connection.send("Hello world"); 
	
});  

function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}



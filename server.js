const express = require("express");
const http = require("http");
const cors = require('cors')
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: '*' } });
const { ExpressPeerServer } = require("peer");

const newMeeting = require("./routes/newMeeting");

const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.use("/peerjs", peerServer);
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send("Working...."))
app.get('/join', (req, res) => newMeeting(req, res));
const users = [];

// Join user to chat
function userJoin(id, username, roomId) {
  const user = { id, username, roomId };

  users.push(user);

  return user;
}
function getRoomUsers(roomId) {
    const abc=users.filter(user => user.roomId === roomId);
    //console.log(abc[0].username);
    return abc;
  }
  
// User leaves chat
function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
  
    if (index !== -1) {
      return users.splice(index, 1)[0];
    }
  }
io.on("connection", (socket) => {

 socket.on('joinRoom', ({ username, roomId }) => {
        const user = userJoin(socket.id, username, roomId);
        //console.log(user);
        users.push(user);
        console.log(user.roomId);
        socket.join(user.roomId);
         // Send users and room info
         //socket.broadcast.to(user.roomId).emit('roomUsers', {
        io.to(user.roomId).emit('roomUsers',{
        roomId: user.roomId,
        users: getRoomUsers(user.roomId)
      });
    });
    socket.on("join-room", (roomId, userId) => {

        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
              const user = userLeave(socket.id);
            if(user)
            {
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                  });
            }
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
        socket.on('msg', function (data) {
            // server side data fetched 
            console.log(data);
            io.to(roomId).emit('newmsg', data);
        })
        /*socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userId);
        });  */
    })
})

server.listen(process.env.PORT || 5000, () => {
    console.log(process.env.PORT)
    console.log("Server is running...")
})

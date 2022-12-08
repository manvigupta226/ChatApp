const socketio = require("socket.io");
const http = require("http");

const {
  addUser,
  removeUser,
  getUser,

  getUsersInRoom,
} = require("./users");

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  // console.log("hh");
  const headers = {
    "Access-Control-Allow-Origin": "*",
  };
  res.writeHead(200, headers);
  res.end();
});
const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });

    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined` });

    io.to(user.room).emit(`roomData`, {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    // console.log("working", message, callback);
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    // io.to(user.room).emit("roomData", {
    //   room: user.room,
    //   users: getUsersInRoom(user.rooom),
    // });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

// app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));

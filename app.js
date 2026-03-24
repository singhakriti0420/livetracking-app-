const express = require("express");
const app = express();

const http = require("http"); 
const socketIO = require("socket.io");
const path = require("path");

const server = http.createServer(app) ;
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
// view engine
app.set("view engine", "ejs"); 
app.set("views", path.join(__dirname, "views"));
// static
app.use(express.static(path.join(__dirname, "public")));

// socket
io.on("connection",function (socket){   
  console.log("User connected:", socket.id);

  socket.on("send location", function (data) { 
    if (process.env.NODE_ENV !== "production") {
  console.log("Received:", data);
}
     io.emit("receive-location", {
         id: socket.id,
         latitude: data.latitude,
         longitude: data.longitude,
         username: data.username || "User"
});
});
 socket.on("disconnect", function() {
    console.log("User disconnected:", socket.id);
  io.emit("user-disconnected", socket.id);
 });
}); 
// route
app.get("/", function (req, res) {
  res.render("index");
});
// server.listen(3000, () => {
//   console.log("Server running on port 3000");
// });

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


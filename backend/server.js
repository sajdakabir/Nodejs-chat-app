const express =require('express');
const dotenv=require('dotenv');
const connectDB = require('./config/db');
const colors =require('colors');
const useRoutes=require('./routes/userRoutes');
const chatRoutes=require('./routes/chatRoutes');
const messageRoutes=require('./routes/messageRoutes');
const  cors =require('cors');
// const{notFound,errorHandlers}=require('./middleware/errorMiddleware');
// const path = require("path");

dotenv.config();

connectDB();
const app=express();
app.use(express.json());


app.use('/api/user',useRoutes)
app.use('/api/chat',chatRoutes)
app.use('/api/message',messageRoutes);





// app.use(notFound)
// app.use(errorHandlers)
const corsConfig = {
  credentials: true,
  origin: true,
};
app.use(cors(corsConfig));


const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    
  });

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));


  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });

  });

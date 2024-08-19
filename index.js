const express = require('express')
const app = express()
const dotenv= require('dotenv')
const db  =require('./DB/mongoose')
const cors = require('cors')
const socketIo = require('socket.io')
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios')
const path = require("path")


//client test
//upload  render
app.use(express.static(path.join(__dirname,'/client/build')))
app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname,'/client/build/index.html'))
})




//hack
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);
//___
// use
app.use(helmet());
app.use(cors())
dotenv.config()
db()
app.use(express.json())
// reset pass
app.use(express.urlencoded({extended : false}))
app.use(`${process.env.API_URL}`,require('./router/authR.JS'))
app.use(`${process.env.API_URL}`,require('./router/SendMRouter'))


const server = app.listen(process.env.PORT,()=>{
    console.log('listen '+ process.env.PORT);
})


const io = socketIo(server ,{
  cors :{
    origin: process.env.SOCKET,
    methods: ["GET", "POST"]
  }
})

let onlineUsers = new Map

io.on('connection',(socket)=>{

    


    //chart 
    socket.on('sendData',(data)=>{
    socket.emit('dataReiceve',candlestickData = {
            time:Math.floor(new Date(data.k.t/1000)),open:parseFloat(data.k.o),high:parseFloat(data.k.h),low:parseFloat(data.k.l),close:parseFloat(data.k.c)
        }) 
    })

    socket.on('openDeal',data=>{
        socket.emit('reiciveDeal',(data))
    })

    global.chatSocket = socket;
    socket.on('add-user',(userId,value,min)=>{
        onlineUsers.set(userId,socket.id)
        console.log(onlineUsers);
        socket.emit('receiveId',(userId))

        //data chart
       /* axios.get(`https://api.binance.com/api/v3/klines?symbol=${value}USDT&interval=${min}&limit=1000`)
        .then(response => {
            socket.emit('dataChartReicive',(response.data))
         })*/
    });

    socket.on('send-mony',(data)=>{
        const userClient  = onlineUsers.get(data.to)
        socket.to(userClient).emit('mony-reicive',(data.ment - 1))
    })

    socket.on('disconnect', () => {
        for (const [key, value] of onlineUsers) {
            if (value === socket.id) {
                onlineUsers.delete(key);
                break;
            }
        }
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
})

    
    

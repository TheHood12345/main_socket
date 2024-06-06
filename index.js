const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const url = require("url");
const cors = require("cors");

require("dotenv").config();



// const {sequelize, User} = require("./model");

// sequelize.sync({force:false}).then(()=>{console.log("database synchronized!!")}).catch((err)=>{console.log("some error occured during database synchronization:\n",err)});


const {Sequelize, DataTypes} = require("sequelize");




    const sequelize = new Sequelize(process.env.PG_DATABASE,process.env.PG_USER,process.env.PG_PASSWORD,{
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        dialect: 'postgres'
    });
    console.log("database connected");




const User = sequelize.define('ton4_user', {
    telegram_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true
    },
    telegram_username: {
        type: DataTypes.STRING,
        allowNull: true
    },
    balance: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: 0
    },
    referred:{
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: 0
    },
    automate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
},{
    timestamps: false
});

sequelize.sync({force:false}).then(()=>{console.log("database synchronized!!")}).catch((err)=>{console.log("some error occured during database synchronization:\n",err)});



const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({server});


app.get("/qwerty",async(req,res)=>{
    let user = await User.findAll();
    res.send(`Hello , we are active !! ${user}`);
});

wss.on("connection", async(ws, request)=>{
    console.log("Web socket handshake has been made!!");

    const queryParams = new URLSearchParams(url.parse(request.url).search);
    const id = parseInt(queryParams.get('id'),10);

    const referrer_id =  parseInt(queryParams.get('referrer_id'),10);
    const user_id =  parseInt(queryParams.get('user_id'),10);

   // ws.send(`Total saved balance:  ${id.toString()}..  ${referrer_id}.. ${user_id}`);
    
    let user = await User.findOne({where:{telegram_id:user_id}});
    let bal = user.balance;
    ws.send(bal?? "0");

    let tot_bal = parseInt(user.balance,10);

    ws.on("message", async(message)=>{
        // if(message.data == "tap"){
           tot_bal += 10;
           console.log(tot_bal);
           ws.send(tot_bal); 
        // }else if(message.data == "save"){
        //     ws.send("1000");
        // }
        
    });
    
    ws.on("close", async()=>{
        await User.update({balance:tot_bal},{where:{telegram_id:user_id}});
        console.log("balance updated");
    });

});

server.listen(process.env.EXPRESS_PORT, process.env.EXPRESS_IP, ()=>{
    console.table({"http":`http://${process.env.HOST1}:${process.env.PORT1}`,"websocket":`ws://${process.env.HOST1}:${process.env.PORT1}`})
});


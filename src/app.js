const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")

const app = express();

// MIddlewares 

app.use(express.json());
app.use(cors());

app.use(helmet());
app.use(morgan("dev"));


// health check api

app.get("/api/healths",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"Digital Wallet Server is running"
    })
})

module.exports = app;

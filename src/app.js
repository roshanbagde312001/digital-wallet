const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const userRouter = require("./routes/user.routes")
const walletRoutes = require("./routes/wallet.routes");
const transationRoutes = require("./routes/transaction.routes");

const app = express();

// MIddlewares 

app.use(express.json());
app.use(cors());

app.use(helmet());
app.use(morgan("dev"));

app.use("/api/users",userRouter)
app.use("/api/wallet",walletRoutes)
app.use("/api/transactions",transationRoutes)
// health check api

app.get("/api/healths",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"Digital Wallet Server is running"
    })
})

module.exports = app;

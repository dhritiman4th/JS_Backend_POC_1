import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const sizeLimit = "16kb";
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
})); 

app.use(express.json({limit: sizeLimit}));
app.use(express.urlencoded({extended: true, limit: sizeLimit})); //NOTE:- 'extended' allows us to create nested object
app.use(express.static("public")); //NOTE:- It will create a public folder to the server where we can store stuffs.
app.use(cookieParser()); //NOTE:- USing this we can set or update the secured cookies to the user's browser.


//routes import 

import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

import subscriptionRouter from "./routes/subscription.routes.js";
app.use("/api/v1/subscription", subscriptionRouter);

//routes declaration

export default app;
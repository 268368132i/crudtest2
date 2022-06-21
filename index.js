import express from "express";
import { connect } from "./db/conn.js";
import cors from "cors";
import GenericController from "./controllers/GenericController.js";
import GenericRouter from "./routes/genericRoute.js";
import { Authentication, UserController } from "./user.js";
import UserRouter from "./routes/userRoute.js";
import { AuthRouter } from "./routes/authentication.js";


const app = express();

const PORT = 5000;


const corsOptions = {
    origin: '*',
  }
app.use(cors(corsOptions));


async function start(){
    const client = await connect();
    //Auditories
    const audCtl = new GenericController("auditories", client);
    const audRt = new GenericRouter(audCtl);

    const itemCtl = new GenericController("items", client);
    const itemRt = new GenericRouter(itemCtl);

    const userCtl = new UserController(client);
    const userRt = new UserRouter(userCtl);

    const userAuth = new Authentication(client);
    userAuth.initSession(app);
    const authRouter = new AuthRouter(userAuth);

    app.use("/auth", authRouter.getRouter());
    app.use("/auditories", audRt.getRouter());
    app.use("/location", audRt.getRouter());
    app.use("/items", itemRt.getRouter());
    app.use("/user", userRt.getRouter());
    app.listen(PORT, ()=>{});
}

start();
import express from "express";
import { connect } from "./db/conn.js";
import cors from "cors";
import GenericController from "./controllers/GenericController.js";
import GenericRouter from "./routes/genericRoute.js";
import { Authentication, UserController } from "./user.js";
import UserRouter from "./routes/userRoute.js";
import { AuthRouter } from "./routes/authentication.js";
import CollectionsAccessController from "./controllers/CollectionsAccessController.js";
import AuthorizedGenericController from "./controllers/AuthorizedGenericController.js";
import initializeAuthentication from "./lib/initializeAuthentication.js";


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

    //const itemCtl = new GenericController("items", client);
    const itemCtl = new AuthorizedGenericController("items", client);
    const itemRt = new GenericRouter(itemCtl);

    const userCtl = new UserController(client);
    const userRt = new UserRouter(userCtl);

    const grpCtl = new GenericController('groups', client)
    const grpRt = new GenericRouter(grpCtl)



    const colAccessCtl = new CollectionsAccessController(client)
    const colAccessRt = new GenericRouter(colAccessCtl)

    const userAuth = new Authentication(client,app);
    //userAuth.initSession(app);
    //const authRouter = new AuthRouter(userAuth, app);
    initializeAuthentication(userAuth, app)

    //app.set('trust proxy, 1')

    //app.use("/auth", authRouter.getRouter());
    app.use("/auditories", audRt.getRouter());
    app.use("/location", audRt.getRouter());
    app.use("/items", itemRt.getRouter());
    app.use("/user", userRt.getRouter());
    app.use('/group', grpRt.getRouter())
    app.use('/coll_access', colAccessRt.getRouter())
    app.listen(PORT, ()=>{});
}

start();
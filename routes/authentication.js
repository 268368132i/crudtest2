import express from "express";

export class AuthRouter{
    constructor (authObj){
        this.router = express.Router();
        this.router.use(express.json());
        this.router.post("/", authObj.getPassportAuth(),(req, res)=>{
            console.log(`User:`, req.user);
            res.send({authenticated: req.user?._id ? true : false, user : req.session.passport.user});
        });
        this.router.delete("/", (req, res) => {
            console.log(`Deleting session ${req.sessionID}`);
            console.dir(req.session)
            if (req.session) {
                req.session.destroy();
                res.send("Logged out.");
                console.dir(req.session)
            } else {
                console.log('Couldn\'t delete session. No Session')
                res.send("No session");
            }
        })
    }
    getRouter(){
        return this.router;
    }
}


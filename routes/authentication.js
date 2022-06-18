import express from "express";

export class AuthRouter{
    constructor (authObj){
        this.router = express.Router();
        this.router.use(express.json());
        this.router.post("/login", authObj.getPassportAuth(),(req, res)=>{
            console.log(`User:`, req.user);
            res.send({user : req.user, session: req.session});
        });
        this.router.get("/logout",(req,res)=>{
            if(req.session){
                console.log(`Deleting session ${req.sessionID}`);
                req.session.destroy();
                res.send("Logged out.");
            } else {
                res.send("No session");
            }

        })
    }
    getRouter(){
        return this.router;
    }
}


import express from "express";

export class AuthRouter{
    constructor (authObj, app, prefix = 'auth'){
        //this.router = express.Router();
        this.router = app
        //this.router.use(express.json());
        this.router.post('/${prefix}', authObj.getPassportAuth(),(req, res)=>{
            console.log(`User:`, req.user);
            res.send({authenticated: req.user?._id ? true : false, user : req.session.passport.user});
        });
        this.router.delete('/${prefix}', (req, res) => {
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
        this.router.get('/${prefix}/', (req, res) => {
            console.log('Printing session')
            if(!req.session?.passport) {
                res.status(403)
                return
            }
            res.json(req.session.passport)
        })
        this.router.get('/${prefix}', (req, res) => {
            res.json(req.session)
        })
    }
    getRouter(){
        return this.router;
    }
}


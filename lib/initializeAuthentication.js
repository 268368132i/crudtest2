
import express from "express";

export default function initializeAuthentication (authObj, app, prefix = 'auth'){
        app.post(`/${prefix}/`,express.json(), authObj.getPassportAuth(),(req, res)=>{
            console.log(`User:`, req.user);
            res.send({authenticated: req.user?._id ? true : false, user : req.session.passport.user});
        });
        app.delete(`/${prefix}/`, (req, res) => {
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
        app.get(`/${prefix}/session`, (req, res) => {
            console.log('Printing session')
            if(!req.session?.passport) {
                res.status(403)
                return
            }
            res.json(req.session.passport)
        })
        app.get(`/${prefix}/`, (req, res) => {
            res.json(req.session)
        })
    }
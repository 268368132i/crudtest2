import passport from "passport";
import LocalStrategy from "passport-local";
import crypto from "crypto";
import express from "express";
import GenericController from "./controllers/GenericController.js";
import MongoStore from "connect-mongo";
import session  from "express-session";
import { ObjectId } from "mongodb";

export class Authentication {
    constructor(connection) {
        this.conn = connection;
        this.dbName = "inventory";
        const dbName = this.dbName;
        this.colName = "user";
        const colName = this.colName;
        this.sessionStore = this.getStore();
        const getUser = this.getUserByUserName;
        this.localStrategy = new LocalStrategy(
            async function verify(uname, pwd, cb) {
                try {
                    const coll = await connection.db(dbName).collection(colName);
                    const user  = await coll.findOne({username : uname},{
                        projection:{
                        }
                    });
                    if (!user) {
                        throw new Error("Invalid user");
                    }
                    if (cmpHashPwd(user.salt, user.hash, pwd)) {
                        console.log(`User ${user.firstName} ${user.lastName} authenticated`);
                        cb(null, user);
                    } else {
                        throw new Error("Unknown credentials");
                    }
                } catch (err){
                    console.log(String(err));
                    cb(null, false, {message: String(err)});
                }
        });
        passport.use(this.localStrategy);
        passport.serializeUser(function serializer(user, done){
            console.log("Serializing...");
            done(null, {
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
            });
        });
        passport.deserializeUser(async function deserializer(suser, done) {
            try {
                console.log("Deserializing...");
                const coll = await connection.db(dbName).collection(colName);
                console.log("User:", suser);
                const user = await coll.findOne({ _id: new ObjectId(suser._id) }, {
                        projection: {
                            username: 1,
                            firstName: 1,
                            lastName: 1,
                        }
                    });
                if (!user) {
                    throw new Error("User not found");
                }
                done(null, user);
            } catch (err) {
                console.log(`Error deserializing user`, suser);
                done(err, null);
               //done(null, suser);
            }
        })

    }

    initSession(app, secret = "erhG0t") {
        app.use(session({
            store: this.sessionStore,
            secret: secret,
            resave: true,
            saveUninitialized: true
        }));
        app.use(passport.initialize());
        app.use(passport.session());
    }
    getStore() {
        try {
            return MongoStore.create({
                client: this.conn,
                dbName: this.dbName,
            });
        } catch (err) {
            console.log(String(err));
        }
    }

    getPassportAuth() {
        return passport.authenticate(
            "local",
            {
                session: true
            });

    }

    async getUserByUserName(userName) {
        coll = await this.conn.db("inventory").collection(this.colName);
        console.log(`Looking for ${userName}`);
        return this.coll.findOne({username : userName},{salt: 1, hash: 1});
    }
    
}

export class UserController extends GenericController{
    constructor (conn){
        super("user", conn);       
    }
    async new(user){
        if (!this.coll) {
            await this.setCol();
        }
        const [salt, hash] = genHash(user.password);
        const result = await this.coll.insertOne({
            username: user.username,
            salt: salt,
            hash:hash,
            lastName: user.lastName,
            firstName: user.firstName
        });
        return result;
    }
    async list(){
        if (!this.coll) {
            await this.setCol();
        }
        const items = await this.coll.find({}).project({
            "salt": false,
            "hash": false,
        }).toArray();
        console.log("got with projection:", items);
        return items;
    }
}

function genHash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return [salt, hash];
}
function cmpHashPwd(salt, hash, password) {

    const new_hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    console.log(`Old hash ${hash}, new hash ${new_hash}`);
    return hash === new_hash;
}
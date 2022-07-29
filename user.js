import passport from "passport";
import LocalStrategy from "passport-local";
import crypto from "crypto";
import express from "express";
import AuthorizedGenericController from "./controllers/AuthorizedGenericController.js";
import MongoStore from "connect-mongo";
import session  from "express-session";
import { ObjectId } from "mongodb";

export class Authentication {
    constructor(connection, app, secret = "erhG0t") {
        this.conn = connection;
        this.dbName = "inventory";
        const dbName = this.dbName;
        this.colName = "user";
        const colName = this.colName;
        this.sessionStore = this.getStore();


        app.use(session({
            store: this.sessionStore,
            secret: secret,
            resave: true,
            saveUninitialized: true
        }));


        const getUser = this.getUserByUserName;
        this.localStrategy = new LocalStrategy(
            {session: true},
            async function verify(uname, pwd, cb) {
                try {
                    const coll = await connection.db(dbName).collection(colName);
                    const query = [
                        {
                            $match: {
                                username: uname
                            }
                        },
                        {
                            $limit: 1
                        },
                        {
                            $lookup: {
                                from: 'groups',
                                localField: 'groups._id',
                                foreignField: '_id',
                                as: 'groups'
                            }
                        }
                    ]
                    /* const user  = await coll.findOne({username : uname},{
                        projection:{
                        }
                    }); */
                    let user = await coll.aggregate(query).toArray()
                    console.log('Got user: ', user)
                    if (!user) {
                        throw new Error("Invalid user");
                    }
                    user = user[0]
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
            console.log("Serializing user:", user);
            const suser = {
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                groups: user.groups,
            }
            done(null, suser)
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
                            groups: 1,
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

        app.use(passport.initialize());
        app.use(passport.session());
        app.use(passport.authenticate('session'))

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
        app.use(passport.authenticate('session'))
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

    async getCurrentSession(origin) {
        return origin
    }
    
}

export class UserController extends AuthorizedGenericController{
    constructor (conn){
        super("user", conn);       
    }
    async new(user){
        if (!this.coll) {
            await this.setCol();
        }
        user = parseGroups(user)
        const [salt, hash] = genHash(user.password);
        const result = await this.coll.insertOne({
            username: user.username,
            salt: salt,
            hash:hash,
            lastName: user.lastName,
            firstName: user.firstName,
            groups: user.groups || []
        });
        return result;
    }

    async userGroups(origin = false, context) {
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }
        const assert = await this.collectionAssertPermission(origin, 'read')
        const query = [
            {
                $match: {
                    '_id': new ObjectId(origin._id)
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'groups._id',
                    foreignField: '_id',
                    as: 'groups'
                }
            },
            {
                $project: {
                    groups: 1
                }
            }
        ]
        console.log('Assert get groups: ', assert)
        const groups = await this.coll.aggregate(query).toArray()
        console.log('User groups: ', groups)
        return groups
    }

    async update(id, user, origin) {
        console.log('User before parse: ', user)
        user = this.parseGroups(user)
        console.log('User after parse: ', user)
        await super.update(id, user, origin)
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

    //Convert groups hex ids to ObjectId
    parseGroups(user) {
        console.log('Groups:', typeof  user.groups)
        if (!user.groups) {
            user.groups = []
            return user
        }
        const newGroups = user.groups.map((group)=>{

            group._id = new ObjectId(group._id)
            console.log('Parsed group: ', group)
            return group
        })
        user.groups=newGroups
        return user
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
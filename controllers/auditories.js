import mongodb from "mongodb";

const ObjectId = mongodb.ObjectId;
let conn;
let coll;
const colName = "auditories";

export const controller = {

    sendDBC :async function (dbc){
        conn = dbc;
        try {
        coll = await conn.db("inventory").collection(colName);
        } catch (err){
            console.log("Error getting db: " + err)
        }
    },

    listItems : async function(){
        try {
            const items = await coll.find({});
            return items;
        } finally {
            return null;
        }
    },

    getItem : async function (item){
        try {
            const item = await coll.getOne({_id : item._id});
            return item;
        } finally {
            return null;
        }
 
    },

    putItem : async function (item){
        try {
            
        }
    },

    deleteItem : async function (item){

    },

    updateItem : async function (item){

    }
}
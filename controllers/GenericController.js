import {ObjectId as _oid} from "mongodb";

export default class GenericController{
    constructor (modelName, connection){
        this.modelName = modelName;
        this.conn = connection;
    }
    
    async setCol(){
        this.coll = await this.conn.db("inventory").collection(this.modelName);
    }

    async list(){
        if (!this.coll){
            await this.setCol();
        }
            const items = await this.coll.find({}).toArray();
            console.log(items);
            return items;
    }
    async getOne(id) {
        if (!this.coll) {
            await this.setCol();
        }
        console.log("GetOne id: ", id)
        const item = await this.coll.findOne({ _id: _oid(id) });
        console.log("GetOne items:", item);
        return item;


    }

    async new(item){
        if (!this.coll) {
            await this.setCol();
        }
        console.log("Trying to store an item ");
        console.log(String(item));
        const result = await this.coll.insertOne(item);
        return ({
            "result": "ok",
            "message": "Item stored successefully",
            "_id": result.insertedId
        });
    }

    async update(id, item){
        if (!this.coll) {
            await this.setCol();
        }
        if (item._id) {
            delete item._id;
        }
        console.log("Ctl update:", item);
        await this.coll.updateOne(
            {"_id" : _oid(id)},
             {$set:item});
    }

    async del(id){
        if (!this.coll) {
            await this.setCol();
        }
        await this.coll.deleteOne({_id : _oid(id)});
    }
}
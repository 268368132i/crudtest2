import {ObjectId} from "mongodb";

export default class GenericController{
    constructor (modelName, connection){
        this.modelName = modelName;
        this.conn = connection;
    }
    
    async setCol(){
        if (!this.coll) {
            this.coll = await this.conn.db("inventory").collection(this.modelName);
        }
        if (!this.authColl) {
            this.authColl = await this.conn.db("collections_access").collection(this.modelName);
        }
    }

    async collectionAssertPermission(origin, permission) {
        let filter
        const collectionPermissions = await this.authColl.findOne({ 'collection': this.modelName })
        if (collectionPermissions.all.indexOf(permission) >= 0) {
            return true
        }

        //find group permissions
        if (!(origin && origin.groups)) return false
        const index = origin.groups.indexOf(collectionPermissions.group._id)
        if (index === -1) {
            return false
        }
        return collectionPermissions.group.permissions.indexOf(permission) > -1
    }

    async list(origin = false){
        if (!(this.coll && authColl)){
            await this.setCol();
        }
        if (!this.collectionAssertPermission(origin, 'read')) {
            throw new Error('Access denied')
        }
            const items = await this.coll.find({}).toArray();
            console.log(items);
            return items;
    }
    async getOne(id) {
        if (!(this.coll && authColl)) {
            await this.setCol();
        }
        console.log("GetOne id: ", id)
        const item = await this.coll.findOne({ _id: ObjectId(id) });
        console.log("GetOne items:", item);
        return item;


    }

    async new(item){
        if (!(this.coll && authColl)) {
            await this.setCol();
        }
        console.log("Trying to store an item ");

        //Converting group's _id
        if(item.group && item.group._id){
            item.group._id= new ObjectId(item.group._id)
        }
        console.log(String(item));
        const result = await this.coll.insertOne(item);
        return ({
            "result": "ok",
            "message": "Item stored successefully",
            "_id": result.insertedId
        });
    }

    async update(id, item){
        if (!(this.coll && authColl)) {
            await this.setCol();
        }
        if (item._id) {
            delete item._id;
        }

        //Converting group's _id
        if(item.group && item.group._id){
            item.group._id=new ObjectId(item.group._id)
        }

        console.log("Ctl update:", item);
        await this.coll.updateOne(
            {"_id" : ObjectId(id)},
             {$set:item});
    }

    async del(id){
        if (!(this.coll && authColl)) {
            await this.setCol();
        }
        await this.coll.deleteOne({_id : ObjectId(id)});
    }
}
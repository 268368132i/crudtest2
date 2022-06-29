import {ObjectId} from "mongodb";
import UnauthorizedException from "../lib/UnauthorizedException.js";

export default class AuthorizedGenericController{
    constructor (modelName, connection, defaultPermissions={read: true, modify: false}){
        this.modelName = modelName;
        this.conn = connection;
        this.defaultPermissions = defaultPermissions
    }
    
    async setCol(){
        if (!this.coll) {
            this.coll = await this.conn.db("inventory").collection(this.modelName);
        }
        if (!this.authColl) {
            this.authColl = await this.conn.db("inventory").collection('collections_access');
        }
    }

    async collectionAssertPermission(origin, permission) {
        let filter
        const query = [ 
            {
                $match: {
                    'collection': this.modelName
                }
            },
         ]
        const collectionPermissions = await this.authColl.aggregate(query).toArray()
        if (collectionPermissions.length === 0){
            return 
        }
        const perms = collectionPermissions[0]
        console.log('Permissions: ', perms/*, ' length: ', collectionPermissions.length*/)
        if (perms.all[permission]) {
            return true
        }

        //find group permissions
        if (!(origin && origin.groups)) return false
        const index = origin.groups.indexOf(perms.group._id)
        if (index === -1) {
            return this.defaultPermissions[permission]
        }
        return perms.group[permission]
    }

    async list(origin = false){
        if (!(this.coll && this.authColl)){
            await this.setCol();
        }
        const assert = await this.collectionAssertPermission(origin, 'read')
        console.log('Got permissions: ', assert)
        if (!assert) {
            throw new UnauthorizedException('Access denied')
        }
            const items = await this.coll.find({}).toArray();
            console.log(items);
            return items;
    }
    async getOne(id) {
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }
        console.log("GetOne id: ", id)
        const item = await this.coll.findOne({ _id: ObjectId(id) });
        console.log("GetOne items:", item);
        return item;


    }

    async new(item){
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }
        const assert = await this.collectionAssertPermission(origin, 'modify')
        console.log('Got permissions: ', assert)
        if (!assert) {
            throw new UnauthorizedException('Access denied')
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
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }

        const assert = await this.collectionAssertPermission(origin, 'modify')
        console.log('Got permissions: ', assert)
        if (!assert) {
            throw new UnauthorizedException('Access denied')
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
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }
        const assert = await this.collectionAssertPermission(origin, 'read')
        console.log('Got permissions: ', assert)
        if (!assert) {
            throw new UnauthorizedException('Access denied')
        }
        await this.coll.deleteOne({_id : ObjectId(id)});
    }
}
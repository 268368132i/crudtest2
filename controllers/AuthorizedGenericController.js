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
            console.log(`No permissions stored for '${this.modelName}'`)
            return false
        }
        const perms = collectionPermissions[0]
        console.log('Permissions: ', perms/*, ' length: ', collectionPermissions.length*/)
        if (perms.all && perms.all[permission]) {
            return true
        }

        //find group permissions
        console.log('Request originated from: ', origin, 'groups: ', origin.groups)
        if (!(origin && origin.groups)) return false
        console.log('User groups: ', origin.groups, '; perms group id: ', perms.group._id)
        // const index = origin.groups.indexOf(String(perms.group._id))
        const index = origin.groups.findIndex((group => {
            return group._id === String(perms.group._id)
        }))
        if (index === -1) {
            console.log('User group not found')
            return this.defaultPermissions[permission]
        }
        console.log('Group permissions: ', perms.group)
        return perms.group[permission]
    }

    async list(origin = false){
        if (!(this.coll && this.authColl)){
            await this.setCol();
        }
        const assert = await this.collectionAssertPermission(origin, 'read')
        console.log('Got permissions: ', assert)
        const query = {}
        if (origin)
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

    async new(item, origin = false){
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }
        const assert = await this.collectionAssertPermission(origin, 'modify')
        console.log('Got permissions: ', assert)
        if (!assert) {
            throw new UnauthorizedException('Access denied')
        }
        console.log("CREATE: Trying to store an item ");

        //Converting user's id
        if (origin && origin._id) {
            item.owner = new ObjectId(origin._id)
        }

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

    async update(id, item, origin=false){
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }

        const assert = await this.collectionAssertPermission(origin, 'modify')
        console.log('UPDAE: Got permissions: ', assert)
        if (!assert) {
            console.log('Throwing UnauthorizedEXception')
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

    async delete(id, origin=false){
        if (!(this.coll && this.authColl)) {
            await this.setCol();
        }
        const assert = await this.collectionAssertPermission(origin, 'read')
        console.log('DELETE: Got permissions: ', assert)
        if (!assert) {
            throw new UnauthorizedException('Access denied')
        }
        await this.coll.deleteOne({_id : ObjectId(id)});
    }
}
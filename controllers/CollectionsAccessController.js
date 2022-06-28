import { ObjectId } from "mongodb";
import GenericController from "./GenericController.js";

export default class CollectionsAccessController extends GenericController{
    constructor(client){
        super('collections_access', client)
    }
    parse(collAcc) {
        if (collAcc.group && collAcc.group._id) {
            collAcc.group._id = new ObjectId(collAcc.group._id)
        }
        console.log('Parsing: ', collAcc)
        return collAcc
    }
}
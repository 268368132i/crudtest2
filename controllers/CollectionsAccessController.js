import { ObjectId } from "mongodb";
// import GenericController from "./GenericController.js";
import AuthorizedGenericController from "./AuthorizedGenericController.js"

// export default class CollectionsAccessController extends GenericController {
export default class CollectionsAccessController extends AuthorizedGenericController {
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
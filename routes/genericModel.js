import express from "express";
import mongodb from "mongodb";

const router = express.Router();
let model;

const ObjectId = mongodb.ObjectId;

let conn;

export function init (dbconn, modelFunctions){
    conn = dbconn;
    model = modelFunctions;
    return router;
}

router.use("/new",express.json());
router.use("/update", express.json());
router.get("/", async (req, res) => {
	console.log(String(conn));
    const arr = await model.listItems();
    console.log(arr);
    res.json(arr);
});

router.get("/:id", async (req, res) => {
	console.log(String(conn));
    const arr = await model.getItem({_id:ObjectId(req.params.id)});
    console.log(arr);
    res.json(arr);
});

router.post("/new", async (req, res)=>{
    console.log("Storing a new item");
    const json = req.body;

    console.log("Json:");
    console.log(json);
    const ret = await model.putItem(json);
    console.log(ret);
    res.json(ret);
});

router.patch("/update/:id", async (req, res)=>{
    console.log("Updating an item");
    const json = req.body;
    console.log("Json:");
    console.log(json);
    json._id = ObjectId(req.params.id);

    const ret = model.updateItem(json);
    console.log(ret);
    res.json(ret);
});

router.delete("/:id", async (req, res)=>{
    console.log("Deleting an item with _id=" + req.params.id);
    
    const ret = await model.deleteItem({"_id":ObjectId(req.params.id)});
    console.log(ret);
    res.json(ret);
});
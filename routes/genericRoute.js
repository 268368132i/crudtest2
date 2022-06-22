import express from "express"


export default class GenericRouter {
    constructor(controller) {
        this.router = express.Router();
        this.ctl = controller;

        this.setGet();
        this.setBodyParser();
        this.setPost();
        this.setDelete();
        this.setPatch();

        //this.router.use("/", express.json());

    }

    setBodyParser(){
        this.router.use("/", express.json());
    }

    setGet(){
        this.router.get("/", async (req, res) => {
            try {
                const items = await this.ctl.list();
                console.log("Router get:", items);
                res.json(items);
            } catch (err){
                console.log(String(err));
                res.status(500).send("");
            }
        });

        this.router.get("/:id", async (req, res) => {
            try {
                const items = await this.ctl.getOne(req.params.id);
                console.log("Router getOne:", items);
                res.json(items);
            } catch (err){
                console.log(String(err));
                res.status(500).send("");
            }
        });
    }

    setPost(){
        this.router.post("/",async(req, res)=>{
            try {
                const result = await this.ctl.new(req.body);
                res.status(201).json(result);
            } catch (err) {
                console.log(String(err));
                res.status(500).send();
            }
        });
    }

    setDelete(){
        this.router.delete("/:id", async(req, res)=>{
            try {
                await this.ctl.del(req.params.id);
                res.status(200).send();
            } catch (err){
                console.log(String(err));
                res.status(500).send();
            }
        });
    }

    setPatch(){
        this.router.patch("/:id",async(req, res)=>{
            try {
                await this.ctl.update(req.params.id,req.body);
                res.status(201).send();
            } catch (err) {
                console.log(String(err));
                res.status(500).send();
            }
        });
    }

    getRouter() {
        return this.router;
    }


}
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
            console.log('Listng...')
            try {
                const items = await this.ctl.list(req.session?.passport?.user);
                //console.log("Router get:", items);
                res.json(items);
            } catch (err){
                console.log(err.status || String(err));
                res.status(err.status || 500).send(err.message || "");
            }
        });

        this.router.get("/:id", async (req, res) => {
            try {
                const items = await this.ctl.getOne(req.params.id, req.session?.passport?.user);
                console.log("Router getOne:", items);
                res.json(items);
            } catch (err){
                console.log(String(err));
                res.status(err.status || 500).send(err.message || "");
            }
        });
    }

    setPost(){
        this.router.post("/",async(req, res)=>{
            try {
                const result = await this.ctl.new(req.body, req.session?.passport?.user);
                res.status(201).json(result);
            } catch (err) {
                console.log(String(err));
                res.status(err.status || 500).send(err.message || "");
            }
        });
    }

    setDelete(){
        this.router.delete("/:id", async(req, res)=>{
            try {
                await this.ctl.del(req.params.id, req.session, req.session?.passport?.user);
                res.status(200).send();
            } catch (err){
                console.log(String(err));
                res.status(err.status || 500).send(err.message || "");
            }
        });
    }

    setPatch(){
        this.router.patch("/:id",async(req, res)=>{
            console.log('Executing PATCH')
            try {
                console.log('Sending data to the controller')
                await this.ctl.update(req.params.id,req.body, req.session?.passport?.user);
                res.status(201).send();
            } catch (err) {
                console.log('Error in PATCH: ', String(err));
                res.status(err.status || 500).send(err.message || "");
            }
        });
    }

    getRouter() {
        return this.router;
    }


}
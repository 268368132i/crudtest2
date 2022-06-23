import GenericRouter from "./genericRoute.js";

export default class UserRouter extends GenericRouter {
    constructor(controller){
        super(controller);

    }
    setPost(){
        this.router.post("/", async(req, res)=>{
            try {
                const result = await this.ctl.new(req.body);
                console.log(`Result ${result}`);
                res.status(201).json(result);
            } catch (err) {
                console.log(String(err));
                res.status(500).send();
            }
        });
    }
    /*setGet(){
        this.router.get("/session",async(req,res)=>{
            console.log("Sending user session");
            console.dir(req);
            res.json({user: req.user, session: req.session});
        });
    }*/
}
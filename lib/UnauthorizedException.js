export default class UnauthorizedException {
    constructor(message=''){
        this.status=403
        this.message = message
    }

    getStatus(){
        return this.status
    }
    getMessage(){
        return this.message
    }
}
import {idleState} from "./idle";

export class receivingActionState{
    constructor() {

    }

    beginAction(){
        console.error("can't begin an action before ending current one")
        return this
    }

    endAction(){
        return new idleState()
    }

    play(){
        console.error("can't play while still receiving an action")
        return this
    }
}
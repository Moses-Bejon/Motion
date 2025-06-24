import {idleState} from "./idle";

export class playingState{
    constructor() {
    }

    beginAction(){
        console.error("can't begin an action while playing an animation")
        return this
    }

    endAction(){
        console.error("can't end an action while playing")
        return this
    }

    play(){
        return new idleState()
    }
}
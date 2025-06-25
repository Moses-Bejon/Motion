import {idleState} from "./idle";

export class playingState{
    constructor() {
    }

    beginAction(){
        console.error("can't begin an action while playing an animation")
        return new idleState()
    }

    takeStep(){
        console.error("can't take a step while playing an animation")
        return new idleState()
    }

    endAction(){
        console.error("can't end an action while playing an animation")
        return new idleState()
    }

    play(){
        return new idleState()
    }
}
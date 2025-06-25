import {receivingActionState} from "./receivingAction.js";
import {playingState} from "./playing.js";

export class idleState{
    constructor() {
    }

    beginAction(){
        return new receivingActionState()
    }

    takeStep(){
        console.error("can't take a step without starting an action")
        return this
    }

    endAction(){
        console.error("can't end an action if haven't started one")
        return this
    }

    play(){
        return new playingState()
    }
}
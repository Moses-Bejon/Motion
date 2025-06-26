import {receivingActionState} from "./receivingAction.js";
import {playingState} from "./playing.js";

export class idleState{
    constructor() {
    }

    beginAction(){
        return new receivingActionState()
    }

    takeStep(){
        throw new Error("can't take a step without starting an action")
    }

    endAction(){
        throw new Error("can't end an action if haven't started one")
    }

    play(){
        return new playingState()
    }
}
import {IdleState} from "./idle.js";

export class PlayingState {
    constructor() {
    }

    beginAction(){
        throw new Error("can't begin an action while playing an animation")
    }

    takeStep(){
        throw new Error("can't take a step while playing an animation")
    }

    endAction(){
        throw new Error("can't end an action while playing an animation")
    }

    play(){
        return new IdleState()
    }
}
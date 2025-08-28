export class ExecutingScriptState {
    constructor() {
    }

    beginAction(){
        throw new Error("can't begin an action while executing a script")
    }

    takeStep(){
        throw new Error("can't take a step while executing a script")
    }

    endAction(){
        throw new Error("can't end an action while executing a script")
    }

    executeScript(script){
        throw new Error("can't execute a new script while still executing a previous script")
    }

    play(){
        throw new Error("can't begin playing the animation while still executing a script")
    }
}
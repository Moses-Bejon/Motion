import {controller} from "../controller.js";

export class tween{
    constructor(startTime,endTime,startState,endState,operation,inverseOperation,shape) {
        this.startTime = startTime
        this.timeLength = endTime - this.startTime
        this.startState = startState
        this.endState = endState
        this.stateLength = this.endState - this.startState
        this.operation = operation
        this.inverseOperation = inverseOperation
        this.shape = shape

        this.previousValue = this.startState
    }

    goToTime(time){

        console.log(this.startTime,this.timeLength)
        console.log(time)
        console.log(this.startState)
        console.log(this.endState)

        const value = this.startState+this.stateLength*(time-this.startTime)/this.timeLength

        console.log(value)

        this.inverseOperation(this.shape,this.previousValue)
        this.operation(this.shape,value)

        this.previousValue = value

        controller.updateShape(this.shape)
    }

    finish(){
        this.inverseOperation(this.shape,this.previousValue)
        this.operation(this.shape,this.endState)

        this.previousValue = this.endState

        controller.updateShape(this.shape)
    }

    beforeStart(){
        this.inverseOperation(this.shape,this.previousValue)
        this.operation(this.shape,this.startState)

        this.previousValue = this.startState

        controller.updateShape(this.shape)
    }
}
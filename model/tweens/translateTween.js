import {controller} from "../../controller.js";
import {tween} from "./tween.js";
import {multiply2dVectorByScalar, subtract2dVectors} from "../../maths.js";

export class translationTween extends tween{
    constructor(translationVector,shape) {

        super(shape)

        this.totalTranslation = translationVector
        this.previousTranslation = [0,0]
    }

    save(){
        const tweenSave = super.save()

        tweenSave.totalTranslation = this.totalTranslation
        tweenSave.tweenType = "translationTween"

        return tweenSave
    }

    load(save){
        this.totalTranslation = save.totalTranslation

        super.load(save)
    }

    goToTime(time){
        const currentTranslation = multiply2dVectorByScalar((time-this.startTime)/this.timeLength,this.totalTranslation)

        const toTranslate = subtract2dVectors(currentTranslation,this.previousTranslation)

        this.shape.translate(toTranslate)

        this.previousTranslation = currentTranslation

        controller.updateShapeWithoutOnionSkins(this.shape)
    }

    finish(){
        this.shape.translate(subtract2dVectors(this.totalTranslation,this.previousTranslation))

        this.previousTranslation = this.totalTranslation

        controller.updateShape(this.shape)
    }

    beforeStart(){
        this.shape.translate(subtract2dVectors([0,0],this.previousTranslation))

        this.previousTranslation = [0,0]

        controller.updateShape(this.shape)
    }
}
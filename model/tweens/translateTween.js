import {controller} from "../../controller.js";
import {Tween} from "./tween.js";
import {multiply2dVectorByScalar, subtract2dVectors} from "../../maths.js";

export class TranslationTween extends Tween{
    constructor(shape) {
        super(shape)
    }

    setup(time,translationVector){
        super.setup(time)

        this.totalTranslation = translationVector
        this.previousTranslation = [0,0]
    }

    static load(save,shape){
        const loadedTween = new TranslationTween(shape)

        loadedTween.totalTranslation = save.totalTranslation
        loadedTween.previousTranslation = save.previousTranslation

        super.loadTimes(save,loadedTween)

        return loadedTween
    }

    save(){
        const tweenSave = super.save()

        tweenSave.tweenType = "translationTween"
        tweenSave.totalTranslation = this.totalTranslation
        tweenSave.previousTranslation = this.previousTranslation

        return tweenSave
    }

    copy(){
        const copy = new TranslationTween(this.shape)
        copy.setup(this.startTime+this.timeLength,this.totalTranslation)
        copy.newStartTime(this.startTime)
        copy.previousTranslation = this.previousTranslation
        return copy
    }

    goToTweenProportion(proportion){

        const currentTranslation = multiply2dVectorByScalar(proportion,this.totalTranslation)

        const toTranslate = subtract2dVectors(currentTranslation,this.previousTranslation)

        controller.currentScene.executeInvisibleSteps([
            ["translate",[this.shape,toTranslate]]
        ])

        this.previousTranslation = currentTranslation
    }

    finish(){
        controller.currentScene.executeInvisibleSteps([
            ["translate",[this.shape,subtract2dVectors(this.totalTranslation,this.previousTranslation)]]
        ])

        this.previousTranslation = this.totalTranslation
    }

    beforeStart(){
        controller.currentScene.executeInvisibleSteps([
            ["translate",[this.shape,subtract2dVectors([0,0],this.previousTranslation)]]
        ])

        this.previousTranslation = [0,0]
    }
}
import {add2dVectors, subtract2dVectors,increment2dVectorBy} from "../../maths.js";
import {controller} from "../../controller.js";
import {Tween} from "./tween.js";

export class ScaleTween extends Tween{
    constructor(shape) {

        super(shape)

        // we need to ensure we don't get confused by our own translations
        this.translationCausedByUs = [0,0]
    }

    setup(time,scaleFactor,aboutCentre){
        super.setup(time)

        this.totalScale = scaleFactor
        this.previousScale = 1

        this.relativeCentre = subtract2dVectors(aboutCentre,this.shape.getOffsetPoint())
    }

    static load(save,shape){
        const loadedTween = new ScaleTween(shape)

        loadedTween.totalScale = save.totalScale
        loadedTween.relativeCentre = save.relativeCentre
        loadedTween.previousScale = save.previousScale
        loadedTween.translationCausedByUs = save.translationCausedByUs

        super.loadTimes(save,loadedTween)

        return loadedTween
    }

    save(){
        const tweenSave = super.save()

        tweenSave.tweenType = "scaleTween"
        tweenSave.totalScale = this.totalScale
        tweenSave.relativeCentre = this.relativeCentre
        tweenSave.previousScale = this.previousScale
        tweenSave.translationCausedByUs = this.translationCausedByUs

        return tweenSave
    }

    copy(){
        const copy = new ScaleTween(this.shape)
        copy.setup(
            this.startTime+this.timeLength,
            this.totalScale,
            add2dVectors(this.relativeCentre,this.shape.getOffsetPoint())
        )
        copy.newStartTime(this.startTime)
        copy.previousScale = this.previousScale
        return copy
    }

    scaleBy(scaleFactor){
        const centre = add2dVectors(
            this.shape.getOffsetPoint(),
            subtract2dVectors(
                this.relativeCentre,
                this.translationCausedByUs
            )
        )

        const positionBeforeScale = this.shape.getOffsetPoint()

        controller.currentScene.executeInvisibleSteps([
            ["scale",[this.shape,scaleFactor,centre]]
        ])

        increment2dVectorBy(this.translationCausedByUs,subtract2dVectors(this.shape.getOffsetPoint(),positionBeforeScale))
    }

    goToTweenProportion(proportion){
        const currentScale = 1+(this.totalScale-1)*proportion

        const amountToScale = currentScale/this.previousScale

        this.scaleBy(amountToScale)

        this.previousScale = currentScale
    }

    finish(){
        this.scaleBy(this.totalScale/this.previousScale)

        this.previousScale = this.totalScale
    }

    beforeStart(){
        this.scaleBy(1/this.previousScale)

        this.previousScale = 1
    }
}
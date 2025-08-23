import {Drawing} from "../model/drawing.js";
import {SceneController} from "./sceneController.js";
import {Ellipse} from "../model/ellipse.js";
import {Graphic} from "../model/graphic.js";
import {Polygon} from "../model/polygon.js";
import {TranslationTween} from "../model/tweens/translateTween.js";
import {RotationTween} from "../model/tweens/rotationTween.js";
import {ScaleTween} from "../model/tweens/scaleTween.js";
import {Shape} from "../model/shape.js";

export class FileSerializer{

    static loadTween(tweenSave){

    }

    constructor() {
    }

    serializeScene(scene){

        const now = scene.clock()

        scene.executeInvisibleSteps([["goToTime",[0]]])

        const file = {
            "aggregateModels":{"allShapes":[],"clock":now},
            "allTweens":[],
            "numberOfEachTypeOfShape":scene.numberOfEachTypeOfShape,
            "ZIndexOfHighestShape":scene.ZIndexOfHighestShape,
            "ZIndexOfLowestShape":scene.ZIndexOfLowestShape,
        }

        const allShapes = []
        this.shapeToReference = new Map()

        this.allTweens = []
        this.tweenToReference = new Map()

        let i = 0
        for (const shape of scene.allShapes()){
            allShapes.push(shape.save(this))
            this.shapeToReference.set(shape,i)

            i++
        }

        file.aggregateModels.allShapes = allShapes
        file.allTweens = this.allTweens

        scene.executeInvisibleSteps([["goToTime",[now]]])

        return JSON.stringify(file)
    }

    async loadScene(save){

        const scene = new SceneController()

        scene.executeInvisibleSteps([["goToTime",[save.aggregateModels.clock]]])

        scene.numberOfEachTypeOfShape = save.numberOfEachTypeOfShape
        scene.ZIndexOfHighestShape = save.ZIndexOfHighestShape
        scene.ZIndexOfLowestShape = save.ZIndexOfLowestShape

        this.tweenReferenceToLoadedTween = new Map()
        this.allTweens = save.allTweens

        for (const shape of save.aggregateModels.allShapes){
            const loadedShape = await this.loadShape(shape)

            scene.executeInvisibleSteps([["restoreShape",[loadedShape]]])
        }

        return scene
    }

    async loadShape(shapeJSON){
        let newShape
        switch (shapeJSON.shapeType){
            case "drawing":
                newShape = Drawing.load(shapeJSON)
                break
            case "ellipse":
                newShape = new Ellipse(
                    shapeJSON.appearanceTime,
                    shapeJSON.disappearanceTime,
                    shapeJSON.ZIndex,
                    shapeJSON.name,
                    shapeJSON.directory,
                    shapeJSON.centre,
                    shapeJSON.height,
                    shapeJSON.width,
                    shapeJSON.outlineColour,
                    shapeJSON.colour,
                    shapeJSON.rotation,
                    shapeJSON.thickness)
                break
            case "graphic":

                newShape = new Graphic(
                    shapeJSON.appearanceTime,
                    shapeJSON.disappearanceTime,
                    shapeJSON.ZIndex,
                    shapeJSON.name,
                    shapeJSON.directory,
                    shapeJSON.source,
                    shapeJSON.topLeft,
                    shapeJSON.rotation)

                await newShape.loadImage()

                newShape.width = shapeJSON.width
                newShape.height = shapeJSON.height

                break
            case "polygon":
                newShape = new Polygon(
                    shapeJSON.appearanceTime,
                    shapeJSON.disappearanceTime,
                    shapeJSON.ZIndex,
                    shapeJSON.name,
                    shapeJSON.directory,
                    shapeJSON.colour,
                    shapeJSON.fillColour,
                    shapeJSON.thickness,
                    shapeJSON.points,
                )
                break
            case "text":
                newShape = new Text(
                    shapeJSON.appearanceTime,
                    shapeJSON.disappearanceTime,
                    shapeJSON.ZIndex,
                    shapeJSON.name,
                    shapeJSON.directory,
                    shapeJSON.bottomLeft,
                    shapeJSON.rotation,
                    shapeJSON.fontColour,
                    shapeJSON.fontSize,
                    shapeJSON.fontFamily)

                newShape.defaultTextReplaced = true
                newShape.text = shapeJSON.text

                break
            default:
                console.error("could not load shape - ",shapeJSON)
        }

        const loadedTimelineEvents = []

        for (const timelineEvent of shapeJSON.timelineEvents){
            loadedTimelineEvents.push(this.loadTimelineEvent(newShape,timelineEvent))
        }

        newShape.timelineEvents = new Set(loadedTimelineEvents)

        return newShape
    }

    serializeSteps(steps){
        const newSteps = []
        for (const step of steps){
            const newStep = [step[0]]

            const newOperands = []

            for (const operand of step[1]){
                if (operand instanceof Shape){
                    newOperands.push({})
                } else{
                    newOperands.push(operand)
                }
            }

            newStep.push(newOperands)
            newSteps.push(newStep)
        }
        return newSteps
    }

    deserializeSteps(steps,shape){
        const newSteps = []
        for (const step of steps){
            const newStep = [step[0]]

            const newOperands = []

            for (const operand of step[1]){
                if (operand.constructor === Object){
                    newOperands.push(shape)
                } else{
                    newOperands.push(operand)
                }
            }

            newStep.push(newOperands)
            newSteps.push(newStep)
        }
        return newSteps
    }

    serializeTimelineEvent(timelineEvent){

        const savedTimelineEvent = {
            "type":timelineEvent.type,
            "time":timelineEvent.time,
            "colour":timelineEvent.colour,
            "forward":this.serializeSteps(timelineEvent.forward),
            "backward":this.serializeSteps(timelineEvent.backward)
        }

        if (Object.hasOwn(timelineEvent,"tween")){
            if (!this.tweenToReference.has(timelineEvent.tween)){
                this.tweenToReference.set(timelineEvent.tween,this.allTweens.length)
                this.allTweens.push(timelineEvent.tween.save())
            }

            savedTimelineEvent.tween = this.tweenToReference.get(timelineEvent.tween)
        }

        return savedTimelineEvent
    }

    loadTimelineEvent(shape,savedTimelineEvent){

        let timelineEvent

        if (Object.hasOwn(savedTimelineEvent,"tween")){

            if (!this.tweenReferenceToLoadedTween.has(savedTimelineEvent.tween)){

                const tween = this.allTweens[savedTimelineEvent.tween]

                let loadedTween

                switch (tween.tweenType){
                    case "translationTween":
                        loadedTween = new TranslationTween([0,0],shape)
                        break
                    case "rotationTween":
                        loadedTween = new RotationTween(0,[0,0],shape)
                        break
                    case "scaleTween":
                        loadedTween = new ScaleTween(1,[0,0],shape)
                        break
                    default:
                        console.error("unrecognised tween type",tween.tweenType)
                }

                loadedTween.load(tween)

                this.tweenReferenceToLoadedTween.set(savedTimelineEvent.tween,loadedTween)
            }

            if (savedTimelineEvent.type === "tweenStart"){
                timelineEvent = this.tweenReferenceToLoadedTween.get(savedTimelineEvent.tween).getTweenStartEvent()
            } else {
                timelineEvent = this.tweenReferenceToLoadedTween.get(savedTimelineEvent.tween).getTweenEndEvent()
            }

            timelineEvent.time = savedTimelineEvent.time
            timelineEvent.colour = savedTimelineEvent.colour

        } else {
            timelineEvent = {
                "type":savedTimelineEvent.type,
                "time":savedTimelineEvent.time,
                "colour":savedTimelineEvent.colour,
                "shape": shape,
                "forward":this.deserializeSteps(savedTimelineEvent.forward,shape),
                "backward":this.deserializeSteps(savedTimelineEvent.backward,shape)
            }
        }

        return timelineEvent
    }

}
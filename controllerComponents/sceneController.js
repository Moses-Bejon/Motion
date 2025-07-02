import {model} from "../model/model.js";
import {controller} from "../controller.js";
import {Drawing} from "../model/drawing.js";
import {binaryInsertion} from "../dataStructureOperations.js";
import {Ellipse} from "../model/ellipse.js";
import {Graphic} from "../model/graphic.js";
import {Polygon} from "../model/polygon.js";
import {ShapeGroup} from "../model/shapeGroup.js";
import {Text} from "../model/text.js";

export class SceneController {
    constructor() {
        // all the aggregate models are permanent, and should be saved at the end of session
        this.aggregateModels = structuredClone(model)

        // used to name shapes
        this.numberOfEachTypeOfShape = {}

        // used to move shapes to front and back
        this.ZIndexOfHighestShape = 0
        this.ZIndexOfLowestShape = -1

        // index of the timeline event in forward state closest to current time i.e. the one that's just been done
        // -1 if there are no timeline events or none in forward state
        this.currentTimelineEvent = -1

        // all the tweens the controller should think about when updating
        this.currentTimelineTweens = new Set()

        this.animationEndTimeSeconds = 10

        // called here to allow for steps to be carried out silently
        this.beginSteps()
    }

    clock(){
        return this.aggregateModels.clock.content
    }

    allShapes(){
        return this.aggregateModels.allShapes.content
    }

    timelineEvents(){
        return this.aggregateModels.timelineEvents.content
    }

    displayShapes(){
        return this.aggregateModels.displayShapes.content
    }

    beginSteps(){
        // keeps track of what changed so view can be instructed accordingly
        for (const model of Object.values(this.aggregateModels)){
            model.modelsToRemove = new Set()
            model.modelsToAdd = new Set()
            model.modelsToUpdate = new Set()
            model.updateModel = false
        }

        // keeps track of any async steps that need to be completed before we tell the views
        this.asyncStepPromises = []

        // keeps track of any return values steps send
        this.returnValues = []
    }

    async finishSteps(){

        // caller handles any errors that occur here:
        await Promise.all(this.asyncStepPromises)

        for (const [modelName,aggregateModel] of Object.entries(this.aggregateModels)){

            if (aggregateModel.updateModel){
                this.#updateAggregateModelForSubscribers(modelName)

                // if the whole model is being updated, no need to bother with individual shapes
                continue
            }

            for (const model of aggregateModel.modelsToRemove){
                this.#removeModelFromSubscribers(modelName,model)

                // no point in updating a model to just remove it anyway
                aggregateModel.modelsToUpdate.delete(model)
            }

            for (const model of aggregateModel.modelsToAdd){
                this.#addModelToSubscribers(modelName,model)

                // adding a model in its current form, after the update, makes the update unnecessary
                aggregateModel.modelsToUpdate.delete(model)
            }

            for (const model of aggregateModel.modelsToUpdate){
                this.#updateModelForSubscribers(modelName,model)
            }
        }
    }

    async executeSteps(steps){
        this.beginSteps()

        this.executeInvisibleSteps(steps)

        // caller handles any errors that occur here:
        await this.finishSteps()

        // these are populated while steps are executed
        return this.returnValues
    }

    // should only be used either:
    // after beginSteps has run and before finishSteps is run
    // state is restored after executeInvisibleSteps has finished running
    // if both of these is not true views will go out of sync with controller
    executeInvisibleSteps(steps){
        for (const step of steps){
            this.#executeStep(step)
        }
    }

    #executeStep([operation,operand]){
        switch (operation){
            // view level operations:
            case "goToTime":
                this.#goToTime(operand[0])
                break
            case "createDrawing":
                this.returnValues.push(this.#newShape(Drawing,operand))
                break
            case "createEllipse":
                this.returnValues.push(this.#newShape(Ellipse,operand))
                break
            case "createGraphic":
                const newGraphic = this.#newShape(Graphic,operand)
                this.asyncStepPromises.push(newGraphic.loadImageSource())

                this.returnValues.push(newGraphic)

                break
            case "createPolygon":
                this.returnValues.push(this.#newShape(Polygon,operand))
                break
            case "createShapeGroup":
                this.returnValues.push(this.#newShape(ShapeGroup,operand))
                break
            case "createText":
                this.returnValues.push(this.#newShape(Text,operand))
                break
            case "deleteShape":
                this.#deleteShape(operand[0])
                break
            case "translate":
                operand[0].translate(operand[1])
                this.#updateShape(operand[0])
                break
            case "rotate":
                operand[0].rotate(operand[1],operand[2])
                this.#updateShape(operand[0])
                break

            // controller level operations:
            case "showShape":
                this.#showShape(operand[0])
                break
            case "hideShape":
                this.#hideShape(operand[0])
                break
            case "restoreShape":
                this.#restoreShape(operand[0])
                break
        }
    }

    #goForwardToTime(time){

        // for every event between now and last event
        for (let i = this.currentTimelineEvent+1;i<this.timelineEvents().length;i++){
            const nextEvent = this.timelineEvents()[i]

            if (nextEvent.time > time){

                // we are just before the place where the time is greater than us
                this.currentTimelineEvent = i-1

                for (const tween of this.currentTimelineTweens){
                    tween.goToTime(time)
                }

                return
            }

            this.executeInvisibleSteps(nextEvent.forward)
        }

        this.currentTimelineEvent = this.timelineEvents().length-1
    }

    #goBackwardToTime(time){

        // for every event between now and first event
        for (let i = this.currentTimelineEvent;i>=0;i--){

            const previousEvent = this.timelineEvents()[i]

            if (previousEvent.time <= time){

                this.currentTimelineEvent = i

                for (const tween of this.currentTimelineTweens){
                    tween.goToTime(time)
                }

                return
            }

            this.executeInvisibleSteps(previousEvent.backward)
        }

        this.currentTimelineEvent = -1
    }

    #goToTime(time){
        if (time < this.clock()){
            this.#goBackwardToTime(time)
        } else{
            this.#goForwardToTime(time)
        }

        this.aggregateModels.clock.content = time

        this.aggregateModels.clock.updateModel = true
    }

    #newShape(shape,operands){

        const appearance = operands[0]
        const disappearance = operands[1]

        const shapeTypeString = shape.name
        if (Object.hasOwn(this.numberOfEachTypeOfShape, shapeTypeString)) {
            this.numberOfEachTypeOfShape[shapeTypeString]++
        } else {
            this.numberOfEachTypeOfShape[shapeTypeString] = 1
        }
        const shapeName = shapeTypeString + " " + this.numberOfEachTypeOfShape[shapeTypeString]

        const shapeInstance =
            new shape(appearance,disappearance,this.ZIndexOfHighestShape, shapeName,this.selectedDirectory,...operands.slice(2))

        this.ZIndexOfHighestShape++

        this.#addModel("allShapes",shapeInstance)

        shapeInstance.appearanceEvent = {
            "type": "appearance",
            "shape": shapeInstance,
            "time": appearance,
            "forward": [["showShape",[shapeInstance]]],
            "backward": [["hideShape",[shapeInstance]]]
        }
        shapeInstance.disappearanceEvent = {
            "type": "disappearance",
            "shape": shapeInstance,
            "time": shapeInstance.disappearanceTime,
            "forward": [["hideShape",[shapeInstance]]],
            "backward": [["showShape",[shapeInstance]]]
        }

        this.#newTimelineEvent(shapeInstance.appearanceEvent)
        this.#newTimelineEvent(shapeInstance.disappearanceEvent)

        return shapeInstance
    }

    #restoreShape(shape){
        this.#addModel("allShapes",shape)

        for (const timelineEvent of shape.timelineEvents){
            this.#addModel("timelineEvents",timelineEvent)
        }
    }

    #deleteShape(shape){
        this.#removeModel("allShapes",shape)

        this.#removeShapeFromTimeline(shape)

        if (shape.appearanceTime <= this.clock() && this.clock() <= shape.disappearanceTime){
            this.#hideShape(shape)
        }

        if (controller.selectedShapesManager.isSelected(shape)) {
            controller.selectedShapesManager.deselectShape(shape)
        }
    }

    #updateShape(shape){
        this.#updateModel("allShapes",shape)

        if (this.displayShapes().has(shape)){
            this.#updateModel("displayShapes",shape)
        }
    }

    #showShape(shape){
        this.#addModel("displayShapes",shape)
    }

    #hideShape(shape){
        this.#removeModel("displayShapes",shape)
    }

    #newTimelineEvent(event){
        event.shape.addTimelineEvent(event)

        this.#addModel("timelineEvents",event)
    }

    #removeShapeFromTimeline(shape){
        for (const timeLineEvent of Array.from(this.timelineEvents())) {
            if (timeLineEvent.shape === shape) {
                this.#removeModel("timelineEvents",timeLineEvent)
            }
        }
    }

    #addModel(aggregateModelName,model){
        const aggregateModel = this.aggregateModels[aggregateModelName]

        if (aggregateModelName === "timelineEvents"){

            const placeToInsert = binaryInsertion(
                this.aggregateModels.timelineEvents.content,
                model.time,
                (timeLineEvent)=>{return timeLineEvent.time}
            )

            this.aggregateModels.timelineEvents.content.splice(placeToInsert,0,model)

            if (model.time <= this.clock()){
                this.currentTimelineEvent ++
            }

            if (model.time <= this.clock()){
                this.executeInvisibleSteps(model.forward)
            }

        } else {
            if (aggregateModel.content.has(model)){
                console.error("attempted to add an existing model")
            }

            aggregateModel.content.add(model)
        }

        // if it was going to be removed, just forget about removing it
        if (aggregateModel.modelsToRemove.has(model)){
            aggregateModel.modelsToRemove.delete(model)
        } else {
            aggregateModel.modelsToAdd.add(model)
        }
    }

    #removeModel(aggregateModelName,model){
        const aggregateModel = this.aggregateModels[aggregateModelName]

        if (aggregateModelName === "timelineEvents"){
            if (model.time <= this.clock()){
                this.currentTimelineEvent --
            }

            this.currentTimelineTweens.delete(model.tween)

            const indexToRemove = aggregateModel.content.indexOf(model)

            if (indexToRemove > -1) {
                aggregateModel.content.splice(indexToRemove, 1)
            } else {
                // indexOf outputs -1 if not in list
                console.error("attempted to remove a non-existing model")
                return
            }
        }
        else
        {
            if (!aggregateModel.content.has(model)) {
                console.error("attempted to remove a non-existing model")
                return
            }

            aggregateModel.content.delete(model)
        }

        // if it was going to be added, just forget about adding it
        if (aggregateModel.modelsToAdd.has(model)){
            aggregateModel.modelsToAdd.delete(model)
        } else {
            aggregateModel.modelsToRemove.add(model)
        }
    }

    #updateModel(aggregateModelName,model){
        const aggregateModel = this.aggregateModels[aggregateModelName]

        aggregateModel.modelsToUpdate.add(model)
    }

    #addModelToSubscribers(aggregateModel,model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.addModel(aggregateModel,model)
        }
    }

    #removeModelFromSubscribers(aggregateModel,model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.removeModel(aggregateModel,model)
        }
    }

    #updateModelForSubscribers(aggregateModel,model,previousModel=model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.updateModel(aggregateModel,model,previousModel)
        }
    }

    #updateAggregateModelForSubscribers(aggregateModel){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.updateAggregateModel(aggregateModel,this.aggregateModels[aggregateModel].content)
        }
    }

    subscribeTo(subscriber,aggregateModel){
        this.aggregateModels[aggregateModel].subscribers.add(subscriber)

        try {
            subscriber.updateAggregateModel(aggregateModel, this.aggregateModels[aggregateModel].content)
        } catch (e){
            console.error(e)
        }
    }

    unsubscribeTo(subscriber,aggregateModel){
        this.aggregateModels[aggregateModel].subscribers.delete(subscriber)
    }
}
import {model} from "../model/model.js";
import {controller} from "../controller.js";
import {Drawing} from "../model/drawing.js";
import {binaryInsertion} from "../dataStructureOperations.js";
import {Ellipse} from "../model/ellipse.js";
import {Graphic} from "../model/graphic.js";
import {Polygon} from "../model/polygon.js";
import {Text} from "../model/text.js";
import {operationToAttribute} from "../typesOfOperation.js";
import {timeEpsilon} from "../globalValues.js";

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
        return Array.from(this.returnValues)
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
                this.returnValues.push(this.clock())
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
            case "createText":
                this.returnValues.push(this.#newShape(Text,operand))
                break
            case "deleteShape":
                this.#deleteShape(operand[0])
                break
            case "translate":
                operand[0].translate(operand[1])
                operand[0].updateGeometry()
                this.#updateShape(operand[0])
                break
            case "rotate":
                operand[0].rotate(operand[1],operand[2])
                operand[0].updateGeometry()
                this.#updateShape(operand[0])
                break
            case "scale":
                operand[0].scale(operand[1],operand[2])
                operand[0].updateGeometry()
                this.#updateShape(operand[0])
                break
            case "duplicate":
                const duplicate = operand[0].copy()

                duplicate.name = operand[0].name + " copy"

                duplicate.ZIndex = this.ZIndexOfHighestShape
                this.ZIndexOfHighestShape ++

                duplicate.directory = this.selectedDirectory

                this.#restoreShape(duplicate)
                this.returnValues.push(duplicate)

                break
            case "swapZIndices":

                const tempZIndex = operand[1].ZIndex

                operand[1].ZIndex = operand[0].ZIndex
                operand[0].ZIndex = tempZIndex

                this.#updateShape(operand[0])
                this.#updateShape(operand[1])
                break
            case "moveToFront":
                this.returnValues.push(operand[0].ZIndex)

                operand[0].ZIndex = this.ZIndexOfHighestShape
                this.ZIndexOfHighestShape ++
                this.#updateShape(operand[0])
                break
            case "moveToBack":
                this.returnValues.push(operand[0].ZIndex)

                operand[0].ZIndex = this.ZIndexOfLowestShape
                this.ZIndexOfLowestShape --
                this.#updateShape(operand[0])
                break
            case "newText":
                this.#executeStep(["shapeAttributeUpdate",[operand[0],"text",operand[1]]])
                operand[0].defaultTextReplaced = true
                break
            case "newAppearanceTime":
                this.#changeTimeOfEvent(operand[0].appearanceEvent,operand[1])

                this.returnValues.push(operand[0].appearanceTime)
                operand[0].appearanceTime = operand[1]
                this.#updateShape(operand[0])
                break
            case "newDisappearanceTime":
                this.#changeTimeOfEvent(operand[0].disappearanceEvent,operand[1])

                this.returnValues.push(operand[0].disappearanceTime)
                operand[0].disappearanceTime = operand[1]
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
            case "shapeAttributeUpdate":
                this.returnValues.push(operand[0][operand[1]])
                operand[0].shapeAttributeUpdate(operand[1],operand[2])
                operand[0].updateGeometry()
                this.#updateShape(operand[0])
                break
            case "addTween":
                operand[0].addTween(operand[1])
                operand[0].goToTime(this.clock())
                this.#updateShape(operand[0])
                break
            case "removeTween":
                operand[0].removeTween(operand[1])
                operand[0].goToTime(this.clock())
                this.#updateShape(operand[0])
                break
            case "newTweenStart":
                this.returnValues.push(operand[0].newStartTime(operand[1]))
                operand[0].shape.goToTime(this.clock())
                break
            case "newTweenEnd":
                this.returnValues.push(operand[0].newEndTime(operand[1]))
                operand[0].shape.goToTime(this.clock())
                break

            case "newShapeAttributeChange":
                operand[0].newShapeAttributeChange(operand[1],operand[2],operand[3])
                operand[0].goToTime(this.clock())
                this.#updateShape(operand[0])
                break

            case "removeShapeAttributeChange":
                operand[0].removeShapeAttributeChange(operand[1],operand[2],operand[3])
                operand[0].goToTime(this.clock())
                this.#updateShape(operand[0])
                break

            case "changeTimeOfShapeAttributeChange":
                this.returnValues.push(operand[2].time)

                operand[0].changeTimeOfShapeAttributeChange(operand[1],operand[2],operand[3])
                operand[0].goToTime(this.clock())
                this.#updateShape(operand[0])
                break

            default:
                if (operationToAttribute[operation] !== undefined){

                    this.#executeStep(
                        ["shapeAttributeUpdate",[operand[0],operationToAttribute[operation],operand[1]]]
                    )

                } else {
                    console.error(`unknown operation: ${operation}`)
                }
        }
    }

    #goForwardToTime(time){

        // for every event between now and last event
        for (let i = this.currentTimelineEvent+1;i<this.timelineEvents().length;i++){
            const nextEvent = this.timelineEvents()[i]

            if (nextEvent.time > time){
                // we are just before the place where the time is greater than us
                this.currentTimelineEvent = i-1
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

        for (const shape of this.displayShapes()){
            shape.goToTime(time)
            this.#updateShape(shape)
        }
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

        const shapeInstance = new shape()
        shapeInstance.setupInScene(
            appearance,
            disappearance,
            this.ZIndexOfHighestShape,
            shapeName,
            this.selectedDirectory,
            ...operands.slice(2)
        )

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

        // ensures the shape has a unique name
        shape.name = this.#findNameWithPrefix(shape.name)

        this.#addModel("allShapes",shape)

        shape.appearanceEvent = {
            "type": "appearance",
            "shape": shape,
            "time": shape.appearanceTime,
            "forward": [["showShape",[shape]]],
            "backward": [["hideShape",[shape]]]
        }
        shape.disappearanceEvent = {
            "type": "disappearance",
            "shape": shape,
            "time": shape.disappearanceTime,
            "forward": [["hideShape",[shape]]],
            "backward": [["showShape",[shape]]]
        }

        this.#newTimelineEvent(shape.appearanceEvent)
        this.#newTimelineEvent(shape.disappearanceEvent)
    }

    #deleteShape(shape){
        this.#removeModel("allShapes",shape)

        this.#removeShapeFromTimeline(shape)

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
        this.#addModel("timelineEvents",event)
    }

    #changeTimeOfEvent(event,newTime){

        if (!this.timelineEvents().includes(event)){
            throw new Error("attempted to change the time of a non-existing timeline event")
        }

        const timeBeforeOperation = this.clock()
        this.#goToTime(Math.min(newTime,event.time)-timeEpsilon)

        this.#unsafeRemoveModelFromTimeline(event)
        event.time = newTime
        this.#unsafeAddModelToTimeline(event)

        this.#goToTime(timeBeforeOperation)

        this.#updateModel("timelineEvents",event)
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
            this.#addModelToTimeline(model)
        } else {
            if (aggregateModel.content.has(model)){
                console.error("attempted to add an existing model")
                return
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

    #unsafeAddModelToTimeline(model){
        const placeToInsert = binaryInsertion(
            this.aggregateModels.timelineEvents.content,
            model.time,
            (timeLineEvent)=>{return timeLineEvent.time}
        )

        this.aggregateModels.timelineEvents.content.splice(placeToInsert,0,model)
    }

    #addModelToTimeline(model){

        const timeBeforeOperation = this.clock()

        // go to time before event happens
        this.#goToTime(model.time-timeEpsilon)

        this.#unsafeAddModelToTimeline(model)

        // return to after event happened, this time with that event happening
        this.#goToTime(timeBeforeOperation)
    }

    #unsafeRemoveModelFromTimeline(model){
        const indexToRemove = this.timelineEvents().indexOf(model)

        if (indexToRemove > -1) {
            this.timelineEvents().splice(indexToRemove, 1)
        } else {
            // indexOf outputs -1 if not in list
            throw new Error("attempted to remove a non-existing model")
        }
    }

    #removeModelFromTimeline(model){

        const timeBeforeOperation = this.clock()

        // go to before event happened
        this.#goToTime(model.time - timeEpsilon)

        this.#unsafeRemoveModelFromTimeline(model)

        // return to after the event happened, this time without the event
        this.#goToTime(timeBeforeOperation)
    }

    #removeModel(aggregateModelName,model){
        const aggregateModel = this.aggregateModels[aggregateModelName]

        if (aggregateModelName === "timelineEvents"){
            try {
                this.#removeModelFromTimeline(model)
            } catch (e) {
                console.error(e)
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

    #checkIfShapeWithName(name){
        for (const shape of this.allShapes()){
            if (shape.name === name){
                return true
            }
        }
        return false
    }

    #findNameWithPrefix(namePrefix){
        let name = namePrefix

        let attempt = 1
        while (this.#checkIfShapeWithName(name)){
            name = `${namePrefix} (${attempt})`
            attempt ++
        }

        return name
    }

    #addModelToSubscribers(aggregateModel,model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            try {
                subscriber.addModel(aggregateModel,model)
            } catch (e){
                console.error(e)
            }
        }
    }

    #removeModelFromSubscribers(aggregateModel,model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            try {
                subscriber.removeModel(aggregateModel,model)
            } catch (e){
                console.error(e)
            }
        }
    }

    #updateModelForSubscribers(aggregateModel,model,previousModel=model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){

            try {
                subscriber.updateModel(aggregateModel,model,previousModel)
            } catch (e){
                console.error(e)
            }
        }

        // ensures selected shape is updated for any subscribers
        if (controller.selectedShapesManager.isSelected(model)){
            controller.selectedShapesManager.deselectShape(model)
            controller.selectedShapesManager.selectShape(model)
        }
    }

    #updateAggregateModelForSubscribers(aggregateModel){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            try {
                subscriber.updateAggregateModel(aggregateModel,this.aggregateModels[aggregateModel].content)
            } catch (e){
                console.error(e)
            }
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
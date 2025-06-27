import {model} from "../model/model.js";
import {Drawing} from "../model/drawing.js";
import {binaryInsertion} from "../dataStructureOperations.js";

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
    }

    beginSteps(){
        // keeps track of what changed so view can be instructed accordingly
        for (const model of Object.values(this.aggregateModels)){
            model.modelsToRemove = new Set()
            model.modelsToAdd = new Set()
            model.modelsToUpdate = new Set()
            model.updateModel = false
        }
    }

    finishSteps(){
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

    executeSteps(steps){
        this.beginSteps()

        for (const step of steps){
            this.#executeStep(step)
        }

        this.finishSteps()
    }

    #executeStep([operation,operand]){
        switch (operation){
            case "createDrawing":
                this.#newShape(Drawing,operand)
                break
        }
    }

    #newShape(shape,operands){

        const appearance = operands[0]
        const disappearance = operands[1]

        const shapeTypeString = shape.name.charAt(0).toUpperCase() + shape.constructor.name.slice(1)
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
            "forward": () => {this.#showShape(shapeInstance)},
            "backward": () => {this.#hideShape(shapeInstance)}
        }
        shapeInstance.disappearanceEvent = {
            "type": "disappearance",
            "shape": shapeInstance,
            "time": shapeInstance.disappearanceTime,
            "forward": () => {this.#hideShape(shapeInstance)},
            "backward": () => {this.#showShape(shapeInstance)}
        }

        this.#addTimelineEvent(shapeInstance.appearanceEvent)
        this.#addTimelineEvent(shapeInstance.disappearanceEvent)
    }

    #showShape(shape){
        this.#addModel("displayShapes",shape)
    }

    #hideShape(shape){
        this.#removeModel("displayShapes",shape)
    }

    #addTimelineEvent(event){
        event.shape.addTimelineEvent(event)

        if (event.time <= this.aggregateModels.clock.content){
            event.forward()
        }

        this.#addModel("timelineEvents",event)
    }

    #addModel(aggregateModelName,model){
        const aggregateModel = this.aggregateModels[aggregateModelName]

        if (aggregateModelName === "timelineEvents"){
            const placeToInsert = binaryInsertion(
                this.aggregateModels.timelineEvents.content,
                model.time,
                (timeLineEvent)=>{return timeLineEvent.time}
            )

            this.aggregateModels.timelineEvents.content.splice(placeToInsert,0,event)

            if (model.time <= this.aggregateModels.clock.content){
                this.currentTimelineEvent ++
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

        if (!aggregateModel.content.has(model)){
            console.error("attempted to remove a non-existing model")
        }

        aggregateModel.content.delete(model)

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

    selectShape(shape){

        if (this.isSelected(shape)){
            throw new Error("attempt to select already selected shape")
        }

        this.aggregateModels.selectedShapes.content.add(shape)
    }

    deselectShape(shape){
        if (!this.isSelected(shape)){
            throw new Error("attempt to deselect unselected shape")
        }

        this.aggregateModels.selectedShapes.content.delete(shape)
    }

    isSelected(shape){
        return this.selectedShapes().has(shape)
    }
}
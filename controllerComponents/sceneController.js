import {model} from "../model/model.js";

export class SceneController {
    constructor() {
        // all the aggregate models are permanent, and should be saved at the end of session
        this.aggregateModels = structuredClone(model)

        // used to name shapes
        this.numberOfEachTypeOfShape = {}

        // used to move shapes to front and back
        this.ZIndexOfHighestShape = 0
        this.ZIndexOfLowestShape = 0

        // index of the timeline event in forward state closest to current time i.e. the one that's just been done
        // -1 if there are no timeline events or none in forward state
        this.currentTimelineEvent = -1

        // all the tweens the controller should think about when updating
        this.currentTimelineTweens = new Set()

        this.animationEndTimeSeconds = 10
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
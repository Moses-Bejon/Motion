import {model} from "../model/model.js";

export class sceneController{
    constructor() {
        // all the aggregate models are permanent, and should be saved at the end of session
        this.aggregateModels = structuredClone(model)

        // index of the timeline event in forward state closest to current time i.e. the one that's just been done
        // -1 if there are no timeline events or none in forward state
        this.currentTimelineEvent = -1

        // all the tweens the controller should think about when updating
        this.currentTimelineTweens = new Set()

        this.animationEndTimeSeconds = 10
    }

    selectShape(shape){

        if (this.isSelected(shape)){
            console.error("attempt to select already selected shape")
            return false
        }

        this.aggregateModels.selectedShapes.content.add(shape)
        return true
    }

    deselectShape(shape){
        if (!this.isSelected(shape)){
            console.error("attempt to deselect unselected shape")
            return false
        }

        this.aggregateModels.selectedShapes.content.delete(shape)
        return true
    }

    isSelected(shape){
        return this.selectedShapes().has(shape)
    }
}
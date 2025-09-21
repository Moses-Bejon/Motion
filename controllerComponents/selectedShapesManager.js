import {validateShapeList,validateShape} from "../validator.js";

export class SelectedShapesManager{
    constructor() {
        this.selectedShapes = new Set()

        this.selectedShapesSubscribers = new Set()

        this.shapesToUpdate = new Set()
    }

    subscribeToSelectedShapes(subscriber){
        this.selectedShapesSubscribers.add(subscriber)
        subscriber.updateAggregateModel("selectedShapes",this.selectedShapes)
    }

    unsubscribeToSelectedShapes(subscriber){
        this.selectedShapesSubscribers.delete(subscriber)
    }

    selectNewShapes(shapes){

        if (!validateShapeList(shapes)){
            throw new Error("invalid shape list sent to selected shapes manager")
        }

        this.selectedShapes = new Set(shapes)

        for (const subscriber of this.selectedShapesSubscribers){
            try {
                subscriber.updateAggregateModel("selectedShapes",this.selectedShapes)
            } catch (e){
                console.error(e)
            }
        }
    }

    selectShape(shape){

        if (!validateShape(shape)){
            throw new Error("invalid shape sent to selected shapes manager")
        }

        if (this.isSelected(shape)){
            throw new Error("attempt to select already selected shape")
        }

        this.selectedShapes.add(shape)

        for (const subscriber of this.selectedShapesSubscribers){
            try{
                subscriber.addModel("selectedShapes",shape)
            } catch (e){
                console.error(e)
            }
        }
    }

    deselectShape(shape){
        if (!this.isSelected(shape)){
            throw new Error("attempt to deselect unselected shape")
        }

        this.selectedShapes.delete(shape)

        for (const subscriber of this.selectedShapesSubscribers){
            try{
                subscriber.removeModel("selectedShapes",shape)
            } catch (e){
                console.error(e)
            }

        }
    }

    addShapeToUpdate(shape){
        if (!this.isSelected(shape)){
            throw new Error("attempt to update unselected shape")
        }

        this.shapesToUpdate.add(shape)
    }

    updateShapes(){
        for (const shape of this.shapesToUpdate){
            for (const subscriber of this.selectedShapesSubscribers){
                try{
                    subscriber.updateModel("selectedShapes",shape)
                } catch (e){
                    console.error(e)
                }
            }
        }

        this.shapesToUpdate = new Set()
    }

    isSelected(shape){
        return this.selectedShapes.has(shape)
    }
}
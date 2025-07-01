export class SelectedShapesManager{
    constructor() {
        this.selectedShapes = new Set()

        this.selectedShapesSubscribers = new Set()
    }

    subscribeToSelectedShapes(subscriber){
        this.selectedShapesSubscribers.add(subscriber)
        subscriber.updateAggregateModel("selectedShapes",this.selectedShapes)
    }

    unsubscribeToSelectedShapes(subscriber){
        this.selectedShapesSubscribers.delete(subscriber)
    }

    selectNewShapes(shapes){
        this.selectedShapes = new Set(shapes)

        for (const subscriber of this.selectedShapesSubscribers){
            subscriber.updateAggregateModel("selectedShapes",this.selectedShapes)
        }
    }

    selectShape(shape){

        if (this.isSelected(shape)){
            throw new Error("attempt to select already selected shape")
        }

        this.selectedShapes.add(shape)

        for (const subscriber of this.selectedShapesSubscribers){
            subscriber.addModel("selectedShapes",shape)
        }
    }

    deselectShape(shape){
        if (!this.isSelected(shape)){
            throw new Error("attempt to deselect unselected shape")
        }

        this.selectedShapes.delete(shape)

        for (const subscriber of this.selectedShapesSubscribers){
            subscriber.removeModel("selectedShapes",shape)
        }
    }

    isSelected(shape){
        return this.selectedShapes.has(shape)
    }


}
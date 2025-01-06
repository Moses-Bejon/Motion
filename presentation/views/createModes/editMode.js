import {controller} from "../../../controller.js";

export class editMode{
    constructor(editCanvas) {
        this.editCanvas = editCanvas

        // when you click on the canvas, but not on any particular shape, deselect all selected shapes
        this.editCanvas.onclick = () => {
            controller.newAggregateModel("selectedShapes",new Set())
        }

        // getting up to speed on all the shapes displayed on the canvas
        this.updateAggregateModel("displayShapes",controller.aggregateModels.displayShapes.content)
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){
        this.editCanvas.onclick = null
        for (const [shape,geometry] of this.editCanvas.shapesToGeometry){
            geometry.onclick = null
        }
    }

    addModel(aggregateModel,model){
        // canvas view tells us about both display shapes and selected shapes
        // we only care about display shapes
        if (aggregateModel !== "displayShapes"){
            return
        }

        const geometry = this.editCanvas.shapesToGeometry.get(model)

        geometry.onclick = (event) => {

            // stop the canvas from being clicked and deselecting everything
            event.stopPropagation()

            controller.newAggregateModel("selectedShapes",new Set([model]))
        }
    }

    updateAggregateModel(aggregateModel,model){
        if (aggregateModel !== "displayShapes"){
            return
        }

        for (const shape of model){
            this.addModel(aggregateModel,shape)
        }
    }
}
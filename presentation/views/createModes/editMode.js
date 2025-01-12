import {controller} from "../../../controller.js";
import {addDragLogicTo} from "../../../dragLogic.js";

export class editMode{
    constructor(editCanvas) {
        this.editCanvas = editCanvas

        this.bindedDeselectAll = this.deselectAll.bind(this)

        // when you click on the canvas, but not on any particular shape, deselect all selected shapes
        this.editCanvas.addFunctionToPerformOnClick(this.bindedDeselectAll)

        addDragLogicTo(this.editCanvas.canvas,
            this.continueBoxSelection.bind(this),
            this.finishBoxSelection.bind(this),
            this.beginBoxSelection.bind(this),
            "auto",
            "auto")

        // getting up to speed on all the shapes displayed on the canvas
        this.updateAggregateModel("displayShapes",controller.aggregateModels.displayShapes.content)
    }

    beginBoxSelection(pointerEvent){
        // ensuring the selection box is on the svg
        this.editCanvas.selectionBoxGeometry?.remove()
        this.editCanvas.canvas.appendChild(this.editCanvas.selectionBoxGeometry)

        this.beganBoxAt = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        // prevents canvas from being clicked and deselecting everything
        pointerEvent.stopPropagation()
    }

    continueBoxSelection(pointerEvent){
        const currentBoxFinish = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        let top
        let bottom
        let left
        let right

        if (currentBoxFinish[1] > this.beganBoxAt[1]){
            top = this.beganBoxAt[1]
            bottom = currentBoxFinish[1]
        } else {
            top = currentBoxFinish[1]
            bottom = this.beganBoxAt[1]
        }

        if (currentBoxFinish[0] > this.beganBoxAt[0]){
            left = this.beganBoxAt[0]
            right = currentBoxFinish[0]
        } else {
            left = currentBoxFinish[0]
            right = this.beganBoxAt[0]
        }

        this.editCanvas.selectionBoxInstance.positionSelectionBox(top,bottom,left,right)

        return [top,bottom,left,right]
    }

    finishBoxSelection(pointerEvent){

        const [top,bottom,left,right] = this.continueBoxSelection(pointerEvent)

        const newlySelectedShapes = new Set()

        for (const shape of controller.aggregateModels.displayShapes.content){
            if (top < shape.top && bottom > shape.bottom && left < shape.left && right > shape.right){
                newlySelectedShapes.add(shape)
            }
        }

        if (pointerEvent.shiftKey){
            for (const shape of newlySelectedShapes){
                controller.selectShape(shape)
            }
        } else {
            controller.newAggregateModel("selectedShapes",newlySelectedShapes)
        }

        this.editCanvas.selectionBoxGeometry.remove()
        this.editCanvas.updateSelectionBox()
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){
        this.editCanvas.removeFunctionToPerformOnClick(this.bindedDeselectAll)
        this.editCanvas.canvas.onpointerdown = null
        for (const [shape,geometry] of this.editCanvas.shapesToGeometry){
            geometry.onpointerdown = null
        }
    }

    addModel(aggregateModel,model){
        // canvas view tells us about both display shapes and selected shapes
        // we only care about display shapes
        if (aggregateModel !== "displayShapes"){
            return
        }

        const geometry = this.editCanvas.shapesToGeometry.get(model)

        geometry.onpointerdown = (event) => {
            // stop the canvas from being clicked and deselecting everything
            event.stopPropagation()

            if (event.shiftKey){
                controller.selectShape(model)
            } else {
                controller.newAggregateModel("selectedShapes",new Set([model]))
            }
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

    deselectAll(){
        controller.newAggregateModel("selectedShapes",new Set())
    }
}
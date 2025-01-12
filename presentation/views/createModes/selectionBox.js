import {addDragLogicTo} from "../../../dragLogic.js";
import {subtract2dVectors} from "../../../maths.js";
import {controller} from "../../../controller.js";

export class selectionBox{
    constructor(editCanvas) {
        this.editCanvas = editCanvas

        this.selectionBox = document.createElementNS("http://www.w3.org/2000/svg","g")

        this.selectionOutline = document.createElementNS("http://www.w3.org/2000/svg","rect")
        this.selectionOutline.setAttribute("stroke-dasharray","4 11")
        this.selectionOutline.style.fill = "transparent"
        this.selectionOutline.style.stroke = "black"
        this.selectionOutline.style.strokeWidth = 1

        this.selectionBox.appendChild(this.selectionOutline)

        const selectionScalingNode = document.createElementNS("http://www.w3.org/2000/svg","circle")
        selectionScalingNode.setAttribute("r",5)
        selectionScalingNode.style.fill = "black"
        selectionScalingNode.style.stroke = "white"
        selectionScalingNode.style.strokeWidth = 1

        this.topLeftScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.topLeftScalingNode)
        this.topRightScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.topRightScalingNode)
        this.bottomLeftScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.bottomLeftScalingNode)
        this.bottomRightScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.bottomRightScalingNode)
        this.topMiddleScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.topMiddleScalingNode)
        this.bottomMiddleScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.bottomMiddleScalingNode)
        this.leftMiddleScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.leftMiddleScalingNode)
        this.rightMiddleScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.rightMiddleScalingNode)

        // logic for moving the selection box (along with all the shapes in it)
        addDragLogicTo(
            this.selectionBox,
            this.dragSelectionBox.bind(this),
            this.endDraggingSelectionBox.bind(this),
            this.beginDraggingSelectionBox.bind(this)
        )
    }

    positionSelectionBox(selectionTop,selectionBottom,selectionLeft,selectionRight){

        const horizontalCentre = (selectionLeft+selectionRight)/2
        const verticalCentre = (selectionTop+selectionBottom)/2

        this.selectionOutline.setAttribute("x",selectionLeft)
        this.selectionOutline.setAttribute("y",selectionTop)
        this.selectionOutline.setAttribute("width",selectionRight-selectionLeft)
        this.selectionOutline.setAttribute("height",selectionBottom-selectionTop)

        this.topLeftScalingNode.setAttribute("cx",selectionLeft)
        this.topLeftScalingNode.setAttribute("cy",selectionTop)
        this.topRightScalingNode.setAttribute("cx",selectionRight)
        this.topRightScalingNode.setAttribute("cy",selectionTop)
        this.bottomLeftScalingNode.setAttribute("cx",selectionLeft)
        this.bottomLeftScalingNode.setAttribute("cy",selectionBottom)
        this.bottomRightScalingNode.setAttribute("cx",selectionRight)
        this.bottomRightScalingNode.setAttribute("cy",selectionBottom)
        this.topMiddleScalingNode.setAttribute("cx",horizontalCentre)
        this.topMiddleScalingNode.setAttribute("cy",selectionTop)
        this.bottomMiddleScalingNode.setAttribute("cx",horizontalCentre)
        this.bottomMiddleScalingNode.setAttribute("cy",selectionBottom)
        this.leftMiddleScalingNode.setAttribute("cx",selectionLeft)
        this.leftMiddleScalingNode.setAttribute("cy",verticalCentre)
        this.rightMiddleScalingNode.setAttribute("cx",selectionRight)
        this.rightMiddleScalingNode.setAttribute("cy",verticalCentre)

        return this.selectionBox
    }

    beginDraggingSelectionBox(pointerEvent){
        this.previousSelectionPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        // avoids other modes interfering, like you wouldn't want to start drawing while moving the box
        pointerEvent.stopPropagation()
    }

    dragSelectionBox(pointerEvent){
        const currentSelectionPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)
        const translation = subtract2dVectors(currentSelectionPosition,this.previousSelectionPosition)

        // a css transformation is used in place of actually updating the geometry, as done at the end of the drag
        // (for performance)
        const transformation = `translate(${translation[0]}px, ${translation[1]}px)`

        for (const shape of this.editCanvas.selectedShapes){
            const geometry = this.editCanvas.shapesToGeometry.get(shape)
            geometry.style.transform = transformation
        }

        this.selectionBox.style.transform = transformation

        pointerEvent.stopPropagation()
    }

    endDraggingSelectionBox(pointerEvent){
        const currentSelectionPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        const translation = subtract2dVectors(currentSelectionPosition,this.previousSelectionPosition)

        // a new set is used because, as this loop runs and the geometry is updated, the set is changing
        // this is because of calls the controller is making
        for (const shape of new Set(this.editCanvas.selectedShapes)){
            shape.translate(translation)
            shape.updateGeometry()

            controller.updateModel("displayShapes",shape)
            controller.updateModel("selectedShapes",shape)
        }

        this.selectionBox.style.transform = null

        pointerEvent.stopPropagation()

    }
}
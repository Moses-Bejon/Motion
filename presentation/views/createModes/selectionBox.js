import {addDragLogicTo} from "../../../dragLogic.js";
import {
    angleBetweenThreePoints,
    getDistanceToStraightLineThrough,
    subtract2dVectors
} from "../../../maths.js";
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

        this.rotateIcon = document.createElementNS("http://www.w3.org/2000/svg","image")
        this.rotateIcon.setAttribute("href","../../../assets/rotate.svg")
        this.rotateIcon.style.width = "50px"
        this.rotateIcon.style.height = "50px"
        this.selectionBox.appendChild(this.rotateIcon)

        addDragLogicTo(
            this.rotateIcon,
            this.dragRotateIcon.bind(this),
            this.endDraggingRotateIcon.bind(this),
            this.beginDraggingRotateIcon.bind(this)
        )

        const selectionScalingNode = document.createElementNS("http://www.w3.org/2000/svg","circle")
        selectionScalingNode.setAttribute("r",5)
        selectionScalingNode.style.fill = "black"
        selectionScalingNode.style.stroke = "white"
        selectionScalingNode.style.strokeWidth = 1

        this.topLeftScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.topLeftScalingNode)

        addDragLogicTo(
            this.topLeftScalingNode,
            this.dragScalingNode.bind(this),
            this.endDraggingScalingNodePreserveAspectRatio.bind(this),
            (pointerEvent) => {
                this.beginDraggingScalingNode(
                    pointerEvent,
                    [this.right,this.bottom],
                    [this.left,this.bottom],
                    [this.right,this.top]
                )
            },
            "nwse-resize",
            "nwse-resize"
        )

        this.topRightScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.topRightScalingNode)

        addDragLogicTo(
            this.topRightScalingNode,
            this.dragScalingNode.bind(this),
            this.endDraggingScalingNodePreserveAspectRatio.bind(this),
            (pointerEvent) => {
                this.beginDraggingScalingNode(
                    pointerEvent,
                    [this.left,this.bottom],
                    [this.left,this.top],
                    [this.right,this.bottom]
                )
            },
            "nesw-resize",
            "nesw-resize"
        )

        this.bottomLeftScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.bottomLeftScalingNode)

        addDragLogicTo(
            this.bottomLeftScalingNode,
            this.dragScalingNode.bind(this),
            this.endDraggingScalingNodePreserveAspectRatio.bind(this),
            (pointerEvent) => {
                this.beginDraggingScalingNode(
                    pointerEvent,
                    [this.right,this.top],
                    [this.left,this.top],
                    [this.right,this.bottom]
                )
            },
            "nesw-resize",
            "nesw-resize"
        )

        this.bottomRightScalingNode = selectionScalingNode.cloneNode(false)
        this.selectionBox.appendChild(this.bottomRightScalingNode)

        addDragLogicTo(
            this.bottomRightScalingNode,
            this.dragScalingNode.bind(this),
            this.endDraggingScalingNodePreserveAspectRatio.bind(this),
            (pointerEvent) => {
                this.beginDraggingScalingNode(
                    pointerEvent,
                    [this.left,this.top],
                    [this.left,this.bottom],
                    [this.right,this.top]
                )
            },
            "nwse-resize",
            "nwse-resize"
        )

        // logic for moving the selection box (along with all the shapes in it)
        addDragLogicTo(
            this.selectionBox,
            this.dragSelectionBox.bind(this),
            this.endDraggingSelectionBox.bind(this),
            this.beginDraggingSelectionBox.bind(this)
        )
    }

    positionSelectionBox(selectionTop,selectionBottom,selectionLeft,selectionRight){
        this.top = selectionTop
        this.bottom = selectionBottom
        this.left = selectionLeft
        this.right = selectionRight

        this.verticalCentre = (selectionTop+selectionBottom)/2
        this.horizontalCentre = (selectionLeft+selectionRight)/2
        this.centre = [this.horizontalCentre,this.verticalCentre]

        this.selectionOutline.setAttribute("x",selectionLeft)
        this.selectionOutline.setAttribute("y",selectionTop)
        this.selectionOutline.setAttribute("width",selectionRight-selectionLeft)
        this.selectionOutline.setAttribute("height",selectionBottom-selectionTop)

        this.rotateIcon.setAttribute("x",this.horizontalCentre-25)
        this.rotateIcon.setAttribute("y",selectionTop-50)

        this.topLeftScalingNode.setAttribute("cx",selectionLeft)
        this.topLeftScalingNode.setAttribute("cy",selectionTop)
        this.topRightScalingNode.setAttribute("cx",selectionRight)
        this.topRightScalingNode.setAttribute("cy",selectionTop)
        this.bottomLeftScalingNode.setAttribute("cx",selectionLeft)
        this.bottomLeftScalingNode.setAttribute("cy",selectionBottom)
        this.bottomRightScalingNode.setAttribute("cx",selectionRight)
        this.bottomRightScalingNode.setAttribute("cy",selectionBottom)

        return this.selectionBox
    }

    beginDraggingRotateIcon(pointerEvent){
        this.newTransformOrigin(this.centre)

        this.initialPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        pointerEvent.stopPropagation()
    }

    dragRotateIcon(pointerEvent){
        const currentPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        let angle

        if (currentPosition[0] > this.initialPosition[0]) {
            angle = angleBetweenThreePoints(currentPosition,this.centre,this.initialPosition)
        } else{
            angle = 2*Math.PI - angleBetweenThreePoints(currentPosition,this.centre,this.initialPosition)
        }

        this.transform(`rotate(${angle}rad)`)
        return angle
    }

    endDraggingRotateIcon(pointerEvent){
        const rotationAngle = this.dragRotateIcon(pointerEvent)

        this.selectionBox.style.transform = null

        this.globalTransform((shape) => {shape.rotate(rotationAngle,this.transformOrigin)})

        pointerEvent.stopPropagation()
    }

    beginDraggingScalingNode(pointerEvent, pointScalingAround, gradientPoint1, gradientPoint2){
        this.newTransformOrigin(pointScalingAround)

        // draws a straight line parallel to two corners, going through the point we are scaling around
        // we use minimum distance to that line to judge how much to increase the scale by

        this.distanceToScaleBy = getDistanceToStraightLineThrough(gradientPoint1,gradientPoint2,pointScalingAround)

        const currentPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        this.initialDistance = this.distanceToScaleBy(currentPosition)

        pointerEvent.stopPropagation()
    }

    dragScalingNode(pointerEvent){
        const currentPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)
        const scale = this.distanceToScaleBy(currentPosition)/this.initialDistance

        this.transform(`scale(${scale})`)

        return scale
    }

    endDraggingScalingNodePreserveAspectRatio(pointerEvent){
        const scaleFactor = this.dragScalingNode(pointerEvent)

        this.selectionBox.style.transform = null

        this.globalTransform((shape) => {shape.scale(scaleFactor,this.transformOrigin)})

        pointerEvent.stopPropagation()
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

        this.transform(transformation)

        pointerEvent.stopPropagation()
    }

    endDraggingSelectionBox(pointerEvent){
        const currentSelectionPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        const translation = subtract2dVectors(currentSelectionPosition,this.previousSelectionPosition)

        this.globalTransform((shape) => {shape.translate(translation)})

        this.selectionBox.style.transform = null

        pointerEvent.stopPropagation()

    }

    transform(transformation){
        this.selectionBox.style.transform = transformation

        for (const shape of this.editCanvas.selectedShapes){
            const geometry = this.editCanvas.shapesToGeometry.get(shape)
            geometry.style.transform = transformation
        }
    }

    newTransformOrigin(point){
        this.transformOrigin = point

        const transformOrigin = `${point[0]}px ${point[1]}px`

        this.selectionBox.style.transformOrigin = transformOrigin

        for (const shape of this.editCanvas.selectedShapes){
            const geometry = this.editCanvas.shapesToGeometry.get(shape)
            geometry.style.transformOrigin = transformOrigin
        }
    }

    globalTransform(transformation){
        // a new set is used because, as this loop runs and the geometry is updated, the set is changing
        // this is because of calls the controller is making
        for (const shape of new Set(this.editCanvas.selectedShapes)){
            transformation(shape)

            controller.updateModel("displayShapes",shape)
            controller.updateModel("selectedShapes",shape)
        }
    }
}
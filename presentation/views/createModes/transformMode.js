import {addDragLogicTo} from "../../../dragLogic.js";
import {AngleTracker, distanceBetween2dPoints,} from "../../../maths.js";
import {EditMode} from "./editMode.js";
import {rotatePath} from "../../../assets/rotatePath.js"
import {canvasOverlayUISize} from "../../../constants.js";

// the rotate overlay needs to be larger than the scale overlay so the scale overlay fits within it
const rotateOverlaySize = 1.75*canvasOverlayUISize

export class TransformMode {
    constructor(editCanvas) {
        this.editCanvas = editCanvas

        this.transformUI = document.createElementNS("http://www.w3.org/2000/svg","g")

        this.rotateImage = document.createElementNS("http://www.w3.org/2000/svg","svg")
        this.rotateImage.style.overflow = "visible"
        this.rotateImage.setAttribute("viewBox","-5.0 -10.0 110.0 120.0")

        // the rotation is larger than the scaling, so the overlay size is larger than usual
        this.rotateImage.setAttribute("width",rotateOverlaySize)
        this.rotateImage.setAttribute("height",rotateOverlaySize)
        this.rotateImage.innerHTML = rotatePath

        this.rotateUI = this.rotateImage.firstChild

        addDragLogicTo(
            this.rotateUI,
            this.continueRotating.bind(this),
            this.finishRotating.bind(this),
            this.beginRotating.bind(this),
            `url("assets/rotate.png") 16 16,grab`,
            `url("assets/rotate.png") 16 16,grab`
        )

        this.transformUI.appendChild(this.rotateImage)

        this.scaleUI = document.createElementNS("http://www.w3.org/2000/svg","image")
        this.scaleUI.setAttribute("href","assets/scale.svg")
        this.scaleUI.style.width = `${canvasOverlayUISize}px`
        this.scaleUI.style.height = `${canvasOverlayUISize}px`

        addDragLogicTo(
            this.scaleUI,
            this.continueScaling.bind(this),
            this.finishScaling.bind(this),
            this.beginScaling.bind(this)
        )

        this.transformUI.prepend(this.scaleUI)

        this.editCanvas.canvas.appendChild(this.transformUI)

        this.bindedReposition = this.positionTransform.bind(this)

        this.editCanvas.addFunctionToPerformOnClick(this.bindedReposition)
    }

    newTransformOrigin(point){
        this.transformOrigin = point

        const transformOrigin = `${point[0]}px ${point[1]}px`

        // the rotate UI SVG has centre 50,50
        this.rotateUI.style.transformOrigin = `50px 50px`
        this.scaleUI.style.transformOrigin = transformOrigin

        this.editCanvas.selectionBoxGeometry.style.transformOrigin = transformOrigin

        for (const shape of this.editCanvas.selectedShapes){
            const geometry = this.editCanvas.shapesToGeometry.get(shape)
            geometry.style.transformOrigin = transformOrigin
        }
    }

    transform(transformation){
        this.rotateUI.style.transform = transformation
        this.scaleUI.style.transform = transformation

        this.editCanvas.selectionBoxGeometry.style.transform = transformation

        for (const shape of this.editCanvas.selectedShapes){
            const geometry = this.editCanvas.shapesToGeometry.get(shape)
            geometry.style.transform = transformation
        }
    }

    beginRotating(pointerEvent){
        const initialPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        this.angleTracker = new AngleTracker(initialPosition,this.centre)

        pointerEvent.stopPropagation()
    }

    continueRotating(pointerEvent){
        const currentPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        const angle = this.angleTracker.getNextAngle(currentPosition)

        this.transform(`rotate(${angle}rad)`)
        return angle
    }

    finishRotating(pointerEvent){
        const rotationAngle = this.continueRotating(pointerEvent)

        this.rotateUI.style.transform = null
        this.scaleUI.style.transform = null
        this.editCanvas.selectionBoxGeometry.style.transform = null

        this.editCanvas.userRotate(rotationAngle,this.transformOrigin)

        this.switchMode()
        this.editCanvas.currentMode = new EditMode(this.editCanvas)

        pointerEvent.stopPropagation()
    }

    beginScaling(pointerEvent){
        // draws a straight line parallel to two corners, going through the point we are scaling around
        // we use minimum distance to that line to judge how much to increase the scale by

        const currentPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        this.initialDistance = distanceBetween2dPoints(currentPosition,this.centre)

        pointerEvent.stopPropagation()
    }

    continueScaling(pointerEvent){
        const currentPosition = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)
        const scale = distanceBetween2dPoints(currentPosition,this.centre)/this.initialDistance

        this.transform(`scale(${scale})`)

        return scale
    }

    finishScaling(pointerEvent){
        const scaleFactor = this.continueScaling(pointerEvent)

        this.rotateUI.style.transform = null
        this.scaleUI.style.transform = null
        this.editCanvas.selectionBoxGeometry.style.transform = null

        this.editCanvas.userScale(scaleFactor,this.transformOrigin)

        this.switchMode()
        this.editCanvas.currentMode = new EditMode(this.editCanvas)

        pointerEvent.stopPropagation()
    }

    positionTransform(pointerEvent){
        this.centre = this.editCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        this.scaleUI.setAttribute("x",this.centre[0]-canvasOverlayUISize/2)
        this.scaleUI.setAttribute("y",this.centre[1]-canvasOverlayUISize/2)
        this.rotateImage.setAttribute("x",this.centre[0]-rotateOverlaySize/2)
        this.rotateImage.setAttribute("y",this.centre[1]-rotateOverlaySize/2)

        this.newTransformOrigin(this.centre)
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){
        this.editCanvas.removeFunctionToPerformOnClick(this.bindedReposition)
        this.transformUI?.remove()
    }
}
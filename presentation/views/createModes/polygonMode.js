import {manyPointsMode} from "./manyPointsMode.js";
import {distanceBetween2dPoints} from "../../../maths.js";
import {buttonSelectedColour, snappingDistance} from "../../../constants.js";
import {controller} from "../../../controller.js";
import {drawing} from "../../../model/drawing.js";

export class polygonMode extends manyPointsMode{
    constructor(createCanvas) {
        super()

        this.createCanvas = createCanvas

        // required to remove event listeners that use this function
        this.bindedPreviewNextLine = this.previewNextLine.bind(this)

        this.createCanvas.canvas.onclick = this.beginPolygon.bind(this)

        this.ourButton = this.createCanvas.shadowRoot.getElementById("polygon")

        // indicate we are now in polygon mode to user
        this.ourButton.style.backgroundColor = buttonSelectedColour
    }

    // called to remove this mode
    switchMode(){
        this.createCanvas.canvas.onclick = null
        this.createCanvas.canvas.removeEventListener("pointermove",this.bindedPreviewNextLine)
        this.line?.remove()
        this.currentShape?.remove()

        // remove polygon mode indication
        this.ourButton.style.backgroundColor = null
    }

    acceptKeyDown(keyboardEvent) {

        if (keyboardEvent.key === "Enter"){

            const [start,end] = this.createCanvas.timeToShapeAppearanceDisappearanceTime(controller.clock())

            const shape = new drawing(start,
                end,
                this.drawingColour,
                this.thickness,
                this.pointArray)

            controller.newAction(() => {
                    controller.newShape(shape)
                },
                () => {
                    controller.removeShape(shape)
                },
                []
            )

            this.currentShape?.remove()
            this.line?.remove()
            this.createCanvas.canvas.removeEventListener("pointermove",this.bindedPreviewNextLine)
            this.createCanvas.canvas.onclick = this.beginPolygon.bind(this)

            return true
        } else {
            return false
        }
    }

    // called when a new polygon is created
    beginPolygon(pointerEvent){
        this.begin(pointerEvent)

        this.createCanvas.canvas.onclick = this.continuePolygon.bind(this)

        this.createCanvas.canvas.addEventListener("pointermove",this.bindedPreviewNextLine)
    }

    continuePolygon(pointerEvent){

        // if the click is close enough to the original point, the polygon is complete
        if (distanceBetween2dPoints(
            this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),
            this.pointArray[0]
        ) < Math.max(this.thickness,snappingDistance)){

            this.line.remove()

            this.completePolygon(pointerEvent)
            this.createCanvas.canvas.removeEventListener("pointermove",this.bindedPreviewNextLine)
            this.createCanvas.canvas.onclick = this.beginPolygon.bind(this)

            return
        }

        this.continue(pointerEvent)
    }

    // called for every mouse movement so the user can see where their line would be if they clicked
    previewNextLine(pointerEvent){
        this.line?.remove()
        this.line = drawing.lineBetween(
            ...this.previousPoint,
            ...this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),
            this.thickness,
            this.drawingColour)
        this.createCanvas.canvas.appendChild(this.line)
    }
}
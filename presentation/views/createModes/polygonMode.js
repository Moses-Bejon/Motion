import {manyPointsMode} from "./manyPointsMode.js";
import {distanceBetween2dPoints} from "../../../maths.js";
import {animationEndTimeSeconds, snappingDistance} from "../../../constants.js";
import {controller} from "../../../controller.js";
import {drawing} from "../../../model/drawing.js";

export class polygonMode extends manyPointsMode{
    constructor(createCanvas) {
        super()

        this.createCanvas = createCanvas

        // required to remove event listeners that use this function
        this.bindedPreviewNextLine = this.previewNextLine.bind(this)

        this.createCanvas.canvas.onclick = this.beginPolygon.bind(this)
    }

    // called to remove this mode
    switchMode(){
        this.createCanvas.onclick = null
        this.createCanvas.canvas.removeEventListener("pointermove",this.bindedPreviewNextLine)
        this.line?.remove()
        this.currentShape?.remove()
    }

    acceptKeyDown(keyboardEvent) {

        console.log(keyboardEvent)

        if (keyboardEvent.key === "Enter"){

            controller.newShape(new drawing(this.currentShape.innerHTML,
                0,
                animationEndTimeSeconds,
                this.drawingColour,
                this.thickness,
                this.pointArray)
            )

            this.line.remove()
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
        this.line = this.createCanvas.lineBetween(
            ...this.previousPoint,
            ...this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),
            this.thickness,
            this.drawingColour)
        this.createCanvas.canvas.appendChild(this.line)
    }
}
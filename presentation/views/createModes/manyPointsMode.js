import {animationEndTimeSeconds, maximumThickness} from "../../../constants.js";
import {controller} from "../../../controller.js";
import {polygon} from "../../../model/polygon.js";
import {drawing} from "../../../model/drawing.js";

export class manyPointsMode{

    constructor(createCanvas) {
        this.createCanvas = createCanvas
    }

    static acceptKeyDownOnShape(keyboardEvent,shape){
        return false
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    begin(pointerEvent){
        /* Made up of a list of points, stored here */
        this.pointArray = []

        if (this.createCanvas.outlineColourToggled){
            this.drawingColour = this.createCanvas.outlineColour.value
        } else {
            this.drawingColour = this.createCanvas.fillColour.value
        }

        /* The slider is upside down, and it's quite complicated to make it the right way round :s */
        this.thickness = maximumThickness-this.createCanvas.thicknessSlider.value

        /* each of my shapes is composed of a group of SVG shapes */
        this.currentShape = document.createElementNS("http://www.w3.org/2000/svg", "g")

        this.createCanvas.canvas.appendChild(this.currentShape)

        /* the previous point is kept track of to draw lines with */
        this.previousPoint = this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)
        this.continue(pointerEvent)
    }

    continue(pointerEvent){
        const canvasCoordinates = this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)
        this.pointArray.push(canvasCoordinates)

        /* line between previous point and current point */
        this.currentShape.appendChild(
            drawing.lineBetween(...this.previousPoint,...canvasCoordinates,this.thickness,this.drawingColour)
        )

        this.previousPoint = canvasCoordinates

        /* circle at each vertex to prevent a gap between the lines */
        this.currentShape.appendChild(drawing.circleAt(...canvasCoordinates,this.thickness/2,this.drawingColour))
    }

    completePolygon(pointerEvent){
        this.currentShape.appendChild(
            drawing.lineBetween(
                ...this.pointArray[0],
                ...this.pointArray[this.pointArray.length-1],
                this.thickness,
                this.drawingColour)
        )

        let fillColour

        if (this.createCanvas.fillColourToggled){
            fillColour = this.createCanvas.fillColour.value
        } else {
            fillColour = "transparent"
        }

        this.currentShape.prepend(polygon.fillArea(this.pointArray,fillColour))

        const shape = new polygon(0,
            animationEndTimeSeconds,
            this.drawingColour,
            fillColour,
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

        this.currentShape.remove()
    }
}
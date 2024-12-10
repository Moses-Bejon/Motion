import {addDragLogicTo} from "../../../dragLogic.js";
import {animationEndTimeSeconds, maximumThickness} from "../../../constants.js";
import {midPoint2d} from "../../../maths.js";
import {controller} from "../../../controller.js";
import {ellipse} from "../../../model/ellipse.js";

export class ellipseMode{

    constructor(createCanvas) {
        this.createCanvas = createCanvas

        addDragLogicTo(this.createCanvas.canvas,
            this.continueEllipse.bind(this),
            this.endEllipse.bind(this),
            this.beginEllipse.bind(this),
            "auto",
            "auto")
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){
        this.ellipse?.remove()
        this.createCanvas.canvas.onpointerdown = null
    }

    beginEllipse(pointerEvent){
        this.currentShape = document.createElementNS("http://www.w3.org/2000/svg","g")
        this.createCanvas.canvas.appendChild(this.currentShape)

        this.initialPosition = this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        this.ellipse = document.createElementNS("http://www.w3.org/2000/svg","ellipse")

        if (this.createCanvas.fillColourToggled) {
            this.colour = this.createCanvas.fillColour.value
            this.ellipse.style.fill = this.colour
        } else {
            this.colour = "transparent"
        }

        if (this.createCanvas.outlineColourToggled){
            this.outlineColour = this.createCanvas.outlineColour.value
            this.ellipse.style.stroke = this.outlineColour
        } else {
            this.outlineColour = "transparent"
        }

        this.thickness = maximumThickness-this.createCanvas.thicknessSlider.value
        this.ellipse.style.strokeWidth = this.thickness

        this.currentShape.appendChild(this.ellipse)
    }

    continueEllipse(pointerEvent){
        const currentPosition = this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        const centre = midPoint2d(this.initialPosition,currentPosition)
        const height = Math.abs(this.initialPosition[1]-currentPosition[1])
        const width = Math.abs(this.initialPosition[0]-currentPosition[0])

        /* check for edge case where there is not enough space in the user's ellipse for the outline */
        if (this.thickness > height || this.thickness > width){

            /* if there isn't the outline is removed and the entire ellipse becomes the outline */

            this.ellipse.style.stroke = "transparent"
            this.ellipse.style.fill = this.outlineColour

            this.ellipse.setAttribute("rx",width/2 + this.thickness/2)
            this.ellipse.setAttribute("ry",height/2 + this.thickness/2)
        } else {

            /* otherwise proceed as usual */

            this.ellipse.style.stroke = this.outlineColour
            this.ellipse.style.fill = this.colour

            this.ellipse.setAttribute("rx",width/2)
            this.ellipse.setAttribute("ry",height/2)
        }

        this.ellipse.setAttribute("cx",centre[0])
        this.ellipse.setAttribute("cy",centre[1])

        return [width,height,centre]
    }

    endEllipse(pointerEvent){
        const [width,height,centre] = this.continueEllipse(pointerEvent)
        controller.newShape(new ellipse(this.currentShape.innerHTML,
            0,animationEndTimeSeconds,
            centre,
            height,
            width,
            this.outlineColour,
            this.colour,
            0,
            this.thickness))

        this.currentShape.remove()
    }

}
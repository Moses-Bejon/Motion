import {addDragLogicTo} from "../../../dragLogic.js";
import {distanceBetween2dPoints,decimateLine} from "../../../maths.js";
import {ManyPointsMode} from "./manyPointsMode.js";
import {controller} from "../../../controller.js";
import {buttonSelectedColour} from "../../../constants.js";

export class DrawMode extends ManyPointsMode{
    constructor(createCanvas) {
        super()
        
        this.createCanvas = createCanvas
        
        addDragLogicTo(this.createCanvas.canvas,
            this.continue.bind(this),
            this.endDrawing.bind(this),
            this.begin.bind(this),
            "auto",
            "auto")

        this.ourButton = this.createCanvas.shadowRoot.getElementById("draw")

        // indicate we are now in draw mode to user
        this.ourButton.style.backgroundColor = buttonSelectedColour
    }

    switchMode(){
        this.currentShape?.remove()
        this.createCanvas.canvas.onpointerdown = null

        // remove draw mode indication
        this.ourButton.style.backgroundColor = null
    }

    endDrawing(pointerEvent){

        this.pointArray = decimateLine(this.pointArray,controller.lineSimplificationEpsilon())

        /* If the last and first points drawn on the shape are close enough together or there is no fill*/
        if (distanceBetween2dPoints(
            this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),this.pointArray[0]
        ) > Math.max(this.thickness,controller.snappingDistance()) || !this.createCanvas.fillColourToggled){

            /* If they're not close together or there is no fill make a drawing*/

            const [start,end] = this.createCanvas.timeToShapeAppearanceDisappearanceTime(controller.clock())
            controller.beginAction()
            controller.takeStep("createDrawing",
                [start, end, this.drawingColour, this.thickness, this.pointArray])
            controller.endAction()

        } else {

            /* If they are, connect up the shape, make a polygon, and fill the polygon with the fill colour */
            this.completePolygon(pointerEvent)
        }

        /* the controller will tell us to add it again */
        this.currentShape.remove()
    }
}
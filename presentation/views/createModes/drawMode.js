import {addDragLogicTo} from "../../../dragLogic.js";
import {distanceBetween2dPoints,decimateLine} from "../../../maths.js";
import {manyPointsMode} from "./manyPointsMode.js";
import {drawing} from "../../../model/drawing.js";
import {controller} from "../../../controller.js";
import {buttonSelectedColour, lineSimplificationEpsilon, snappingDistance} from "../../../globalValues.js";

export class drawMode extends manyPointsMode{
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

        this.pointArray = decimateLine(this.pointArray,lineSimplificationEpsilon)

        /* If the last and first points drawn on the shape are close enough together or there is no fill*/
        if (distanceBetween2dPoints(
            this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),this.pointArray[0]
        ) > Math.max(this.thickness,snappingDistance) || !this.createCanvas.fillColourToggled){

            /* If they're not close together or there is no fill make a drawing*/

            const [start,end] = this.createCanvas.timeToShapeAppearanceDisappearanceTime(controller.clock())

            const shape = new drawing(
                start,
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
        } else {

            /* If they are, connect up the shape, make a polygon, and fill the polygon with the fill colour */
            this.completePolygon(pointerEvent)
        }

        /* the controller will tell us to add it again */
        this.currentShape.remove()
    }
}
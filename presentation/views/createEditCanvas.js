import {
    canvasOffsetY,
    canvasOffsetX,
    fontSize,
    fontFamily,
    minimumThickness,
    maximumThickness,
    animationEndTimeSeconds,
    snappingDistance
} from "../../constants.js";
import {
    distanceBetween2dPoints
} from "../../maths.js";
import {canvas} from "./canvas.js";
import {drawing} from "../../model/drawing.js";
import {polygon} from "../../model/polygon.js";
import {addDragLogicTo} from "../../dragLogic.js";
import {controller} from "../../controller.js";

const template = document.createElement("template")
template.innerHTML = `
<style>
#toolBox{
    display: flex;
    flex-direction: column;

    /* tool box is above the canvas */
    z-index: 1;
    
    position: absolute;
    left: 0;
    
    /* the top of the toolbox is at the same height as the default height of the canvas */
    top: ${canvasOffsetY}px;
       
    width: 30%;
    /* the toolbox ends where the canvas starts */
    max-width: ${canvasOffsetX}px;
    min-width: 200px;
    
    height: 70%;
    min-height: 265px;
}

#edit,#create{    
    height: calc(100% - 30px);

    display: flex;
    flex-direction: column;
}
#sliderAndButtonContainer{
    height: calc(100% - 90px);
    display: flex;
}
#buttonContainer{
    display: flex;
    flex-direction: column;
    
    flex-grow: 1;
}

#thicknessSlider{
    /* makes the thickness slider vertical */
    writing-mode: vertical-lr;
}

button{
    width: 100%;
    
    flex-grow: 1;
    
    cursor: pointer;
    user-select: none;
    
    font-family: ${fontFamily};
    font-size: ${fontSize};
}

label,p{
    margin: 0;

    cursor: pointer;
    user-select: none;
    
    /* centres text vertically */
    line-height: 27px;
    
    font-family: ${fontFamily};
    font-size: ${fontSize};
}

p{
    width: 60%;
    text-align: center;
}

#fillColourContainer,#outlineColourContainer{
    display: flex;
    justify-content: space-between;
}
#fillColour,#outlineColour{
    width:60%;
    cursor: pointer;
}
.sliderVertical {
    height: 100%;
    width: 15%;
}

/* slider track for webkit browsers*/
.sliderVertical::-webkit-slider-runnable-track {
   width: 40%;
}

/* slider track for FireFox*/
.sliderVertical::-moz-range-track {
   width: 40%;
}

/* slider thumb for webkit browsers*/
.sliderVertical::-webkit-slider-thumb {
   width: 100%;
   height: 20%;
}

/* slider thumb for FireFox*/
.sliderVertical::-moz-range-thumb {
   width: 40%;
   height: 20%;
}
</style>
<div id="toolBox">
<switch-element id="createEditSwitch" off-text="Create" on-text="Edit"></switch-element>

<div id="create">
<switch-element id="persistentTemporarySwitch" off-text="Persistent" on-text="Temporary"></switch-element>
<div id="sliderAndButtonContainer">
    <input id="thicknessSlider" 
    class="sliderVertical slider" type="range" 
    min="${minimumThickness}" max="${maximumThickness}" 
    step="any">
    <div id="buttonContainer">
    
        <button id="draw">Draw</button>
        <button id="polygon">Polygon</button>
        <button id="ellipse">Ellipse</button>
        <button id="text">Text</button>
        <button id="graphic">Graphic</button>
    
    </div>
</div>
<div id="outlineColourContainer">
    <label id="outlineColourLabel">Outline</label>
    <input id="outlineColour" type="color">
    <p id="noOutlineColour">None</p>
</div>
<div id="fillColourContainer">
    <label id="fillColourLabel">Fill</label>
    <input id="fillColour" type="color">
    <p id="noFillColour">None</p>
</div>
</div>

<div id="edit">
    <button id="duplicate" class="duplicate">Duplicate</button>
    <button id="copy" class="editButton">Copy</button>
    <button id="paste" class="editButton">Paste</button>
    <button id="merge" class="editButton">Merge</button>
    <button id="delete" class="editButton">Delete</button>
    <button id="transform" class="editButton">Transform</button>
</div>
</div>`

export class createEditCanvas extends canvas{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.create = this.shadowRoot.getElementById("create")

        /* by default, we are in create mode, so edit is not shown */
        this.edit = this.shadowRoot.getElementById("edit")
        this.edit.style.display = "none"

        this.createEditSwitch = this.shadowRoot.getElementById("createEditSwitch")

        /* making swaps of create and edit based on switch */
        this.createEditSwitch.onCallback = () => {
            this.create.style.display = "none"
            this.edit.style.display = "flex"
        }
        this.createEditSwitch.offCallback = () => {
            this.create.style.display = "flex"
            this.edit.style.display = "none"
        }

        this.thicknessSlider = this.shadowRoot.getElementById("thicknessSlider")

        this.shadowRoot.getElementById("draw").onclick = () => {
            addDragLogicTo(this.canvas,
                this.continueDrawing.bind(this),
                this.endDrawing.bind(this),
                this.beginDrawing.bind(this),
                "auto",
                "auto")
        }

        /* outline colour can be none, so toggle is used for switching between none and the colour */
        /* by default, outline is off */
        this.outlineColourToggled = false
        this.outlineColour = this.shadowRoot.getElementById("outlineColour")
        this.noOutlineColour = this.shadowRoot.getElementById("noOutlineColour")
        this.outlineColour.style.display = "none"

        this.shadowRoot.getElementById("outlineColourLabel").onclick = this.toggleOutlineColour.bind(this)
        this.noOutlineColour.onclick = this.toggleOutlineColour.bind(this)

        this.fillColourToggled = true
        this.fillColour =  this.shadowRoot.getElementById("fillColour")
        this.noFillColour = this.shadowRoot.getElementById("noFillColour")
        this.noFillColour.style.display = "none"

        this.shadowRoot.getElementById("fillColourLabel").onclick = this.toggleFillColour.bind(this)
        this.noFillColour.onclick = this.toggleFillColour.bind(this)
    }

    beginDrawing(pointerEvent){

        /* A drawing is made up of a list of points, stored here */
        this.pointArray = []

        if (this.outlineColourToggled){
            this.drawingColour = this.outlineColour.value
        } else {
            this.drawingColour = this.fillColour.value
        }

        /* The slider is upside down and it's quite complicated to make it the right way round :s */
        this.thickness = maximumThickness-this.thicknessSlider.value

        /* each of my shapes is composed of a group of SVG shapes */
        this.currentShape = document.createElementNS("http://www.w3.org/2000/svg", "g")

        this.canvas.appendChild(this.currentShape)

        /* the previous point is kept track of to draw lines with */
        this.previousPoint = this.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)
        this.continueDrawing(pointerEvent)
    }

    continueDrawing(pointerEvent){
        const canvasCoordinates = this.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)
        this.pointArray.push(canvasCoordinates)

        /* line between previous point and current point */
        this.currentShape.appendChild(
            this.lineBetween(...this.previousPoint,...canvasCoordinates,this.thickness,this.drawingColour)
        )

        this.previousPoint = canvasCoordinates

        /* circle at each vertex to prevent a gap between the lines */
        this.currentShape.appendChild(this.circleAt(...canvasCoordinates,this.thickness/2,this.drawingColour))
    }

    endDrawing(pointerEvent){

        /* If the last and first points drawn on the shape are close enough together or there is no fill*/
        if (distanceBetween2dPoints(
            this.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),this.pointArray[0]
        ) > Math.max(this.thickness,snappingDistance) || !this.fillColourToggled){

            /* If they're not close together or there is no fill make a drawing*/
            controller.newShape(new drawing(this.currentShape.innerHTML,
                0,
                animationEndTimeSeconds,
                this.drawingColour,
                this.thickness,
                this.pointArray)
            )
        } else {

            /* If they are, connect up the shape, make a polygon, and fill the polygon with the fill colour */
            this.currentShape.appendChild(
                this.lineBetween(
                    ...this.pointArray[0],
                    ...this.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),
                    this.thickness,
                    this.drawingColour)
            )

            this.currentShape.prepend(this.fillArea(this.pointArray,this.fillColour.value))

            controller.newShape(new polygon(this.currentShape.innerHTML,
                0,
                animationEndTimeSeconds,
                this.drawingColour,
                this.fillColour,
                this.thickness,
                this.pointArray))
        }

        /* the controller will tell us to add it again */
        this.currentShape.remove()
    }

    toggleOutlineColour(){
        if (this.outlineColourToggled){
            this.outlineColour.style.display = "none"
            this.noOutlineColour.style.display = "inline"

            this.outlineColourToggled = false
        } else {
            this.outlineColour.style.display = "inline"
            this.noOutlineColour.style.display = "none"

            this.outlineColourToggled = true
        }
    }

    toggleFillColour(){

        if (this.fillColourToggled){
            this.fillColour.style.display = "none"
            this.noFillColour.style.display = "inline"

            this.fillColourToggled = false
        } else {
            this.fillColour.style.display = "inline"
            this.noFillColour.style.display = "none"

            this.fillColourToggled = true
        }
    }
}
window.customElements.define("create-edit-canvas",createEditCanvas)
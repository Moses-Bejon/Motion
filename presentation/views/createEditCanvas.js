import {
    canvasOffsetY,
    canvasOffsetX,
    fontSize,
    fontFamily,
    minimumThickness,
    maximumThickness
} from "../../constants.js";
import {canvas} from "./canvas.js";
import {drawMode} from "./createModes/drawMode.js";
import {polygonMode} from "./createModes/polygonMode.js";
import {ellipseMode} from "./createModes/ellipseMode.js";
import {textMode} from "./createModes/textMode.js";
import {controller} from "../../controller.js";
import {manyPointsMode} from "./createModes/manyPointsMode.js";

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
    <button id="outlineColourLabel">Outline</button>
    <input id="outlineColour" type="color">
    <p id="noOutlineColour">None</p>
</div>
<div id="fillColourContainer">
    <button id="fillColourLabel">Fill</button>
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

        this.currentMode = new drawMode(this)
        this.shadowRoot.getElementById("draw").onclick = () => {
            this.currentMode.switchMode()
            this.currentMode = new drawMode(this)
        }
        this.shadowRoot.getElementById("polygon").onclick = () => {
            this.currentMode.switchMode()
            this.currentMode = new polygonMode(this)
        }
        this.shadowRoot.getElementById("ellipse").onclick = () => {
            this.currentMode.switchMode()
            this.currentMode = new ellipseMode(this)
        }
        this.shadowRoot.getElementById("text").onclick = () => {
            this.currentMode.switchMode()
            this.currentMode = new textMode(this)
        }

        /* outline colour can be none, so toggle is used for switching between none and the colour */
        /* by default, outline is off */
        this.outlineColourToggled = true
        this.outlineColour = this.shadowRoot.getElementById("outlineColour")
        this.noOutlineColour = this.shadowRoot.getElementById("noOutlineColour")

        this.shadowRoot.getElementById("outlineColourLabel").onclick = this.toggleOutlineColour.bind(this)
        this.noOutlineColour.onclick = this.toggleOutlineColour.bind(this)
        this.noOutlineColour.style.display = "none"

        this.fillColourToggled = false
        this.fillColour =  this.shadowRoot.getElementById("fillColour")
        this.fillColour.style.display = "none"
        this.noFillColour = this.shadowRoot.getElementById("noFillColour")

        this.shadowRoot.getElementById("fillColourLabel").onclick = this.toggleFillColour.bind(this)
        this.noFillColour.onclick = this.toggleFillColour.bind(this)

        this.selectedShapes = new Set()
    }

    connectedCallback() {
        super.connectedCallback()

        controller.subscribeTo(this,"selectedShapes")
    }

    disconnectedCallback() {
        super.disconnectedCallback()

        controller.unsubscribeTo(this,"selectedShapes")
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

    shapeToMode(shape){
        switch (shape.constructor.name){
            case "drawing":
                return manyPointsMode
            case "polygon":
                return manyPointsMode
            case "ellipse":
                return ellipseMode
            case "text":
                return textMode
        }
    }

    acceptKeyDown(keyboardEvent) {
        if (this.currentMode.acceptKeyDown(keyboardEvent)){
            return true
        }

        let acceptedBySelectedShape = false

        // if any selected shape accepts the input, we have accepted the input
        // I cannot break early as the operation should apply to all selected shapes
        for (const shape of this.selectedShapes){
            acceptedBySelectedShape = acceptedBySelectedShape || this.shapeToMode(shape).acceptKeyDownOnShape(keyboardEvent,shape)
        }

        if (acceptedBySelectedShape){
            return true
        }

        return super.acceptKeyDown(keyboardEvent)
    }

    updateAggregateModel(aggregateModel, model){
        if (aggregateModel !== "selectedShapes"){
            throw new Error(
                this+" is hearing about updates from "+aggregateModel+" which it shouldn't be subscribed to"
            )
        }

        this.selectedShapes = model
    }

    removeModel(aggregateModel, model) {
        switch (aggregateModel){
            case "selectedShapes":
                break
            default:
                super.removeModel(aggregateModel,model)
        }
    }
}
window.customElements.define("create-edit-canvas",createEditCanvas)
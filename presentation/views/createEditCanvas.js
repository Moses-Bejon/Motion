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
import {graphicMode} from "./createModes/graphicMode.js";
import {selectionBox} from "./createModes/selectionBox.js";
import {isLess} from "../../maths.js";
import {binaryInsertion, binarySearch, maximumOfArray} from "../../dataStructureOperations.js";
import {editMode} from "./createModes/editMode.js";

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

button,#graphic,.realFakeButtonContainer{
    width: 100%;
    height: 100%;
    min-height: 0;
    
    flex-grow: 1;
    
    cursor: pointer;
    user-select: none;
    
    font-family: ${fontFamily};
    font-size: ${fontSize};
}

/* defined here for consistency across browsers, which I'm generally not super concerned with */
/* however, in this case javascript is changing these colours so I need a standard */
button{
    background-color: #f0f0f0;
    border: 1px solid #555;
    border-radius: 2px;
}

button:hover{
    background-color: #e5e5e5;
}

button:active{
    background-color: #d0d0d0;
}

/* ensures the fake graphic appears behind the real graphic */
#fakeGraphic{
    position: relative;
}

#graphic{
    opacity: 0;
    position: relative;
    top: -100%;
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
        
        <div class="realFakeButtonContainer">
            <button id="fakeGraphic">Graphic</button>
            <input type="file" id="graphic">
        </div>
    
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
    <button id="duplicate" class="editButton">Duplicate</button>
    <button id="copy" class="editButton">Copy</button>
    <button id="paste" class="editButton">Paste</button>
    <button id="merge" class="editButton">Merge</button>
    <button id="delete" class="editButton">Delete</button>
    <button id="transform" class="editButton">Transform</button>
    <button id="moveAbove" class="editButton">Move one above</button>
    <button id="moveBehind" class="editButton">Move one below</button>
    <button id="moveFront" class="editButton">Move to front</button>
    <button id="moveBack" class="editButton">Move to back</button>
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

            this.currentMode.switchMode()
            this.currentMode = new editMode(this)
        }
        this.createEditSwitch.offCallback = () => {
            this.create.style.display = "flex"
            this.edit.style.display = "none"

            this.currentMode.switchMode()
            this.currentMode = new drawMode(this)
        }

        this.thicknessSlider = this.shadowRoot.getElementById("thicknessSlider")

        this.currentMode = new drawMode(this)

        // adding events for all the buttons
        this.shadowRoot.getElementById("draw").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new drawMode(this)
        }
        this.shadowRoot.getElementById("polygon").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new polygonMode(this)
        }
        this.shadowRoot.getElementById("ellipse").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new ellipseMode(this)
        }
        this.shadowRoot.getElementById("text").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new textMode(this)
        }

        const graphic = this.shadowRoot.getElementById("graphic")

        graphic.oninput = (input) => {
            this.currentMode.switchMode()
            this.currentMode = new graphicMode(input.target.files[0])
        }

        const fakeGraphic = this.shadowRoot.getElementById("fakeGraphic")

        /* Simulating hover over button effect */
        graphic.onpointerenter = () => {
            fakeGraphic.style.backgroundColor = "#e5e5e5"
        }
        graphic.onpointerleave = () => {
            fakeGraphic.style.backgroundColor = "#f0f0f0"
        }

        this.shadowRoot.getElementById("duplicate").onpointerdown = (pointerEvent) => {

            // the duplicate becomes selected after it is made
            const newlySelectedShapes = new Set()

            for (const shape of this.selectedShapes) {
                const duplicate = shape.copy()

                // if the duplicate is right on top of the previous shape users may not realise
                duplicate.translate([50,50])

                controller.newShape(duplicate)
                newlySelectedShapes.add(duplicate)
            }
            controller.newAggregateModel("selectedShapes",newlySelectedShapes)

            // prevents the click on the canvas from deselecting the selected shapes
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("copy").onpointerdown = (pointerEvent) => {
            controller.copiedShapes = []

            for (const shape of this.selectedShapes) {
                controller.copiedShapes.push(shape.copy())
            }
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("paste").onpointerdown = (pointerEvent) => {
            const newlySelectedShapes = new Set()
            for (const shape of controller.copiedShapes){
                shape.translate([50,50])
                const newShape = shape.copy()
                controller.newShape(newShape)
                newlySelectedShapes.add(newShape)
            }
            controller.newAggregateModel("selectedShapes",newlySelectedShapes)
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("delete").onpointerdown = () => {
            for (const shape of this.selectedShapes) {
                controller.removeShape(shape)
            }
        }
        this.shadowRoot.getElementById("moveAbove").onpointerdown = (pointerEvent) => {
            this.moveSelectedShapesOneAbove()
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("moveBehind").onpointerdown = (pointerEvent) => {
            this.moveSelectedShapesOneBelow()
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("moveFront").onpointerdown = (pointerEvent) => {

            // this is just the easiest way to do it, will optimise if becomes an issue
            for (let i = 0; i<this.shapesInOrderOfZIndex.length;i++){
                this.moveSelectedShapesOneAbove()
            }

            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("moveBack").onpointerdown = (pointerEvent) => {

            for (let i = 0; i<this.shapesInOrderOfZIndex.length;i++){
                this.moveSelectedShapesOneBelow()
            }

            pointerEvent.stopPropagation()
        }

        /* outline colour can be none, so toggle is used for switching between none and the colour */
        /* by default, outline is off */
        this.outlineColourToggled = true
        this.outlineColour = this.shadowRoot.getElementById("outlineColour")
        this.noOutlineColour = this.shadowRoot.getElementById("noOutlineColour")

        this.shadowRoot.getElementById("outlineColourLabel").onpointerdown = this.toggleOutlineColour.bind(this)
        this.noOutlineColour.onpointerdown = this.toggleOutlineColour.bind(this)
        this.noOutlineColour.style.display = "none"

        this.fillColourToggled = false
        this.fillColour =  this.shadowRoot.getElementById("fillColour")
        this.fillColour.style.display = "none"
        this.noFillColour = this.shadowRoot.getElementById("noFillColour")

        this.shadowRoot.getElementById("fillColourLabel").onpointerdown = this.toggleFillColour.bind(this)
        this.noFillColour.onpointerdown = this.toggleFillColour.bind(this)

        this.selectedShapes = new Set()

        this.selectionBoxInstance = new selectionBox(this)

        // ensures we have the geometry in case we need it later
        this.selectionBoxGeometry = this.selectionBoxInstance.positionSelectionBox(0,0,0,0)
        this.selectionBoxGeometry.remove()
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
            case "graphic":
                return graphicMode
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

    updateSelectionBox(){
        this.selectionBoxGeometry?.remove()

        if (this.selectedShapes.size === 0){
            return
        }

        const shapes = Array.from(this.selectedShapes)

        const selectionTop = maximumOfArray(shapes,(shape)=>{return shape.top},isLess)
        const selectionBottom = maximumOfArray(shapes,(shape) => {return shape.bottom})
        const selectionLeft = maximumOfArray(shapes,(shape) => {return shape.left},isLess)
        const selectionRight = maximumOfArray(shapes,(shape => {return shape.right}))

        this.selectionBoxGeometry = this.selectionBoxInstance.positionSelectionBox(
            selectionTop,selectionBottom,selectionLeft,selectionRight)

        this.canvas.appendChild(this.selectionBoxGeometry)

    }

    positionsOfShapesInZIndexArray(shapes){
        const positions = []
        for (const shape of shapes){
            const shapePosition = binarySearch(this.shapesInOrderOfZIndex,shape.ZIndex,(model) => {return model.ZIndex})

            // ensures the returned positions are in sorted order
            positions.splice(binaryInsertion(positions,shapePosition),0,shapePosition)
        }
        return positions
    }

    swapZIndicesOfShapes(shape1,shape2){
        const tempZIndex = shape2.ZIndex

        shape2.ZIndex = shape1.ZIndex
        shape1.ZIndex = tempZIndex

        // this ensures controller knows we updated the shapes
        shape2.geometryAttributeUpdate("ZIndex",shape2.ZIndex)
        shape1.geometryAttributeUpdate("ZIndex",shape1.ZIndex)
    }

    moveSelectedShapesOneAbove(){
        const positions = this.positionsOfShapesInZIndexArray(this.selectedShapes).reverse()

        // remove any shapes already on the top from the shapes we are going to move
        let top = this.shapesInOrderOfZIndex.length-1
        while (positions[0] === top){
            positions.shift()
            top --
        }

        for (const position of positions){
            const shapeAhead = this.shapesInOrderOfZIndex[position+1]
            const shape = this.shapesInOrderOfZIndex[position]

            this.swapZIndicesOfShapes(shape,shapeAhead)
        }
    }

    moveSelectedShapesOneBelow(){
        const positions = this.positionsOfShapesInZIndexArray(this.selectedShapes)

        let bottom = 0
        while (positions[0] === bottom){
            positions.shift()
            bottom ++
        }

        for (const position of positions){
            const shapeBehind = this.shapesInOrderOfZIndex[position-1]
            const shape = this.shapesInOrderOfZIndex[position]

            this.swapZIndicesOfShapes(shape,shapeBehind)
        }
    }

    updateAggregateModel(aggregateModel, model){
        if (aggregateModel === "selectedShapes"){
            this.selectedShapes = model
            this.updateSelectionBox()

        } else {
            super.updateAggregateModel(aggregateModel,model)
        }

        this.currentMode.updateAggregateModel?.(aggregateModel, model)
    }

    addModel(aggregateModel, model) {
        if (aggregateModel === "selectedShapes"){
            this.selectedShapes.add(model)
            this.updateSelectionBox()
        } else {
            super.addModel(aggregateModel, model)
        }

        this.currentMode.addModel?.(aggregateModel, model)
    }

    removeModel(aggregateModel, model) {
        if (aggregateModel === "selectedShapes"){
            this.selectedShapes.delete(model)
            this.updateSelectionBox()
        } else {
            super.removeModel(aggregateModel,model)
        }

        this.currentMode.removeModel?.(aggregateModel, model)
    }
}
window.customElements.define("create-edit-canvas",createEditCanvas)
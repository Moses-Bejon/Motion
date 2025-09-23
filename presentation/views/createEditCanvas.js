import {
    canvasOffsetY,
    canvasOffsetX,
    fontSize,
    fontFamily,
    minimumThickness,
    maximumThickness,
    typicalIconSize,
    thicknessLevel,
    buttonSelectedColour,
    timeEpsilon
} from "../../constants.js";
import {Canvas} from "./canvas.js";
import {DrawMode} from "./createModes/drawMode.js";
import {PolygonMode} from "./createModes/polygonMode.js";
import {EllipseMode} from "./createModes/ellipseMode.js";
import {TextMode} from "./createModes/textMode.js";
import {controller} from "../../controller.js";
import {ManyPointsMode} from "./createModes/manyPointsMode.js";
import {GraphicMode} from "./createModes/graphicMode.js";
import {SelectionBox} from "./createModes/selectionBox.js";
import {isLess} from "../../maths.js";
import {binaryInsertion, binarySearch, maximumOfArray} from "../../dataStructureOperations.js";
import {EditMode} from "./createModes/editMode.js";
import {TransformMode} from "./createModes/transformMode.js";

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
    height: calc(100% - ${typicalIconSize});

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
    background-color: #e0e0e0;
    border: none;
    border-radius: 0;
}

button:hover{
    background-color: #d5d5d5;
}

button:active{
    background-color: ${buttonSelectedColour};
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
    value="${minimumThickness+(maximumThickness-minimumThickness)*(1-thicknessLevel)}"
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
    <button id="delete" class="editButton">Delete</button>
    <button id="transform" class="editButton">Transform</button>
    <button id="moveAbove" class="editButton">Move one above</button>
    <button id="moveBehind" class="editButton">Move one below</button>
    <button id="moveFront" class="editButton">Move to front</button>
    <button id="moveBack" class="editButton">Move to back</button>
</div>
</div>`

export class CreateEditCanvas extends Canvas{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.create = this.shadowRoot.getElementById("create")
        this.main = this.shadowRoot.getElementById("main")

        /* by default, we are in create mode, so edit is not shown */
        this.edit = this.shadowRoot.getElementById("edit")
        this.edit.style.display = "none"

        this.createEditSwitch = this.shadowRoot.getElementById("createEditSwitch")

        /* making swaps of create and edit based on switch */
        this.createEditSwitch.onCallback = () => {
            this.create.style.display = "none"
            this.edit.style.display = "flex"

            this.currentMode.switchMode()
            this.currentMode = new EditMode(this)
        }
        this.createEditSwitch.offCallback = () => {
            this.create.style.display = "flex"
            this.edit.style.display = "none"

            this.currentMode.switchMode()
            this.currentMode = new DrawMode(this)
        }

        this.persistentTemporarySwitch = this.shadowRoot.getElementById("persistentTemporarySwitch")

        this.persistentTemporarySwitch.onCallback = () => {
            this.timeToShapeAppearanceDisappearanceTime = (time) => {
                // + epsilon to ensure there are no flashes of white when something disappears and another appears
                return [time-controller.timelineSnapLength()/2,time+controller.timelineSnapLength()/2+timeEpsilon]
            }
        }

        this.persistentTemporarySwitch.offCallback = () => {
            this.timeToShapeAppearanceDisappearanceTime = (time) => {
                return [0,controller.animationEndTime()]
            }
        }

        this.onionSkin = document.createElementNS("http://www.w3.org/2000/svg","g")
        this.onionSkin.style.opacity = 0.5
        this.onionSkin.style.pointerEvents = "none"

        this.thicknessSlider = this.shadowRoot.getElementById("thicknessSlider")

        this.currentMode = new DrawMode(this)

        // adding events for all the buttons
        this.shadowRoot.getElementById("draw").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new DrawMode(this)
        }
        this.shadowRoot.getElementById("polygon").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new PolygonMode(this)
        }
        this.shadowRoot.getElementById("ellipse").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new EllipseMode(this)
        }
        this.shadowRoot.getElementById("text").onpointerdown = () => {
            this.currentMode.switchMode()
            this.currentMode = new TextMode(this)
        }

        const graphic = this.shadowRoot.getElementById("graphic")

        graphic.oninput = (input) => {
            this.currentMode.switchMode()
            this.currentMode = new GraphicMode(input.target.files[0])

            // clears input so the user can input the same file multiple times
            input.target.value = ""
        }

        const fakeGraphic = this.shadowRoot.getElementById("fakeGraphic")

        /* Simulating hover over button effect */
        graphic.onpointerenter = () => {
            fakeGraphic.style.backgroundColor = "#d5d5d5"
        }
        graphic.onpointerleave = () => {
            fakeGraphic.style.backgroundColor = "#e0e0e0"
        }

        this.shadowRoot.getElementById("duplicate").onpointerdown = (pointerEvent) => {

            controller.executeScript(`
            for (const shape of selectedShapes){
                const newShape = duplicate(shape)
                translate(newShape,[50,50])
            }
            `,{"selectedShapes":this.selectedShapes}
            ).then((duplicates) => {
                controller.getSelectedShapesManager().selectNewShapes(duplicates)
            })

            // prevents the click on the canvas from deselecting the selected shapes
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("copy").onpointerdown = (pointerEvent) => {
            controller.copy(this.selectedShapes)
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("paste").onpointerdown = (pointerEvent) => {
            CreateEditCanvas.paste()
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("delete").onpointerdown = () => {

            controller.beginAction()
            for (const shape of this.selectedShapes) {
                controller.takeStep("deleteShape",[shape])
            }
            controller.endAction()
        }
        this.shadowRoot.getElementById("transform").onpointerdown = (pointerEvent) => {

            this.currentMode.switchMode()

            // if we are already in transform mode, we go back to edit mode
            if (this.currentMode.constructor.name === "TransformMode"){
                this.currentMode = new EditMode(this)
            } else {
                this.currentMode = new TransformMode(this)
            }
        }
        this.shadowRoot.getElementById("moveAbove").onpointerdown = (pointerEvent) => {

            const shapesToMove = new Set(this.selectedShapes)

            // shapes already at the top cannot move above, they are removed from the set.
            let indexOfTopShape = this.shapesInOrderOfZIndex.length-1

            while (shapesToMove.has(this.shapesInOrderOfZIndex[indexOfTopShape])){
                shapesToMove.delete(this.shapesInOrderOfZIndex[indexOfTopShape])
                indexOfTopShape --
            }

            controller.beginAction()
            this.#moveShapesOneAbove(shapesToMove)
            controller.endAction()

            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("moveBehind").onpointerdown = (pointerEvent) => {

            const shapesToMove = new Set(this.selectedShapes)

            // shapes already at the back cannot move back, they are removed from the set.
            let indexOfBottomShape = 0

            while (shapesToMove.has(this.shapesInOrderOfZIndex[indexOfBottomShape])){
                shapesToMove.delete(this.shapesInOrderOfZIndex[indexOfBottomShape])
                indexOfBottomShape ++
            }

            controller.beginAction()
            this.#moveShapesOneBelow(shapesToMove)
            controller.endAction()

            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("moveFront").onpointerdown = (pointerEvent) => {

            this.moveShapesToFront(Array.from(this.selectedShapes))

            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("moveBack").onpointerdown = (pointerEvent) => {

            // moving a group of shapes to the back is the same as moving every other shape to the front
            const shapesToMove = controller.displayShapes().difference(this.selectedShapes)

            this.moveShapesToFront(Array.from(shapesToMove))

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

        this.selectionBoxInstance = new SelectionBox(this)

        // ensures we have the geometry in case we need it later
        this.selectionBoxGeometry = this.selectionBoxInstance.positionSelectionBox(0,0,0,0)
        this.selectionBoxGeometry.remove()
    }

    connectedCallback() {
        super.connectedCallback()

        controller.subscribeToSelectedShapes(this)
        controller.subscribeToOnionSkins(this)
    }

    disconnectedCallback() {
        super.disconnectedCallback()

        controller.unsubscribeToSelectedShapes(this)
        controller.unsubscribeToOnionSkins(this)
    }

    static paste(){
        controller.executeScript(`
            for (const shape of copiedShapes){
                const newShape = duplicate(shape)
                translate(newShape,[50,50])
            }
            `,{"copiedShapes":controller.paste()}).then((duplicates) => {
            controller.getSelectedShapesManager().selectNewShapes(duplicates)
        })
    }

    save(){

        const windowSave = super.save()

        windowSave.windowType = "createEditCanvas"
        windowSave.currentMode = this.currentMode.constructor.name
        windowSave.persistentTemporary = this.persistentTemporarySwitch.currentlyOn
        windowSave.thickness = this.thicknessSlider.value
        windowSave.outlineColourToggled = this.outlineColourToggled
        windowSave.outlineColour = this.outlineColour.value
        windowSave.fillColourToggled = this.fillColourToggled
        windowSave.fillColour = this.fillColour.value

        return windowSave
    }

    load(save){
        super.load(save)

        switch (save.currentMode){
            case "editMode":
            // I'm not saving it if you're mid-transform when you hit save (not sure how that's even possible)
            case "transformMode":
                this.createEditSwitch.turnOn()
                break
            case "drawMode":
                // we are already in draw mode, that is the default mode
                break
            case "polygonMode":
                this.currentMode.switchMode()
                this.currentMode = new PolygonMode(this)
                break
            case "ellipseMode":
                this.currentMode.switchMode()
                this.currentMode = new EllipseMode(this)
                break
            case "textMode":
                this.currentMode.switchMode()
                this.currentMode = new TextMode(this)
                break
            case "graphicMode":
                this.currentMode.switchMode()
                this.currentMode = new GraphicMode(this)
                break
        }

        if (save.persistentTemporary){
            this.persistentTemporarySwitch.turnOn()
        }

        this.thicknessSlider.value = save.thickness

        if (!save.outlineColourToggled){
            this.toggleOutlineColour()
        }
        this.outlineColour.value = save.outlineColour

        if (save.fillColourToggled){
            this.toggleFillColour()
        }
        this.fillColour.value = save.fillColour
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
            case "Drawing":
                return ManyPointsMode
            case "Polygon":
                return ManyPointsMode
            case "Ellipse":
                return EllipseMode
            case "Text":
                return TextMode
            case "Graphic":
                return GraphicMode
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
            const acceptedByCurrentShape = this.shapeToMode(shape).acceptKeyDownOnShape(keyboardEvent,shape)
            acceptedBySelectedShape = acceptedBySelectedShape || acceptedByCurrentShape
        }

        if (acceptedBySelectedShape){
            return true
        }

        if (keyboardEvent.ctrlKey || keyboardEvent.metaKey){
            switch (keyboardEvent.key){
                case "c":
                case "C":
                    controller.copy(this.selectedShapes)
                    return true
                case "v":
                case "V":
                    CreateEditCanvas.paste()
                    return true
                case "x":
                case "X":
                    console.log(controller.currentState.constructor.name)
                    controller.copy(this.selectedShapes)
                    controller.beginAction()
                    for (const shape of this.selectedShapes) {
                        controller.takeStep("deleteShape",[shape])
                    }
                    controller.endAction()
                    return true
                case "a":
                case "A":
                    controller.getSelectedShapesManager().selectNewShapes(controller.displayShapes())
                    keyboardEvent.preventDefault()
                    return true
            }
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

    #moveShapesOneAbove(shapes){
        const positions = this.positionsOfShapesInZIndexArray(shapes).reverse()

        // remove any shapes already on the top from the shapes we are going to move
        let top = this.shapesInOrderOfZIndex.length-1
        while (positions[0] === top){
            positions.shift()
            top --
        }

        for (const position of positions){
            const shapeAhead = this.shapesInOrderOfZIndex[position+1]
            const shape = this.shapesInOrderOfZIndex[position]

            controller.takeStep("swapZIndices",[shape,shapeAhead])

            // takeStep is not executed immediately, as such we keep our list up to date like this
            this.shapesInOrderOfZIndex[position] = shapeAhead
            this.shapesInOrderOfZIndex[position+1] = shape
        }
    }

    #moveShapesOneBelow(shapes){
        const positions = this.positionsOfShapesInZIndexArray(shapes)

        let bottom = 0
        while (positions[0] === bottom){
            positions.shift()
            bottom ++
        }

        for (const position of positions){
            const shapeBehind = this.shapesInOrderOfZIndex[position-1]
            const shape = this.shapesInOrderOfZIndex[position]

            controller.takeStep("swapZIndices",[shape,shapeBehind])

            // takeStep is not executed immediately, as such we keep our list up to date like this
            this.shapesInOrderOfZIndex[position] = shapeBehind
            this.shapesInOrderOfZIndex[position-1] = shape
        }
    }

    moveShapesToFront(shapesToMove){
        // sort in order of Z index, we will put lower ones on the top first
        shapesToMove.sort((shape1,shape2) => {return shape1.ZIndex-shape2.ZIndex})

        controller.beginAction()
        for (const shape of shapesToMove){
            controller.takeStep("moveToFront",[shape])
        }
        controller.endAction()
    }

    moveShapesToBack(shapesToMove){
        // sort in reverse order of Z index, we will put higher ones on the bottom first
        shapesToMove.sort((shape1,shape2) => {return shape2.ZIndex-shape1.ZIndex})

        controller.beginAction()
        for (const shape of shapesToMove){
            controller.takeStep("moveToBack",[shape])
        }
        controller.endAction()
    }

    userRotate(angle,aboutCentre){
        controller.beginAction()
        for (const shape of this.selectedShapes){
            controller.takeStep("rotate",[shape,angle,aboutCentre])
        }
        controller.endAction()
    }

    userScale(scaleFactor,aboutCentre){
        controller.beginAction()
        for (const shape of this.selectedShapes){
            controller.takeStep("scale",[shape,scaleFactor,aboutCentre])
        }
        controller.endAction()
    }

    userTranslate(translationVector){
        controller.beginAction()
        for (const shape of this.selectedShapes){
            controller.takeStep("translate",[shape,translationVector])
        }
        controller.endAction()
    }

    updateShapeSelection(){

        // the only selected shapes according to the canvas are the ones that are currently being displayed
        // this is because it would be unintuitive for a user to do something like rotate a shape they can't see
        this.selectedShapes = controller.selectedShapes().intersection(controller.displayShapes())
        this.updateSelectionBox()
    }

    updateAggregateModel(aggregateModel, model){

        // our parent is not subscribed to selected shapes, so would be confused if we sent them this update
        if (aggregateModel !== "selectedShapes"){
            super.updateAggregateModel(aggregateModel,model)
        }

        this.updateShapeSelection()
        this.currentMode.updateAggregateModel?.(aggregateModel, model)
    }

    addModel(aggregateModel, model) {
        if (aggregateModel !== "selectedShapes"){
            super.addModel(aggregateModel, model)
        }

        this.updateShapeSelection()
        this.currentMode.addModel?.(aggregateModel, model)
    }

    updateModel(aggregateModel, model) {
        super.updateModel(aggregateModel, model)
        this.updateShapeSelection()
    }

    removeModel(aggregateModel, model) {
        if (aggregateModel !== "selectedShapes"){
            super.removeModel(aggregateModel,model)
        }

        this.updateShapeSelection()
        this.currentMode.removeModel?.(aggregateModel, model)
    }

    updateOnionSkin(onionSkinGeometry){
        this.onionSkin.innerHTML = onionSkinGeometry

        this.canvas.appendChild(this.onionSkin)
    }

    hideOnionSkin(){
        this.onionSkin.remove()
    }
}
window.customElements.define("create-edit-canvas",CreateEditCanvas)
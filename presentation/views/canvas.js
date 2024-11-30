import {controller} from "../../controller.js"
import {increment2dVectorBy,decrement2dVectorBy,multiply2dVectorByScalar} from "../../maths.js";
import {abstractView} from "../view.js"

import {canvasOffsetX,
    canvasOffsetY,
    canvasWidth,
    canvasHeight,
    sensitivity,
    fontFamily,
    fontSize,
    minimumThickness,
    maximumThickness} from "../../constants.js";

// maps keys to their intended movement vectors
const keyToMovement = {
    "w": [0, 1],
    "a": [1, 0],
    "s": [0, -1],
    "d": [-1, 0]
}

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
    min-height: 250px;
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

#zoom{
    display: flex;

    position: absolute;
    bottom: 0;
    right: 0;
    
    width: 40%;
    height: 5%;

    z-index: 1;
}

.slider{
    /* removes default appearance */
    appearance: none;
    background-color: transparent;
    
    cursor: pointer;
}

.slider::-webkit-slider-runnable-track {
   background-color: darkgray;
}

.slider::-moz-range-track {
   background-color: darkgray;
}

.slider::-webkit-slider-thumb{
   appearance: none;
   background-color: black;
}

.slider::-moz-range-thumb{
   /*Removes extra border that FireFox applies*/
   border: none;
   /*Removes default border-radius that FireFox applies*/
   border-radius: 0;

   background-color: black;
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

.sliderHorizontal {
    cursor: pointer;
    width: 80%;
}

/* slider track for webkit browsers*/
.sliderHorizontal::-webkit-slider-runnable-track {
   height: 40%;
}

/* slider track for FireFox*/
.sliderHorizontal::-moz-range-track {
   height: 40%;
}

/* slider thumb for webkit browsers*/
.sliderHorizontal::-webkit-slider-thumb {
   height: 100%;
   width: 20%;
}

/* slider thumb for FireFox*/
.sliderHorizontal::-moz-range-thumb {
   height: 40%;
   width: 20%;
}

#zoomIn, #zoomOut{
    width: 10%;
    height: 100%;
    
    user-select: none;    
    
    cursor: pointer;
}

#canvas{
    position: absolute;
    left: ${canvasOffsetX}px;
    top: ${canvasOffsetY}px;
    
    width: ${canvasWidth}px;
    height: ${canvasHeight}px;
    
    border: dashed;
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
<button id="setKeyframe" class="editButton">Set keyframe</button>
<button id="copy" class="editButton">Copy</button>
<button id="paste" class="editButton">Paste</button>
<button id="mergeShapes" class="editButton">Merge shapes</button>
<button id="deleteShapes" class="editButton">Delete shapes</button>
</div>
</div>

<div id="zoom">
<img id="zoomOut" src="assets/zoomOut.svg" alt="zoom in button">
<input id="zoomBar" class="sliderHorizontal slider" type="range" min="0" max="5" value="1" step="any">
<img id="zoomIn" src="assets/zoomIn.svg" alt="zoom out button">
</div>

<svg id="canvas"></svg>
`

export class canvas extends abstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.canvas = this.shadowRoot.getElementById("canvas")
        this.canvasPosition = [canvasOffsetX,canvasOffsetY]

        this.zoomBar = this.shadowRoot.getElementById("zoomBar")

        // called whenever the position of the zoom bar changes
        this.zoomBar.oninput = this.updateZoom.bind(this)

        this.shadowRoot.getElementById("zoomIn").onclick = this.zoomIn.bind(this)
        this.shadowRoot.getElementById("zoomOut").onclick = this.zoomOut.bind(this)

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

        /* outline colour can be none, so toggle is used for switching between none and the colour */
        this.outlineColourToggled = true
        this.outlineColour = this.shadowRoot.getElementById("outlineColour")
        this.noOutlineColour = this.shadowRoot.getElementById("noOutlineColour")
        this.noOutlineColour.style.display = "none"

        this.shadowRoot.getElementById("outlineColourLabel").onclick = this.toggleOutlineColour.bind(this)
        this.noOutlineColour.onclick = this.toggleOutlineColour.bind(this)

        this.fillColourToggled = true
        this.fillColour =  this.shadowRoot.getElementById("fillColour")
        this.noFillColour = this.shadowRoot.getElementById("noFillColour")
        this.noFillColour.style.display = "none"

        this.shadowRoot.getElementById("fillColourLabel").onclick = this.toggleFillColour.bind(this)
        this.noFillColour.onclick = this.toggleFillColour.bind(this)

        // all keys that the user currently has pressed for this window
        this.keysDown = new Set()

        // the velocity of the canvas (which can move during navigation)
        this.movementVector = [0,0]

        this.nextAnimationFrame = null
    }

    connectedCallback() {
        super.connectedCallback()

        // can only modify the following once connected
        this.style.backgroundColor = "white"

        // when am disconnected, need to unsubscribe so not taking up space in controller
        // however, am sometimes disconnected due to windows moving around
        // therefore, I subscribe every time I connect and unsubscribe every time I disconnect
        controller.subscribeToInputs(this)
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeFromInputs(this)
    }

    move(){

        // deltaTime logic
        const currentTime = performance.now()
        const deltaTime = sensitivity*(currentTime-this.previousTime)
        this.previousTime = currentTime

        // updating position
        increment2dVectorBy(this.canvasPosition,multiply2dVectorByScalar(deltaTime,this.movementVector))
        this.canvas.style.left = this.canvasPosition[0]+"px"
        this.canvas.style.top = this.canvasPosition[1]+"px"

        // loop (for as long as the animation frame isn't cancelled which is done in this.acceptKeyUp)
        this.nextAnimationFrame = requestAnimationFrame(this.move.bind(this))
    }

    acceptKeyDown(keyboardEvent){

        const key = keyboardEvent.key.toLowerCase()

        // handle zoom
        if (keyboardEvent.ctrlKey){

            // account for different keys both indicating +
            if (key === "+" || key === "="){

                // prevents the browser from zooming in to the whole webpage
                keyboardEvent.preventDefault()
                this.zoomIn()
                return true

            } else if (key === "-" || key === "_"){
                keyboardEvent.preventDefault()
                this.zoomOut()
                return true
            } else {
                return false
            }
        }

        const movement = keyToMovement[key]

        // if the letter does not have a movement vector associated it (any letter not "w","a","s" or "d")
        if (movement === undefined){
            return false
        }

        // if the key is already down, then this has been falsely triggered twice (JavaScript sometimes does this)
        if (this.keysDown.has(key)){
            // we return true so we do not continue going down the hierarchy, as this event should not have been fired
            return true
        }

        // adds the new bit of movement to the current movement
        increment2dVectorBy(this.movementVector,movement)

        this.keysDown.add(key)

        // if we are not playing an animation, we should be now since we're moving
        if (this.nextAnimationFrame === null){
            this.previousTime = performance.now()

            this.move()
        }

        return true
    }

    acceptKeyUp(keyboardEvent){

        const key = keyboardEvent.key.toLowerCase()

        // if the user was holding the key down for us (possible it was for a different window)
        if (this.keysDown.has(key)){
            this.keysDown.delete(key)

            const movement = keyToMovement[key]

            // removes the movement we stopped doing from the vector
            decrement2dVectorBy(this.movementVector,movement)

            // if there are no movements currently happening, no need to slow down the user playing an animation
            if (this.keysDown.size === 0){
                cancelAnimationFrame(this.nextAnimationFrame)
                this.nextAnimationFrame = null
            }

            return true
        } else {
            return false
        }
    }

    // clean up animations when we lose focus
    loseFocus(){
        this.keysDown = new Set()

        this.movementVector = [0,0]

        cancelAnimationFrame(this.nextAnimationFrame)
        this.nextAnimationFrame = null
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

    updateZoom(){
        const canvasScale = parseFloat(this.zoomBar.value)

        // scale canvas to zoom bar input
        this.canvas.style.width = canvasScale*canvasWidth + "px"
        this.canvas.style.height = canvasScale*canvasHeight + "px"
    }

    zoomIn(){
        this.zoomBar.value = (parseFloat(this.zoomBar.value)+0.1).toString()
        this.updateZoom()
    }

    zoomOut(){
        this.zoomBar.value = (parseFloat(this.zoomBar.value)-0.1).toString()
        this.updateZoom()
    }
}
window.customElements.define("canvas-view",canvas)
import {controller} from "../../controller.js"
import {increment2dVectorBy, decrement2dVectorBy, multiply2dVectorByScalar, subtract2dVectors} from "../../maths.js";
import {binarySearch,binaryInsertion} from "../../dataStructureOperations.js";
import {abstractView} from "../view.js"

import {
    canvasOffsetX,
    canvasOffsetY,
    canvasWidth,
    canvasHeight,
    sensitivity, maximumThickness
} from "../../constants.js";

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
    
    overflow: visible;
    
    border: dashed;
}
</style>
<div id="zoom">
<img id="zoomOut" src="assets/zoomOut.svg" alt="zoom in button">
<input id="zoomBar" class="sliderHorizontal slider" type="range" min="0.001" max="5" value="1" step="any">
<img id="zoomIn" src="assets/zoomIn.svg" alt="zoom out button">
</div>

<svg id="canvas" viewBox="0 0 ${canvasWidth} ${canvasHeight}" preserveAspectRatio="none"></svg>
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

        // make sure that pointer event doesn't go on to create shenanigans elsewhere
        this.zoomBar.onpointerdown = (pointerEvent) => {
            pointerEvent.stopPropagation()
        }

        this.previousCanvasScale = 1

        this.shadowRoot.getElementById("zoomIn").onpointerdown = (pointerEvent) => {
            this.zoomIn()
            pointerEvent.stopPropagation()
        }
        this.shadowRoot.getElementById("zoomOut").onpointerdown = (pointerEvent) => {
            this.zoomOut()
            pointerEvent.stopPropagation()
        }

        // mapping of shape objects to their group elements on the canvas
        this.shapesToGeometry = new Map()

        // used to keep display shapes in the correct stacking order
        this.shapesInOrderOfZIndex = []

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
        controller.subscribeTo(this,"displayShapes")
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeFromInputs(this)
        controller.unsubscribeTo(this,"displayShapes")
    }

    errorCheckAggregateModel(aggregateModel){
        if (aggregateModel !== "displayShapes"){
            throw new Error(
                this+" is hearing about updates from "+aggregateModel+" which it shouldn't be subscribed to"
            )
        }
    }

    addModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        // shapes are organised in groups
        const shape = document.createElementNS("http://www.w3.org/2000/svg", "g")

        shape.innerHTML = model.geometry

        this.shapesToGeometry.set(model,shape)

        const insertAt = binaryInsertion(this.shapesInOrderOfZIndex,model.ZIndex,(shape) => {return shape.ZIndex})

        const geometryAfterNewShape = this.shapesToGeometry.get(this.shapesInOrderOfZIndex[insertAt])

        this.canvas.insertBefore(shape,geometryAfterNewShape)

        this.shapesInOrderOfZIndex.splice(insertAt,0,model)
    }

    updateAggregateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        this.canvas.replaceChildren()
        this.shapesToGeometry = new Map()
        this.shapesInOrderOfZIndex = []
        for (const shape of model){
            this.addModel(aggregateModel,shape)
        }
    }

    updateModel(aggregateModel,model){
        this.removeModel(aggregateModel,model)
        this.addModel(aggregateModel,model)
    }

    removeModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        this.canvas.removeChild(this.shapesToGeometry.get(model))

        this.shapesToGeometry.delete(model)

        for (let i = 0; i<this.shapesInOrderOfZIndex.length; i++){
            if (this.shapesInOrderOfZIndex[i] === model){
                this.shapesInOrderOfZIndex.splice(i,1)

                // any given display shape should only appear once in the list
                return
            }
        }
    }

    toCanvasCoordinates(x,y){

        const boundingRect = this.canvas.getBoundingClientRect()

        // this is required due to the fact the user has the option to zoom in and out
        return [canvasWidth*(x-boundingRect.x)/boundingRect.width, canvasHeight*(y-boundingRect.y)/boundingRect.height]
    }

    move(movementVector){
        increment2dVectorBy(this.canvasPosition,movementVector)
        this.canvas.style.left = this.canvasPosition[0]+"px"
        this.canvas.style.top = this.canvasPosition[1]+"px"
    }

    animateMove(){

        // deltaTime logic
        const currentTime = performance.now()
        const deltaTime = sensitivity*(currentTime-this.previousTime)
        this.previousTime = currentTime

        // updating position
        this.move(multiply2dVectorByScalar(deltaTime,this.movementVector))

        // loop (for as long as the animation frame isn't cancelled which is done in this.acceptKeyUp)
        this.nextAnimationFrame = requestAnimationFrame(this.animateMove.bind(this))
    }

    acceptKeyDown(keyboardEvent){

        const key = keyboardEvent.key.toLowerCase()

        // handle zoom
        if (keyboardEvent.ctrlKey){

            // account for different keys both indicating +
            if (key === "+" || key === "="){

                this.zoomIn()
                return true

            } else if (key === "-" || key === "_"){
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

            this.animateMove()
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

    updateZoom(){

        const canvasScale = parseFloat(this.zoomBar.value)

        // scale canvas to zoom bar input
        this.canvas.style.width = canvasScale*canvasWidth + "px"
        this.canvas.style.height = canvasScale*canvasHeight + "px"

        const windowRect = this.getBoundingClientRect()

        const centreOfScale = [
            (windowRect.width)/2,
            (windowRect.height)/2]

        // ensures the canvas scales about the centre of the window
        this.move(multiply2dVectorByScalar(
            1-(canvasScale/this.previousCanvasScale),
            subtract2dVectors(centreOfScale,this.canvasPosition)))

        this.previousCanvasScale = canvasScale
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
// This file contains the classes for the most fundamental types of window for the window manager

import {innerEdgeThicknessInt,innerEdgeThickness} from "./constants.js"
import {clamp} from "./maths.js"
import {addDragLogicTo} from "./dragLogic.js"

// The base window class that all types of window are inherited from
export class abstractWindow extends HTMLElement{
    constructor() {
        super();

        // used to declare the sets of vertical and horizontal subEdges
        this.resetSubEdges()

        // these values will only be used if we don't have a parent (when we are the root).
        // they are changed in the receiveParent function

        // parents have different things they want done when a child window changes
        this.updateParentFunction = () => {}

        // as the root, this is our position, otherwise these functions are recursive eventually reaching the root
        this.getGlobalLeftPosition = () => {return 0}
        this.getGlobalRightPosition = () => {return 1}
        this.getGlobalTopPosition = () => {return 0}
        this.getGlobalBottomPosition = () => {return 1}
    }

    receiveParent(parent,updateParentFunction){

        // parents may modify these functions further, depending on how the window is positioned within them
        this.getGlobalLeftPosition = () => {return parent.getGlobalLeftPosition()}
        this.getGlobalRightPosition = () => {return parent.getGlobalRightPosition()}
        this.getGlobalTopPosition = () => {return parent.getGlobalTopPosition()}
        this.getGlobalBottomPosition = () => {return parent.getGlobalBottomPosition()}

        this.updateParentFunction = updateParentFunction
    }

    resetSubEdges(){

        // subEdges on a vertical border (left or right) that connect to us
        this.verticalSubEdges = new Set()

        // on the top/bottom border
        this.horizontalSubEdges = new Set()
    }

    replaceSubEdges(newVerticalSubEdges,newHorizontalSubEdges){

        // clears the previous subEdges
        this.resetSubEdges()

        for (const subEdge of (newVerticalSubEdges)){
            this.addVerticalSubEdge(subEdge)
        }

        for (const subEdge of (newHorizontalSubEdges)){
            this.addHorizontalSubEdge(subEdge)
        }
    }

    // Puts the new window into the position of this window
    switchWindowTo(newWindow) {

        // I alert my parent that the window has been replaced, it handles appending to document and such
        this.updateParentFunction(newWindow)

        // give the new window my subEdges
        newWindow.replaceSubEdges(this.verticalSubEdges,this.horizontalSubEdges)

        // remove myself from the document
        this.remove()
    }

    addHorizontalSubEdge(subEdge){
        this.horizontalSubEdges.add(subEdge)

        // gives the subEdge a pointer to us for when it gets clicked and such
        subEdge.associatedWindow = this
    }

    addVerticalSubEdge(subEdge){
        this.verticalSubEdges.add(subEdge)

        // gives the subEdge a pointer to us for when it gets clicked and such
        subEdge.associatedWindow = this
    }

    // this function exists for polymorphism,
    // so that if a window without an edge is told to update its edge it will not raise an error
    updateEdgePosition(newPosition){
    }
}

// To be removed later once view is complete ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
window.customElements.define("abstract-window",abstractWindow)

// A window with a horizontal edge splitting it up vertically into a top window
export class verticallySplitWindow extends abstractWindow{
    constructor() {
        super()

        // proportion along this window the edge is located
        this.edgePosition = 0

        this.subEdgesToUpdateWhenEdgeMoves = new Set()

        // ensures the scope of this is not lost when this function is connected to an event listener
        this.dragEdge = this.dragEdge.bind(this)
    }

    connectedCallback(){
        this.attachShadow({mode:"open"})

        this.setTopWindow(document.createElement("abstract-window"))

        this.edge = document.createElement("div")
        this.edge.style.background = "black"
        this.edge.style.width = "100%"
        this.edge.style.height = innerEdgeThickness
        this.edge.style.position = "absolute"
        this.shadowRoot.appendChild(this.edge)

        addDragLogicTo(this.edge,this.dragEdge)

        this.setBottomWindow(document.createElement("abstract-window"))

        this.updateEdgePosition(0)
    }

    addSubEdgeToUpdateWhenEdgeMoves(newSubEdge){
        this.subEdgesToUpdateWhenEdgeMoves.add(newSubEdge)
    }

    replaceSubEdges(newVerticalSubEdges, newHorizontalSubEdges) {
        this.resetSubEdges()

        for (const subEdge of newVerticalSubEdges){

            // The vertical subEdges need to be split between the top and bottom windows
            const newSubEdge = subEdge.split()

            this.topWindow.addVerticalSubEdge(subEdge)
            this.bottomWindow.addVerticalSubEdge(newSubEdge)

            this.addSubEdgeToUpdateWhenEdgeMoves(newSubEdge)
        }

        for (const subEdge of newHorizontalSubEdges){

            // The horizontal subEdges need to be put on the correct window
            if (subEdge.label === "top"){
                this.topWindow.addHorizontalSubEdge(subEdge)
            } else if (subEdge.label === "bottom"){
                this.bottomWindow.addHorizontalSubEdge(subEdge)
            } else {

                // Raises an error if a subEdge is found with an unexpected label
                throw "there was a subEdge in the horizontal set that wasn't either top or bottom"
            }
        }
    }

    // Used to switch out the top window after it has been created
    updateTopWindow(newTopWindow){
        this.setTopWindow(newTopWindow)
        this.updateEdgePosition(this.edgePosition)
    }

    // Used to set up a topWindow, with correct references, styles etc.
    setTopWindow(topWindow){

        this.topWindow = topWindow

        this.topWindow.receiveParent(this,this.updateTopWindow.bind(this))

        this.topWindow.getGlobalBottomPosition = this.getGlobalEdgePosition.bind(this)

        this.topWindow.style.position = "absolute"
        this.topWindow.style.top = "0"
        this.topWindow.style.left = "0"
        this.topWindow.style.right = "0"

        this.shadowRoot.appendChild(this.topWindow)
    }

    // Used to switch out the bottom window after it has been created
    updateBottomWindow(newBottomWindow){
        this.setBottomWindow(newBottomWindow)
        this.updateEdgePosition(this.edgePosition)
    }

    // Used to set up a bottomWindow, with correct references, styles etc.
    setBottomWindow(bottomWindow){

        this.bottomWindow = bottomWindow

        this.bottomWindow.receiveParent(this,this.updateBottomWindow.bind(this))

        this.bottomWindow.getGlobalTopPosition = this.getGlobalEdgePosition.bind(this)

        this.bottomWindow.style.position = "absolute"
        this.bottomWindow.style.bottom = "0"
        this.bottomWindow.style.left = "0"
        this.bottomWindow.style.right = "0"

        this.shadowRoot.appendChild(this.bottomWindow)
    }

    // this function is called both when the edge changes position or something occurs,
    // like a parent window moving, that requires positioning to be updated.
    updateEdgePosition(newPosition){

        // as the edge position is a proportion of the window, it should be between 0 and 1
        this.edgePosition = clamp(newPosition,0,1)

        const topPercentage = this.edgePosition*100 + "%"
        const bottomPercentage = (1-this.edgePosition)*100 + "%"

        this.topWindow.style.bottom = `calc(${bottomPercentage} + ${innerEdgeThicknessInt/2}px)`
        this.edge.style.top = `calc(${topPercentage} - ${innerEdgeThicknessInt/2}px)`
        this.bottomWindow.style.top = `calc(${topPercentage} + ${innerEdgeThicknessInt/2}px)`

        // when the edge position of a parent changes, child edge positions need to be updated as well.
        this.topWindow.updateEdgePosition(this.topWindow.edgePosition)
        this.bottomWindow.updateEdgePosition(this.bottomWindow.edgePosition)

        const globalEdgePosition = this.getGlobalEdgePosition()

        for (const subEdge of this.subEdgesToUpdateWhenEdgeMoves){
            subEdge.updateStart(globalEdgePosition)
        }
    }

    getGlobalEdgePosition(){
        // as these functions are recursive, each call is quite expensive, so constant is defined to only call it once
        // calling this.getGlobalTopPosition() twice calls each recursive function twice which in turn call their
        // recursive functions twice, meaning calling this function a times here results in a^n calls where n
        // is the number of windows. To avoid large time complexities, it is imperative a = 1.
        const globalTopPosition = this.getGlobalTopPosition()
        return globalTopPosition + this.edgePosition * (this.getGlobalBottomPosition() - globalTopPosition)
    }

    // function is called every time the mouse changes position during a drag
    dragEdge(mouseEvent){
        const boundingRectangle = this.getBoundingClientRect()

        this.updateEdgePosition((mouseEvent.clientY-boundingRectangle.top)/boundingRectangle.height)
    }
}

window.customElements.define("vertically-split-window",verticallySplitWindow)

// A window with a vertical edge splitting it horizontally
export class horizontallySplitWindow extends abstractWindow{
    constructor() {
        super()

        this.edgePosition = 0

        this.subEdgesToUpdateWhenEdgeMoves = new Set()

        // ensures the scope of this is not lost when this function is connected to an event listener
        this.dragEdge = this.dragEdge.bind(this)
    }

    connectedCallback(){
        this.attachShadow({mode:"open"})

        this.setLeftWindow(document.createElement("abstract-window"))

        this.edge = document.createElement("div")
        this.edge.style.background = "black"
        this.edge.style.height = "100%"
        this.edge.style.width = innerEdgeThickness
        this.edge.style.position = "absolute"
        this.shadowRoot.appendChild(this.edge)

        addDragLogicTo(this.edge,this.dragEdge)

        this.setRightWindow(document.createElement("abstract-window"))

        this.updateEdgePosition(0)
    }

    addSubEdgeToUpdateWhenEdgeMoves(newSubEdge){
        this.subEdgesToUpdateWhenEdgeMoves.add(newSubEdge)
    }

    replaceSubEdges(newVerticalSubEdges, newHorizontalSubEdges) {
        this.resetSubEdges()

        for (const subEdge of newHorizontalSubEdges){
            const newSubEdge = subEdge.split()

            this.leftWindow.addHorizontalSubEdge(subEdge)
            this.rightWindow.addHorizontalSubEdge(newSubEdge)

            this.addSubEdgeToUpdateWhenEdgeMoves(newSubEdge)
        }

        for (const subEdge of newVerticalSubEdges){
            if (subEdge.label === "left"){
                this.leftWindow.addVerticalSubEdge(subEdge)
            } else if (subEdge.label === "right"){
                this.rightWindow.addVerticalSubEdge(subEdge)
            } else {
                throw "there was a subEdge in the vertical set that wasn't either left or right"
            }
        }
    }

    updateLeftWindow(newLeftWindow){
        this.setLeftWindow(newLeftWindow)
        this.updateEdgePosition(this.edgePosition)
    }

    updateRightWindow(newRightWindow){
        this.setRightWindow(newRightWindow)
        this.updateEdgePosition(this.edgePosition)
    }

    setLeftWindow(leftWindow){
        this.leftWindow = leftWindow

        this.leftWindow.receiveParent(this,this.updateLeftWindow.bind(this))

        this.leftWindow.getGlobalRightPosition = this.getGlobalEdgePosition.bind(this)

        this.leftWindow.style.position = "absolute"
        this.leftWindow.style.left = "0"
        this.leftWindow.style.top = "0"
        this.leftWindow.style.bottom = "0"
        this.shadowRoot.appendChild(this.leftWindow)
    }

    setRightWindow(rightWindow){
        this.rightWindow = rightWindow

        this.rightWindow.receiveParent(this,this.updateRightWindow.bind(this))

        this.rightWindow.getGlobalLeftPosition = this.getGlobalEdgePosition.bind(this)

        this.rightWindow.style.position = "absolute"
        this.rightWindow.style.right = "0"
        this.rightWindow.style.top = "0"
        this.rightWindow.style.bottom = "0"
        this.shadowRoot.appendChild(this.rightWindow)
    }

    updateEdgePosition(newPosition){

        this.edgePosition = clamp(newPosition,0,1)

        const leftPercentage = this.edgePosition*100 + "%"
        const rightPercentage = (1-this.edgePosition)*100 + "%"

        this.leftWindow.style.right = `calc(${rightPercentage} + ${innerEdgeThicknessInt/2}px)`
        this.edge.style.left = `calc(${leftPercentage} - ${innerEdgeThicknessInt/2}px)`
        this.rightWindow.style.left = `calc(${leftPercentage} + ${innerEdgeThicknessInt/2}px)`

        this.leftWindow.updateEdgePosition(this.leftWindow.edgePosition)
        this.rightWindow.updateEdgePosition(this.rightWindow.edgePosition)

        const globalEdgePosition = this.getGlobalEdgePosition()

        for (const subEdge of this.subEdgesToUpdateWhenEdgeMoves){
            subEdge.updateStart(globalEdgePosition)
        }
    }

    getGlobalEdgePosition(){
        // as these functions are recursive, each call is quite expensive, so constant is defined to only call it once
        // calling this.getGlobalLeftPosition() twice calls each recursive function twice which in turn call their
        // recursive functions twice, meaning calling this function a times here results in a^n calls where n
        // is the number of windows. To avoid large time complexities, it is imperative a = 1.
        const globalLeftPosition = this.getGlobalLeftPosition()
        return globalLeftPosition + this.edgePosition*(this.getGlobalRightPosition()-globalLeftPosition)
    }

    // called when the edge of the window is dragged
    dragEdge(mouseEvent){
        const boundingRectangle = this.getBoundingClientRect()

        this.updateEdgePosition((mouseEvent.clientX - boundingRectangle.left)/boundingRectangle.width)
    }
}

window.customElements.define("horizontally-split-window",horizontallySplitWindow)
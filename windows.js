// This file contains the classes for the most fundamental types of window for the window manager

import {innerEdgeThicknessInt,innerEdgeThickness} from "./constants.js"

// The base window class that all types of window are inherited from
export class abstractWindow extends HTMLElement{
    constructor() {
        super();

        // used to declare the sets of vertical and horizontal subEdges
        this.resetSubEdges()

        // called when this window is switched to alert the parent window
        // the parent window will modify this function if it exists/needs to
        this.updateParentFunction = () => {}

        // saved as a proportion across the root window
        this.globalLeftPosition = 0
        this.globalRightPosition = 1
        this.globalTopPosition = 0
        this.globalBottomPosition = 1

        this.attachShadow({mode:"open"})
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
}

// To be removed later once view is complete ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
window.customElements.define("abstract-window",abstractWindow)

// A window with a horizontal edge splitting it up vertically into a top window
export class verticallySplitWindow extends abstractWindow{
    constructor() {
        super()

        // proportion along this window the edge is located
        this.edgePosition = 0.5

        this.subEdgesToUpdateWhenEdgeMoves = new Set()
    }

    connectedCallback(){
        this.setTopWindow(document.createElement("abstract-window"))

        this.edge = document.createElement("div")
        this.edge.style.background = "black"
        this.edge.style.width = "100%"
        this.edge.style.height = innerEdgeThickness
        this.edge.style.position = "absolute"
        this.shadowRoot.appendChild(this.edge)

        this.setBottomWindow(document.createElement("abstract-window"))

        this.updateEdgePosition(0.5)
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

        this.topWindow.globalTopPosition = this.globalTopPosition
        this.topWindow.globalLeftPosition = this.globalLeftPosition
        this.topWindow.globalRightPosition = this.globalRightPosition

        this.topWindow.style.position = "absolute"
        this.topWindow.style.top = "0"
        this.topWindow.style.left = "0"
        this.topWindow.style.right = "0"

        this.shadowRoot.appendChild(this.topWindow)

        this.topWindow.updateParentFunction = this.updateTopWindow.bind(this)
    }

    // Used to switch out the bottom window after it has been created
    updateBottomWindow(newBottomWindow){
        this.setBottomWindow(newBottomWindow)
        this.updateEdgePosition(this.edgePosition)
    }

    // Used to set up a bottomWindow, with correct references, styles etc.
    setBottomWindow(bottomWindow){

        this.bottomWindow = bottomWindow

        this.bottomWindow.globalBottomPosition = this.globalBottomPosition
        this.bottomWindow.globalLeftPosition = this.globalLeftPosition
        this.bottomWindow.globalRightPosition = this.globalRightPosition

        this.bottomWindow.style.position = "absolute"
        this.bottomWindow.style.bottom = "0"
        this.bottomWindow.style.left = "0"
        this.bottomWindow.style.right = "0"

        this.shadowRoot.appendChild(this.bottomWindow)

        this.bottomWindow.updateParentFunction = this.updateBottomWindow.bind(this)
    }

    updateEdgePosition(newPosition){

        /*
        if (newPosition < 0){
            this.updateEdgePosition(0)
            return
        }
        if (newPosition > 1){
            this.updateEdgePosition(1)
            return
        }
         */

        this.edgePosition = newPosition

        const topPercentage = newPosition*100 + "%"
        const bottomPercentage = (1-newPosition)*100 + "%"

        this.topWindow.style.bottom = `calc(${bottomPercentage} + ${innerEdgeThicknessInt/2}px)`
        this.edge.style.top = `calc(${topPercentage} - ${innerEdgeThicknessInt/2}px)`
        this.bottomWindow.style.top = `calc(${topPercentage} + ${innerEdgeThicknessInt/2}px)`

        const globalEdgePosition = this.globalTopPosition + newPosition*(this.globalBottomPosition-this.globalTopPosition)
        this.topWindow.globalBottomPosition = globalEdgePosition
        this.bottomWindow.globalTopPosition = globalEdgePosition

        for (const subEdge of this.subEdgesToUpdateWhenEdgeMoves){
            subEdge.updateStart(globalEdgePosition)
        }
    }
}

window.customElements.define("vertically-split-window",verticallySplitWindow)

export class horizontallySplitWindow extends abstractWindow{
    constructor() {
        super()

        this.edgePosition = 0.5

        this.subEdgesToUpdateWhenEdgeMoves = new Set()
    }

    connectedCallback(){

        this.setLeftWindow(document.createElement("abstract-window"))

        this.edge = document.createElement("div")
        this.edge.style.background = "black"
        this.edge.style.height = "100%"
        this.edge.style.width = innerEdgeThickness
        this.edge.style.position = "absolute"
        this.shadowRoot.appendChild(this.edge)

        this.setRightWindow(document.createElement("abstract-window"))

        this.updateEdgePosition(0.5)
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

        this.leftWindow.globalLeftPosition = this.globalLeftPosition
        this.leftWindow.globalTopPosition = this.globalTopPosition
        this.leftWindow.globalBottomPosition = this.globalBottomPosition

        this.leftWindow.style.position = "absolute"
        this.leftWindow.style.left = "0"
        this.leftWindow.style.top = "0"
        this.leftWindow.style.bottom = "0"
        this.shadowRoot.appendChild(this.leftWindow)

        this.leftWindow.updateParentFunction = this.updateLeftWindow.bind(this)
    }

    setRightWindow(rightWindow){
        this.rightWindow = rightWindow

        this.rightWindow.globalRightPosition = this.globalRightPosition
        this.rightWindow.globalTopPosition = this.globalTopPosition
        this.rightWindow.globalBottomPosition = this.globalBottomPosition

        this.rightWindow.style.position = "absolute"
        this.rightWindow.style.right = "0"
        this.rightWindow.style.top = "0"
        this.rightWindow.style.bottom = "0"
        this.shadowRoot.appendChild(this.rightWindow)

        this.rightWindow.updateParentFunction = this.updateRightWindow.bind(this)
    }

    updateEdgePosition(newPosition){

        /*
        if (newPosition < 0){
            this.updateEdgePosition(0)
            return
        }
        if (newPosition > 1){
            this.updateEdgePosition(1)
            return
        }
         */

        this.edgePosition = newPosition

        const leftPercentage = newPosition*100 + "%"
        const rightPercentage = (1-newPosition)*100 + "%"

        this.leftWindow.style.right = `calc(${rightPercentage} + ${innerEdgeThicknessInt/2}px)`
        this.edge.style.left = `calc(${leftPercentage} - ${innerEdgeThicknessInt/2}px)`
        this.rightWindow.style.left = `calc(${leftPercentage} + ${innerEdgeThicknessInt/2}px)`

        const globalEdgePosition = this.globalLeftPosition + newPosition*(this.globalRightPosition-this.globalLeftPosition)
        this.leftWindow.globalRightPosition = globalEdgePosition
        this.rightWindow.globalLeftPosition = globalEdgePosition

        for (const subEdge of this.subEdgesToUpdateWhenEdgeMoves){
            subEdge.updateStart(globalEdgePosition)
        }
    }
}

window.customElements.define("horizontally-split-window",horizontallySplitWindow)
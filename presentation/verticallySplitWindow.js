// A window with a horizontal edge splitting it up vertically into a top window

import {abstractWindow} from "./window.js"
import {addDragLogicTo} from "../dragLogic.js";
import {clamp} from "../maths.js";
import {innerEdgeThicknessInt,innerEdgeThickness,defaultEdgePosition} from "../constants.js"

class verticallySplitWindow extends abstractWindow{
    constructor() {
        super()

        // proportion along this window the edge is located
        this.edgePosition = defaultEdgePosition

        this.subEdgesToUpdateWhenEdgeMoves = new Set()

        // ensures the scope of this is not lost when this function is connected to an event listener
        this.drag = this.drag.bind(this)
        this.endDrag = this.endDrag.bind(this)

        this.attachShadow({mode:"open"})

        this.setTopWindow(document.createElement("abstract-view"))

        this.edge = document.createElement("div")
        this.edge.style.background = "black"
        this.edge.style.width = "100%"
        this.edge.style.height = innerEdgeThickness
        this.edge.style.position = "absolute"
        this.shadowRoot.appendChild(this.edge)

        addDragLogicTo(this.edge,this.drag,this.endDrag,"row-resize","row-resize")

        this.setBottomWindow(document.createElement("abstract-view"))

        this.updateEdgePosition(defaultEdgePosition)
    }

    setFullScreen(newFullScreen) {
        super.setFullScreen(newFullScreen)

        this.topWindow.setFullScreen(newFullScreen)
        this.bottomWindow.setFullScreen(newFullScreen)
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

        // ensures the new subEdges have the correct positions
        this.updateEdgePosition(this.edgePosition)
    }

    getAllSubEdgesOfLabel(label) {
        if (label === "left" || label === "right"){
            return this.topWindow.getAllSubEdgesOfLabel(label).concat(this.bottomWindow.getAllSubEdgesOfLabel(label))
        }
        if (label === "top"){
            return this.topWindow.getAllSubEdgesOfLabel(label)
        }
        if (label === "bottom"){
            return this.bottomWindow.getAllSubEdgesOfLabel(label)
        }

        throw "you asked to get a subEdge without one of the following labels: top/left/right/bottom"
    }

    // Used to switch out the top window after it has been created
    updateTopWindow(newTopWindow){
        this.setTopWindow(newTopWindow)
        this.updateEdgePosition(this.edgePosition)
        this.topWindow.setFullScreen(this.fullScreen)
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
        this.bottomWindow.setFullScreen(this.fullScreen)
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

    // for efficiency when mid-drag
    updateEdgePositionWithoutUpdatingSubEdges(newPosition){
        // as the edge position is a proportion, it should be between 0 and 1
        this.edgePosition = clamp(newPosition,0,1)

        const topPercentage = this.edgePosition*100 + "%"
        const bottomPercentage = (1-this.edgePosition)*100 + "%"

        this.topWindow.style.bottom = `calc(${bottomPercentage} + ${innerEdgeThicknessInt/2}px)`
        this.edge.style.top = `calc(${topPercentage} - ${innerEdgeThicknessInt/2}px)`
        this.bottomWindow.style.top = `calc(${topPercentage} + ${innerEdgeThicknessInt/2}px)`
    }

    // this function is called both when the edge changes position or something occurs,
    // like a parent window moving, that requires positioning to be updated.
    updateEdgePosition(newPosition){

        this.updateEdgePositionWithoutUpdatingSubEdges(newPosition)

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

    // function is called every time the pointer changes position during a drag
    drag(pointerEvent){
        const boundingRectangle = this.getBoundingClientRect()

        this.updateEdgePositionWithoutUpdatingSubEdges((pointerEvent.clientY-boundingRectangle.top)/boundingRectangle.height)
    }

    endDrag(pointerEvent){
        const boundingRectangle = this.getBoundingClientRect()

        this.updateEdgePosition((pointerEvent.clientY-boundingRectangle.top)/boundingRectangle.height)

        // if the top window is being closed
        if (pointerEvent.clientY < boundingRectangle.top){

            const allTopSubEdges = this.getAllSubEdgesOfLabel("top")

            // merging all subEdges of the edge we are closing into (if they exist)
            if (allTopSubEdges.length > 0) {

                const newTopSubEdge = allTopSubEdges[0]
                newTopSubEdge.mergeForward(allTopSubEdges[allTopSubEdges.length-1].nextSubEdge)

                // projecting the new geometry onto the newly merged subEdge
                this.bottomWindow.projectTopSubEdgeOn(newTopSubEdge)
            }

            const subEdgesLeftward = this.topWindow.getAllSubEdgesOfLabel("left")
            if (subEdgesLeftward.length > 0){
                subEdgesLeftward[subEdgesLeftward.length-1].nextSubEdge
                    .mergeBackward(subEdgesLeftward[0].previousSubEdge)
            }

            // merging any top and bottom subEdges dedicated to now closed windows
            const subEdgesRightward = this.topWindow.getAllSubEdgesOfLabel("right")
            if (subEdgesRightward.length > 0){
                subEdgesRightward[subEdgesRightward.length-1].nextSubEdge
                    .mergeBackward(subEdgesRightward[0].previousSubEdge)
            }

            this.updateParentFunction(this.bottomWindow)
            this.remove()

        } else if (pointerEvent.clientY > boundingRectangle.bottom){

            const allBottomSubEdges = this.getAllSubEdgesOfLabel("bottom")

            if (allBottomSubEdges.length > 0){
                const newBottomSubEdge = allBottomSubEdges[0]
                newBottomSubEdge.mergeForward(allBottomSubEdges[allBottomSubEdges.length-1].nextSubEdge)

                this.topWindow.projectBottomSubEdgeOn(newBottomSubEdge)
            }

            const subEdgesLeftward = this.bottomWindow.getAllSubEdgesOfLabel("left")
            if (subEdgesLeftward.length > 0){
                subEdgesLeftward[0].previousSubEdge
                    .mergeForward(subEdgesLeftward[subEdgesLeftward.length-1].nextSubEdge)
            }

            const subEdgesRightward = this.bottomWindow.getAllSubEdgesOfLabel("right")
            if (subEdgesRightward.length > 0){
                subEdgesRightward[0].previousSubEdge
                    .mergeForward(subEdgesRightward[subEdgesRightward.length-1].nextSubEdge)
            }

            this.updateParentFunction(this.topWindow)
            this.remove()
        }
    }

    // these split up merged subEdges into parts based on the geometry of the window
    projectLeftSubEdgeOn(subEdge){
        const newSubEdge = subEdge.split()
        newSubEdge.updateStart(this.getGlobalEdgePosition())

        this.addSubEdgeToUpdateWhenEdgeMoves(newSubEdge)

        this.topWindow.projectLeftSubEdgeOn(subEdge)
        this.bottomWindow.projectLeftSubEdgeOn(newSubEdge)
    }

    projectRightSubEdgeOn(subEdge){
        const newSubEdge = subEdge.split()
        newSubEdge.updateStart(this.getGlobalEdgePosition())

        this.addSubEdgeToUpdateWhenEdgeMoves(newSubEdge)

        this.topWindow.projectRightSubEdgeOn(subEdge)
        this.bottomWindow.projectRightSubEdgeOn(newSubEdge)
    }

    projectTopSubEdgeOn(subEdge){
        this.topWindow.projectTopSubEdgeOn(subEdge)
    }

    projectBottomSubEdgeOn(subEdge){
        this.bottomWindow.projectBottomSubEdgeOn(subEdge)
    }
}

window.customElements.define("vertically-split-window",verticallySplitWindow)
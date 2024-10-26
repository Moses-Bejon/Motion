// A window with a vertical edge splitting it horizontally

import {abstractWindow} from "./window.js"
import {addDragLogicTo} from "./dragLogic.js"
import {clamp} from "./maths.js"
import {innerEdgeThickness, innerEdgeThicknessInt, defaultEdgePosition} from "./constants.js"


class horizontallySplitWindow extends abstractWindow{
    constructor() {
        super()

        // proportion along this window the edge is located
        this.edgePosition = defaultEdgePosition

        this.subEdgesToUpdateWhenEdgeMoves = new Set()

        // ensures the scope of this is not lost when this function is connected to an event listener
        this.drag = this.drag.bind(this)
        this.endDrag = this.endDrag.bind(this)

        this.attachShadow({mode:"open"})

        this.setLeftWindow(document.createElement("abstract-view"))

        this.edge = document.createElement("div")
        this.edge.style.background = "black"
        this.edge.style.height = "100%"
        this.edge.style.width = innerEdgeThickness
        this.edge.style.position = "absolute"
        this.shadowRoot.appendChild(this.edge)

        addDragLogicTo(this.edge,this.drag,this.endDrag)

        this.setRightWindow(document.createElement("abstract-view"))

        this.updateEdgePosition(defaultEdgePosition)
    }

    setFullScreen(newFullScreen) {
        super.setFullScreen(newFullScreen)

        this.leftWindow.setFullScreen(newFullScreen)
        this.rightWindow.setFullScreen(newFullScreen)
    }

    addSubEdgeToUpdateWhenEdgeMoves(newSubEdge){
        this.subEdgesToUpdateWhenEdgeMoves.add(newSubEdge)
    }

    replaceSubEdges(newVerticalSubEdges, newHorizontalSubEdges) {
        this.resetSubEdges()

        for (const subEdge of newHorizontalSubEdges){

            // The horizontal subEdges need to be split between the left and right windows
            const newSubEdge = subEdge.split()

            this.leftWindow.addHorizontalSubEdge(subEdge)
            this.rightWindow.addHorizontalSubEdge(newSubEdge)

            this.addSubEdgeToUpdateWhenEdgeMoves(newSubEdge)
        }

        for (const subEdge of newVerticalSubEdges){

            // The vertical subEdges need to be put on the correct window
            if (subEdge.label === "left"){
                this.leftWindow.addVerticalSubEdge(subEdge)
            } else if (subEdge.label === "right"){
                this.rightWindow.addVerticalSubEdge(subEdge)
            } else {

                // Raise an error if a subEdge is found with an unexpected label
                throw "there was a subEdge in the vertical set that wasn't either left or right"
            }
        }

        // ensures the new subEdges have the correct positions
        this.updateEdgePosition(this.edgePosition)
    }

    getAllSubEdgesOfLabel(label) {
        if (label === "top" || label === "bottom"){
            return this.leftWindow.getAllSubEdgesOfLabel(label).concat(this.rightWindow.getAllSubEdgesOfLabel(label))
        }
        if (label === "left"){
            return this.leftWindow.getAllSubEdgesOfLabel(label)
        }
        if (label === "right"){
            return this.rightWindow.getAllSubEdgesOfLabel(label)
        }

        throw "you asked to get a subEdge without one of the following labels: top/left/right/bottom"
    }

    // Used to switch out the left window after it has been created
    updateLeftWindow(newLeftWindow){
        this.setLeftWindow(newLeftWindow)
        this.updateEdgePosition(this.edgePosition)
    }

    // Used to switch out the right window after it has been created
    updateRightWindow(newRightWindow){
        this.setRightWindow(newRightWindow)
        this.updateEdgePosition(this.edgePosition)
    }

    // Used to set up the left window with the correct references, styles, etc.
    setLeftWindow(leftWindow){
        this.leftWindow = leftWindow

        this.leftWindow.receiveParent(this,this.updateLeftWindow.bind(this))

        this.leftWindow.getGlobalRightPosition = this.getGlobalEdgePosition.bind(this)

        this.leftWindow.style.position = "absolute"
        this.leftWindow.style.left = "0"
        this.leftWindow.style.top = "0"
        this.leftWindow.style.bottom = "0"

        this.leftWindow.setFullScreen(this.fullScreen)

        this.shadowRoot.appendChild(this.leftWindow)
    }

    // Used to set up the right window with the correct references, styles, etc.
    setRightWindow(rightWindow){
        this.rightWindow = rightWindow

        this.rightWindow.receiveParent(this,this.updateRightWindow.bind(this))

        this.rightWindow.getGlobalLeftPosition = this.getGlobalEdgePosition.bind(this)

        this.rightWindow.style.position = "absolute"
        this.rightWindow.style.right = "0"
        this.rightWindow.style.top = "0"
        this.rightWindow.style.bottom = "0"

        this.rightWindow.setFullScreen(this.fullScreen)

        this.shadowRoot.appendChild(this.rightWindow)
    }

    // this function is called both when the edge changes position or something occurs,
    // like a parent window moving, that requires positioning to be updated.
    updateEdgePosition(newPosition){

        // as the edge position is a proportion, it should be between 0 and 1
        this.edgePosition = clamp(newPosition,0,1)

        const leftPercentage = this.edgePosition*100 + "%"
        const rightPercentage = (1-this.edgePosition)*100 + "%"

        this.leftWindow.style.right = `calc(${rightPercentage} + ${innerEdgeThicknessInt/2}px)`
        this.edge.style.left = `calc(${leftPercentage} - ${innerEdgeThicknessInt/2}px)`
        this.rightWindow.style.left = `calc(${leftPercentage} + ${innerEdgeThicknessInt/2}px)`

        // when the edge position of a parent changes, child edge positions need to be updated
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
    drag(pointerEvent){
        const boundingRectangle = this.getBoundingClientRect()

        this.updateEdgePosition((pointerEvent.clientX - boundingRectangle.left)/boundingRectangle.width)
    }

    endDrag(pointerEvent){
        const boundingRectangle = this.getBoundingClientRect()

        // if the left window is being closed
        if (pointerEvent.clientX < boundingRectangle.left){
            const allLeftSubEdges = this.getAllSubEdgesOfLabel("left")

            // merging all subEdges of the edge we are closing into (if they exist)
            if (allLeftSubEdges.length > 0){

                const newLeftSubEdge = allLeftSubEdges[0]
                newLeftSubEdge.mergeForward(allLeftSubEdges[allLeftSubEdges.length-1].nextSubEdge)

                // projecting the new geometry onto the newly merged subEdge
                this.rightWindow.projectLeftSubEdgeOn(newLeftSubEdge)
            }

            // merging any left and right subEdges dedicated to now closed windows
            const subEdgesAbove = this.leftWindow.getAllSubEdgesOfLabel("top")
            if (subEdgesAbove.length > 0){
                subEdgesAbove[subEdgesAbove.length - 1].nextSubEdge.mergeBackward(subEdgesAbove[0].previousSubEdge)
            }

            const subEdgesBelow = this.leftWindow.getAllSubEdgesOfLabel("bottom")
            if (subEdgesBelow.length > 0) {
                subEdgesBelow[subEdgesBelow.length - 1].nextSubEdge.mergeBackward(subEdgesBelow[0].previousSubEdge)
            }

            this.updateParentFunction(this.rightWindow)
            this.remove()

        } else if (pointerEvent.clientX > boundingRectangle.right){

            const allRightSubEdges = this.getAllSubEdgesOfLabel("right")

            if (allRightSubEdges.length > 0) {

                const newRightSubEdge = allRightSubEdges[0]
                newRightSubEdge.mergeForward(allRightSubEdges[allRightSubEdges.length-1].nextSubEdge)

                this.leftWindow.projectRightSubEdgeOn(newRightSubEdge)
            }

            const subEdgesAbove = this.rightWindow.getAllSubEdgesOfLabel("top")
            if (subEdgesAbove.length > 0){
                subEdgesAbove[0].previousSubEdge.mergeForward(subEdgesAbove[subEdgesAbove.length-1].nextSubEdge)
            }

            const subEdgesBelow = this.rightWindow.getAllSubEdgesOfLabel("bottom")
            if (subEdgesBelow.length > 0){
                subEdgesBelow[0].previousSubEdge.mergeForward(subEdgesBelow[subEdgesBelow.length-1].nextSubEdge)
            }

            this.updateParentFunction(this.leftWindow)
            this.remove()
        }
    }

    // these split up merged subEdges into parts based on the geometry of the window
    projectTopSubEdgeOn(subEdge){
        const newSubEdge = subEdge.split()
        newSubEdge.updateStart(this.getGlobalEdgePosition())

        this.addSubEdgeToUpdateWhenEdgeMoves(newSubEdge)

        this.leftWindow.projectTopSubEdgeOn(subEdge)
        this.rightWindow.projectTopSubEdgeOn(newSubEdge)
    }

    projectBottomSubEdgeOn(subEdge){
        const newSubEdge = subEdge.split()
        newSubEdge.updateStart(this.getGlobalEdgePosition())

        this.addSubEdgeToUpdateWhenEdgeMoves(newSubEdge)

        this.leftWindow.projectBottomSubEdgeOn(subEdge)
        this.rightWindow.projectBottomSubEdgeOn(newSubEdge)
    }

    projectLeftSubEdgeOn(subEdge){
        this.leftWindow.projectLeftSubEdgeOn(subEdge)
    }

    projectRightSubEdgeOn(subEdge){
        this.rightWindow.projectRightSubEdgeOn(subEdge)
    }
}

window.customElements.define("horizontally-split-window",horizontallySplitWindow)
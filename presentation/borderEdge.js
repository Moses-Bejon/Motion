import {addCreateLogicTo} from "../dragLogic.js";

// The border edge contains and manages the creation of subEdges
export class BorderEdge extends HTMLElement{
    static observedAttributes = ["type"]

    constructor() {
        super()

        this.attachShadow({mode:"open"})
    }

    attributeChangedCallback(name,oldValue,newValue){

        // type determines whether or not this sub-borderEdge is on the left/right sides or top/bottom sides
        if (name === "type"){
            if (newValue === "vertical"){

                // this.start, this.end and this.thickness hold what attribute
                // should be changed when the start, end or thickness of a sub-borderEdge changes
                this.start = "top"
                this.end = "bottom"
                this.thickness = "width"

            } else if (newValue === "horizontal") {
                this.start = "left"
                this.end = "right"
                this.thickness = "height"
            }
        }
    }

    // gives the border a reference to the borders it should call when it wants to add new subEdges
    // this is separate from the constructor because they need to exist before they can know about each other
    // all borderEdges need to be activated
    activate(edgeBefore,edgeAfter,window,subEdgeLabel,newWindowFunction){
        this.newWindow = newWindowFunction
        this.subEdgeLabel = subEdgeLabel

        // creates the first subEdge on this border edge
        const firstSubEdge = this.createNewSubEdge(window)
        firstSubEdge.style[this.start] = 0
        firstSubEdge.style[this.end] = 0

        firstSubEdge.previousSubEdge = null
        firstSubEdge.nextSubEdge = null

        this.shadowRoot.replaceChildren(firstSubEdge)

        return firstSubEdge
    }

    createNewSubEdge(associatedWindow){
        const subEdge = document.createElement("div")
        subEdge.associatedWindow = associatedWindow
        subEdge.label = this.subEdgeLabel
        subEdge.style.position = "absolute"
        subEdge.style[this.thickness] = "100%"

        // handles the task of splitting a window when the new subEdge is clicked
        addCreateLogicTo(subEdge,() => {
            // calls the new window function passed in from activate
            return this.newWindow(subEdge)
        })

        // if a window's edge moves, the start of the sub edge will be updated
        subEdge.updateStart = (newStart) => {

            if (subEdge.previousSubEdge) {
                subEdge.previousSubEdge.style[this.end] = (1-newStart)*100 + "%"
            }
            subEdge.style[this.start] = newStart*100 + "%"
        }

        // splits a sub edge in to if a window gets replaced with a split window
        subEdge.split = () => {

            const newSubEdge = this.createNewSubEdge()

            if (subEdge.nextSubEdge) {
                newSubEdge.nextSubEdge = subEdge.nextSubEdge
                subEdge.nextSubEdge.previousSubEdge = newSubEdge
            } else {
                newSubEdge.nextSubEdge = null
            }
            subEdge.nextSubEdge = newSubEdge
            newSubEdge.previousSubEdge = subEdge

            newSubEdge.style[this.end] = subEdge.style[this.end]

            this.shadowRoot.appendChild(newSubEdge)

            return newSubEdge
        }

        subEdge.mergeBackward = (endAt = null) => {

            let subEdgeToRemove = subEdge

            while (subEdgeToRemove.previousSubEdge !== endAt){
                subEdgeToRemove = subEdgeToRemove.previousSubEdge
                subEdgeToRemove.remove()
            }

            subEdge.previousSubEdge = subEdgeToRemove.previousSubEdge

            if (subEdge.previousSubEdge) {
                subEdge.previousSubEdge.nextSubEdge = subEdge
            }

            subEdge.style[this.start] = subEdgeToRemove.style[this.start]
        }

        subEdge.mergeForward = (endAt = null) => {

            let subEdgeToRemove = subEdge

            while (subEdgeToRemove.nextSubEdge !== endAt){
                subEdgeToRemove = subEdgeToRemove.nextSubEdge
                subEdgeToRemove.remove()
            }

            subEdge.nextSubEdge = subEdgeToRemove.nextSubEdge

            if (subEdge.nextSubEdge) {
                subEdge.nextSubEdge.previousSubEdge = subEdge
            }

            subEdge.style[this.end] = subEdgeToRemove.style[this.end]
        }

        return subEdge
    }

}

window.customElements.define("border-edge",BorderEdge)
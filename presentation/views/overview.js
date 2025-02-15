import {abstractView} from "../view.js";
import {controller} from "../../controller.js";
import {typicalIconSizeInt,typicalIconSize} from "../../constants.js";

const template = document.createElement("template")
template.innerHTML = `
    <style>
        #newDirectoryButton{
            position: relative;
            left: ${typicalIconSizeInt*2}px;
            height: ${typicalIconSizeInt}px;
            cursor: pointer;
        }
        #shapesList{
            width: 100%;
            overflow-y: auto;
            height: calc(100% - ${typicalIconSize});
        }
        .shapeListing,.selectedShapeListing{
            border: 1px solid lightgray;
            height: ${typicalIconSize};
            display: flex;
            justify-content: space-between;
        }
        .selectedShapeListing{
            background-color: darkgray;
        }
        .shapeListing:hover{
            background-color: lightgray;
        }
        .selectedShapeListing:hover{
            background-color: gray;
        }
        .shapeName{
            background-color: transparent;
            border: none;
            color: black;
            flex-grow: 1;
            flex-shrink: 1;
            min-width: 0;
        }
        .overviewButton{
            cursor: pointer;
        }
    </style>
    <button id="newDirectoryButton">New Directory</button>
    <div id="shapesList"></div>
`

export class overview extends abstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.shapesList = this.shadowRoot.getElementById("shapesList")

        this.shapeToShapeListing = new Map()
        this.shapeListingToShape = new Map()
    }

    connectedCallback() {
        super.connectedCallback()

        // can only modify the following once connected
        this.style.backgroundColor = "white"

        // when am disconnected, need to unsubscribe so not taking up space in controller
        // however, am sometimes disconnected due to windows moving around
        // therefore, I subscribe every time I connect and unsubscribe every time I disconnect
        controller.subscribeTo(this,"allShapes")
        controller.subscribeTo(this,"selectedShapes")
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeTo(this,"allShapes")
        controller.unsubscribeTo(this,"selectedShapes")
    }

    errorCheckAggregateModel(aggregateModel){
        if (aggregateModel !== "allShapes" && aggregateModel !== "selectedShapes"){
            console.error("shape editor got updates from",aggregateModel)
        }
    }

    selectBetween(element1,element2){
        while (element1.nextSibling !== element2){
            element1 = element1.nextSibling
            if (element1.className === "shapeListing"){
                controller.selectShape(this.shapeListingToShape.get(element1))
            }
        }
    }

    addModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes"){
            const shapeListing = document.createElement("div")
            shapeListing.className = "shapeListing"

            shapeListing.onpointerdown = (pointerEvent) => {
                if (pointerEvent.ctrlKey){
                    controller.selectShape(model)
                } else if (pointerEvent.shiftKey){

                    // select elements between selected shape and clicked shape, including clicked shape

                    // if it's not selected, select it. This means we now only have to select the shapes between it
                    // and a selected shape
                    if (!controller.isSelected(model)){
                        controller.selectShape(model)
                    }

                    let listing = shapeListing

                    // search backward until selected shape found. We prioritise going down.
                    while (listing.previousSibling !== null){
                        listing = listing.previousSibling
                        if (listing.className === "selectedShapeListing"){
                            this.selectBetween(listing,shapeListing)
                            return
                        }
                    }

                    listing = shapeListing

                    // otherwise go forward
                    while (listing.nextSibling !== null){
                        listing = listing.nextSibling
                        if (listing.className === "selectedShapeListing"){
                            this.selectBetween(shapeListing,listing)
                            return
                        }
                    }

                } else {
                    controller.newAggregateModel("selectedShapes",new Set([model]))
                }
            }

            const shapeName = document.createElement("input")
            shapeName.type = "text"
            shapeName.className = "shapeName"
            shapeName.value = model.name

            shapeName.onchange = () => {

                // validation to ensure name is not already used

                for (const shape of controller.allShapes()){
                    if (shape.name === shapeName.value){
                        alert("You cannot give a shape the same name as another shape")
                        shapeName.value = model.name
                        return
                    }
                }

                model.name = shapeName.value
                controller.updateShape(model)
            }

            shapeListing.appendChild(shapeName)

            const deleteButton = document.createElement("img")
            deleteButton.className = "overviewButton"
            deleteButton.src = "assets/trash.svg"
            deleteButton.alt = "Delete shape button"

            deleteButton.onpointerdown = (pointerEvent) => {
                controller.removeShape(model)

                // prevents the shape from then being selected after being removed
                pointerEvent.stopPropagation()
            }

            shapeListing.appendChild(deleteButton)

            this.shapesList.appendChild(shapeListing)

            this.shapeToShapeListing.set(model,shapeListing)
            this.shapeListingToShape.set(shapeListing,model)

            return
        }

        // otherwise, selected shapes must have updated
        this.shapeToShapeListing.get(model).className = "selectedShapeListing"
    }

    updateAggregateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes"){
            for (const [shape,listing] of this.shapeToShapeListing){
                listing.remove()
            }
            for (const shape of model){
                this.addModel("allShapes",shape)
            }

            return
        }

        // otherwise, selected shapes must have updated
        for (const [shape,listing] of this.shapeToShapeListing){
            if (model.has(shape)){
                listing.className = "selectedShapeListing"
            } else {
                listing.className = "shapeListing"
            }
        }

    }

    updateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes") {
            this.shapeToShapeListing.get(model).firstChild.value = model.name
        }
    }

    removeModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes") {
            this.shapeToShapeListing.get(model).remove()
            return
        }

        // otherwise, selected shapes must have updated
        this.shapeToShapeListing.get(model).className = "shapeListing"
    }

    // here for polymorphic reasons
    loseFocus(){
    }
}

window.customElements.define("over-view",overview)
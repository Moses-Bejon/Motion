import {abstractView} from "../view.js";
import {controller} from "../../controller.js";
import {typicalIconSizeInt,typicalIconSize} from "../../constants.js";

const template = document.createElement("template")
template.innerHTML = `
    <style>
        #buttonsContainer{
            position: relative;
            left: ${typicalIconSizeInt*2}px;
            height: ${typicalIconSizeInt}px;
            display: flex;
        }
        #newDirectoryButton,#moveToDirectoryButton{
            height: 100%;
            cursor: pointer;
        }
        #shapesList{
            width: 100%;
            overflow-y: auto;
            height: calc(100% - ${typicalIconSize});
        }
        .shapeListing,.selectedShapeListing,.directoryListing,.selectedDirectoryListing{
            border: 1px solid lightgray;
            height: ${typicalIconSize};
            display: flex;
            justify-content: space-between;
        }
        .selectedShapeListing,.selectedDirectoryListing{
            background-color: darkgray;
        }
        .shapeListing:hover,.directoryListing:hover{
            background-color: lightgray;
        }
        .selectedShapeListing:hover,.selectedDirectoryListing:hover{
            background-color: gray;
        }
        .withinDirectory{
            position: relative;
            left: ${typicalIconSize};
            width: calc(100% - ${typicalIconSize} - 2px);
        }
        .shapeName,.directoryName{
            background-color: transparent;
            border: none;
            color: black;
            flex-grow: 1;
            flex-shrink: 1;
            min-width: 0;
        }
        .directoryIconLabelContainer{
            display: flex;
            flex-grow: 1;
            flex-shrink: 1;
            min-width: 0;
        }
        .overviewButton{
            cursor: pointer;
        }
    </style>
    <div id="buttonsContainer">
        <button id="newDirectoryButton">New directory</button>
        <button id="moveToDirectoryButton">Move to directory</button>
    </div>
    <div id="shapesList"></div>
`

export class overview extends abstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.shapesList = this.shadowRoot.getElementById("shapesList")

        this.shadowRoot.getElementById("newDirectoryButton").onpointerdown = (pointerEvent) => {

            pointerEvent.stopPropagation()
            pointerEvent.preventDefault()

            if (controller.selectedShapes().size === 0){
                alert("Please select the shapes you want to put into this directory before you create it")
                return
            }

            // find an unused directory name
            let directoryNumber = 1

            while (this.directoryExistsWithName(`Directory ${directoryNumber}`)){
                directoryNumber ++
            }

            const directoryName = `Directory ${directoryNumber}`

            for (const shape of controller.selectedShapes()){
                shape.directory = directoryName

                controller.updateShape(shape)
            }
        }

        this.shadowRoot.getElementById("moveToDirectoryButton").onpointerdown = (pointerEvent) => {

            pointerEvent.stopPropagation()
            pointerEvent.preventDefault()

            if (controller.selectedShapes().size === 0){
                alert("Please select the shapes you want to put into this directory")
                return
            }

            for (const shape of controller.selectedShapes()){
                shape.directory = controller.selectedDirectory

                controller.updateShape(shape)
            }
        }

        // deselect all when clicking outside shape list
        this.addFunctionToPerformOnClick(() => {
            controller.newAggregateModel("selectedShapes",new Set())
            controller.deselectSelectedDirectory()
        })

        this.shapeToShapeListing = new Map()
        this.shapeListingToShape = new Map()
        this.directoryToDirectoryListing = new Map()
        this.directoryListingToDirectory = new Map()
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
        controller.subscribeToSelectedDirectory(this)
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeTo(this,"allShapes")
        controller.unsubscribeTo(this,"selectedShapes")
        controller.unsubscribeFromSelectedDirectory(this)
    }

    save(){
        return {"windowType":"overview"}
    }

    load(save){

    }

    errorCheckAggregateModel(aggregateModel){
        if (aggregateModel !== "allShapes" && aggregateModel !== "selectedShapes"){
            console.error("shape editor got updates from",aggregateModel)
        }
    }

    selectBetween(element1,element2){
        while (element1.nextSibling !== element2){
            element1 = element1.nextSibling
            if (element1.classList.contains("shapeListing")){
                controller.selectShape(this.shapeListingToShape.get(element1))
            }
        }
    }

    createShapeListing(model){

        if (this.shapeToShapeListing.has(model)){
            return this.shapeToShapeListing.get(model)
        }

        const shapeListing = document.createElement("div")
        shapeListing.classList.add("shapeListing")

        shapeListing.onpointerdown = (pointerEvent) => {

            // prevents shape from deselecting
            pointerEvent.stopPropagation()
            pointerEvent.preventDefault()

            if (pointerEvent.ctrlKey){

                // if it's selected, deselect it instead
                if (controller.isSelected(model)){
                    controller.deselectShape(model)
                } else {
                    controller.selectShape(model)
                }
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
                    if (listing.classList.contains("selectedShapeListing")){
                        this.selectBetween(listing,shapeListing)
                        return
                    }
                }

                listing = shapeListing

                // otherwise go forward
                while (listing.nextSibling !== null){
                    listing = listing.nextSibling
                    if (listing.classList.contains("selectedShapeListing")){
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
            pointerEvent.preventDefault()
        }

        shapeListing.appendChild(deleteButton)

        this.shapeToShapeListing.set(model,shapeListing)
        this.shapeListingToShape.set(shapeListing,model)

        return shapeListing
    }

    createDirectoryListing(directoryName){
        const directoryListing = document.createElement("div")
        directoryListing.className = "directoryListing"

        directoryListing.onpointerdown = (pointerEvent) => {

            pointerEvent.stopPropagation()
            pointerEvent.preventDefault()

            controller.newSelectedDirectory(directoryName)
        }

        // closed by default
        directoryListing.open = false

        // keeps track of what shapes are in this directory
        directoryListing.innerShapes = new Set()

        const directoryIconLabelContainer = document.createElement("div")
        directoryIconLabelContainer.className = "directoryIconLabelContainer"

        const directoryIcon = document.createElement("img")
        directoryIcon.src = "assets/directoryClosed.svg"
        directoryIcon.className = "overviewButton"

        directoryIcon.onpointerdown = (pointerEvent) => {
            if (directoryListing.open){
                directoryIcon.src = "assets/directoryClosed.svg"
                directoryListing.open = false

                for (const shapeListing of directoryListing.innerShapes){
                    shapeListing.remove()
                }
            } else {
                directoryIcon.src = "assets/directoryOpen.svg"
                directoryListing.open = true

                for (const shapeListing of directoryListing.innerShapes){
                    directoryListing.after(shapeListing)
                }
            }

            pointerEvent.stopPropagation()
            pointerEvent.preventDefault()
        }

        directoryIconLabelContainer.appendChild(directoryIcon)

        const directoryLabel = document.createElement("input")
        directoryLabel.type = "text"
        directoryLabel.className = "directoryName"
        directoryLabel.value = directoryName

        directoryLabel.onchange = () => {

            // validation to ensure name is not already used

            for (const [directory,listing] of this.directoryToDirectoryListing){
                if (directory === directoryLabel.value){
                    alert("You cannot give a directory the same name as another directory")
                    directoryLabel.value = directoryName
                    return
                }
            }

            controller.changeDirectoryName(directoryName,directoryLabel.value)
        }

        directoryIconLabelContainer.appendChild(directoryLabel)

        directoryListing.appendChild(directoryIconLabelContainer)

        const deleteButton = document.createElement("img")
        deleteButton.className = "overviewButton"
        deleteButton.src = "assets/trash.svg"
        deleteButton.alt = "Delete directory button"

        deleteButton.onpointerdown = (pointerEvent) => {
            controller.deleteDirectory(directoryName)

            // prevents the directory from then being selected after being removed
            pointerEvent.stopPropagation()
            pointerEvent.preventDefault()
        }

        directoryListing.appendChild(deleteButton)

        this.directoryToDirectoryListing.set(directoryName,directoryListing)
        this.directoryListingToDirectory.set(directoryListing,directoryName)

        return directoryListing
    }

    directoryExistsWithName(name){
        for (const [directoryName,directoryListing] of this.directoryToDirectoryListing){
            if (directoryName === name){
                return true
            }
        }
        return false
    }

    newSelectedDirectory(directory,previousSelectedDirectory){

        this.deselectSelectedDirectory(previousSelectedDirectory)

        if (directory !== null){
            this.directoryToDirectoryListing.get(directory).className = "selectedDirectoryListing"
        }

    }

    deselectSelectedDirectory(directory){
        if (this.directoryToDirectoryListing.has(directory)) {
            this.directoryToDirectoryListing.get(directory).className = "directoryListing"
        }
    }

    shapeDirectoryChange(model,shapeListing){

        for (const [directoryListing,directory] of this.directoryListingToDirectory){
            if (directoryListing.innerShapes.has(shapeListing)){
                directoryListing.innerShapes.delete(shapeListing)
                shapeListing.classList.remove("withinDirectory")

                if (directoryListing.innerShapes.size === 0){
                    directoryListing.remove()
                    this.directoryListingToDirectory.delete(directoryListing)
                    this.directoryToDirectoryListing.delete(directory)
                }
            }
        }

        shapeListing.remove()

        if (model.directory === null){
            this.shapesList.appendChild(shapeListing)
            return
        }

        if (!this.directoryToDirectoryListing.has(model.directory)){
            const directoryListing = this.createDirectoryListing(model.directory)
            this.shapesList.prepend(directoryListing)
        }

        const directoryListing = this.directoryToDirectoryListing.get(model.directory)

        if (directoryListing.open){
            directoryListing.after(shapeListing)
        }

        shapeListing.classList.add("withinDirectory")
        directoryListing.innerShapes.add(shapeListing)
    }

    addModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes"){

            const shapeListing = this.createShapeListing(model)

            // if the shape doesn't have a directory, just wack it on the end
            if (model.directory === null){
                this.shapesList.appendChild(shapeListing)
            } else {
                // otherwise, create the directory if not created, and wack the shape in there
                this.shapeDirectoryChange(model,shapeListing)
            }

            return
        }

        // otherwise, selected shapes must have updated
        this.shapeToShapeListing.get(model).classList.remove("shapeListing")
        this.shapeToShapeListing.get(model).classList.add("selectedShapeListing")
    }

    updateAggregateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes"){
            for (const [shape,listing] of this.shapeToShapeListing){
                listing.remove()
            }
            for (const [listing,directory] of this.directoryListingToDirectory){
                listing.innerShapes = new Set()
            }
            this.shapeToShapeListing = new Map()
            this.shapeListingToShape = new Map()
            for (const shape of model){
                this.addModel("allShapes",shape)
            }

            return
        }

        // otherwise, selected shapes must have updated
        for (const [shape,listing] of this.shapeToShapeListing){
            if (model.has(shape)){
                this.shapeToShapeListing.get(shape).classList.remove("shapeListing")
                this.shapeToShapeListing.get(shape).classList.add("selectedShapeListing")
            } else {
                this.shapeToShapeListing.get(shape).classList.remove("selectedShapeListing")
                this.shapeToShapeListing.get(shape).classList.add("shapeListing")
            }
        }

    }

    updateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes") {
            this.shapeToShapeListing.get(model).firstChild.value = model.name

            this.shapeDirectoryChange(model,this.shapeToShapeListing.get(model))
        }
    }

    removeModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        if (aggregateModel === "allShapes") {
            for (const [directoryListing,directory] of this.directoryListingToDirectory){
                if (directoryListing.innerShapes.has(this.shapeToShapeListing.get(model))){
                    directoryListing.innerShapes.delete(this.shapeToShapeListing.get(model))

                    if (directoryListing.innerShapes.size === 0){
                        directoryListing.remove()
                        this.directoryListingToDirectory.delete(directoryListing)
                        this.directoryToDirectoryListing.delete(directory)
                    }
                }
            }

            this.shapeToShapeListing.get(model).remove()
            this.shapeListingToShape.delete(this.shapeToShapeListing.get(model))
            this.shapeToShapeListing.delete(model)

            return
        }

        // otherwise, selected shapes must have updated
        this.shapeToShapeListing.get(model)?.classList.remove("selectedShapeListing")
        this.shapeToShapeListing.get(model)?.classList.add("shapeListing")
    }

    // here for polymorphic reasons
    loseFocus(){
    }
}

window.customElements.define("over-view",overview)
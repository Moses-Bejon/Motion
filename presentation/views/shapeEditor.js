import {abstractView} from "../view.js";
import {controller} from "../../controller.js";
import {
    animationEndTimeSeconds,
    fontFamily,
    fontSize,
    fullScreenAndDropdownContainerWidth,
    minimumThickness,
    typicalIconSize,
    typicalIconSizeInt
} from "../../constants.js";
import {clamp, returnInput} from "../../maths.js";
import {validateColour,validateReal} from "../../dataStructureOperations.js";

const stringInput = document.createElement("input")
stringInput.type = "text"

const floatInput = document.createElement("input")
floatInput.type = "number"

const colourInput = document.createElement("input")
colourInput.type = "color"

const fonts = ["Arial","Roboto", "Sofia", "Coming Soon", "Pangolin", "Comic Neue", "Balsamiq Sans",
    "EB Garamond","Old Standard TT", "Playwrite NG Modern", "Modern Antiqua","Doto","Tiny5","Jolly Lodger",
    "Yellowtail","Zilla Slab"]

const fontSelector = document.createElement("select")

for (const font of fonts){
    const fontOption = document.createElement("option")

    fontOption.value = font
    fontOption.innerText = font
    fontOption.style.fontFamily = font

    fontSelector.appendChild(fontOption)
}

const shapePropertyToInput = {
    "Appearance time": floatInput,
    "Disappearance time": floatInput
}

const shapeToShapeProperties = {
    "drawing":{
        "Colour":colourInput,
        "Thickness":floatInput
    },
    "polygon":{
        "Colour":colourInput,
        "Thickness":floatInput,
        "Polygon fill":colourInput
    },
    "ellipse":{
        "Outline colour":colourInput,
        "Width":floatInput,
        "Height":floatInput,
        "Colour":colourInput,
        "Thickness":floatInput
    },
    "graphic":{
        "Width":floatInput,
        "Height":floatInput
    },
    "shapeGroup":{},
    "text":{
        "Text":stringInput,
        "Font colour":colourInput,
        "Font size (pt)":floatInput,
        "Font":fontSelector
    }
}

const nameToChangeFunction = {
    "Appearance time": (shape,value) => {

        // validation
        value = parseFloat(value)
        value = clamp(value,0,shape.disappearanceTime)

        shape.newAppearanceTime(value)
    },
    "Disappearance time": (shape,value) => {

        // validation
        value = parseFloat(value)
        value = clamp(value,shape.appearanceTime,animationEndTimeSeconds)

        shape.newDisappearanceTime(value)
    },
    "Colour": (shape,value) => {
        shape.geometryAttributeUpdate("colour",value)
    },
    "Thickness": (shape,value) => {

        // validation
        value = parseFloat(value)
        value = Math.max(minimumThickness,value)

        shape.geometryAttributeUpdate("thickness",value)
    },
    "Polygon fill": (shape,value) => {
        shape.geometryAttributeUpdate("fillColour",value)
    },
    "Outline colour": (shape,value) => {
        shape.geometryAttributeUpdate("outlineColour",value)
    },
    "Width": (shape,value) => {
        // validation
        value = parseFloat(value)
        value = Math.max(0,value)

        shape.geometryAttributeUpdate("width",value)
    },
    "Height": (shape,value) => {
        // validation
        value = parseFloat(value)
        value = Math.max(0,value)

        shape.geometryAttributeUpdate("height",value)
    },
    "Text": (shape,value) => {
        shape.geometryAttributeUpdate("text",value)
        this.defaultTextReplaced = true
    },
    "Font colour": (shape,value) => {
        shape.geometryAttributeUpdate("fontColour",value)
    },
    "Font size (pt)": (shape,value) => {
        // validation
        value = parseFloat(value)
        value = Math.max(0,value)

        shape.geometryAttributeUpdate("fontSize",value)
    },
    "Font": (shape,value) => {
        shape.geometryAttributeUpdate("fontFamily",value)
    }
}

const nameToGetFunction = {
    "Appearance time": (shape) => {
        return parseFloat(shape.appearanceTime.toPrecision(5))
    },
    "Disappearance time": (shape) => {
        return parseFloat(shape.disappearanceTime.toPrecision(5))
    },
    "Colour": (shape) => {
        return shape.colour
    },
    "Thickness": (shape) => {
        return parseFloat(shape.thickness.toPrecision(5))
    },
    "Polygon fill": (shape) => {
        return shape.fillColour
    },
    "Outline colour": (shape) => {
        return shape.outlineColour
    },
    "Width":(shape) => {
        return parseFloat(shape.width.toPrecision(5))
    },
    "Height":(shape) => {
        return parseFloat(shape.height.toPrecision(5))
    },
    "Text":(shape) => {
        return shape.text
    },
    "Font colour":(shape) => {
        return shape.fontColour
    },
    "Font size (pt)":(shape) => {
        return parseFloat(shape.fontSize.toPrecision(5))
    },
    "Font":(shape) => {
        return shape.fontFamily
    }
}

const nameToValidation =   {
    "Appearance time": validateReal,
    "Disappearance time": validateReal,
    "Colour":validateColour,
    "Thickness":validateReal,
    "Polygon fill":validateColour,
    "Outline colour":validateColour,
    "Width":validateReal,
    "Height":validateReal,

    // all values from html inputs are guaranteed to be strings
    // validation for stuff like possible code insertion is done in text.js
    // (not for security, but for client convenience and to prevent unexpected behaviour, as is client side anyway)
    "Text":()=>{return true},

    "Font colour":validateColour,
    "Font size (pt)":validateReal,
    "Font":()=>{return true}
}

const template = document.createElement("template")
template.innerHTML = `
    <style>
        #shapeName{
            height: ${typicalIconSize};
            background-color: darkgray;
            position: relative;
            left: ${fullScreenAndDropdownContainerWidth};
            width: calc(100% - ${fullScreenAndDropdownContainerWidth});
            margin: 0;
            font-size: ${typicalIconSizeInt-3}px;
            font-family: ${fontFamily};
            text-align: center;
            
            overflow: hidden;
            text-overflow: ellipsis;
        }
        #editableProperties{
            display: flex;
            flex-direction: column;
            width: 100%;
            height: calc(100% - ${typicalIconSize});
        }
        .labelInputContainer{
            display: flex;
            justify-content: space-between;
            width: 100%;
            border: 1px solid lightgray;
            font-family: ${fontFamily};
            font-size: ${fontSize};
        }
        .labelInputContainer:hover{
            background-color: lightgray;
        }
        .input{
            min-width: 50px;
            width: 20%;
        }
    </style>
    <h1 id="shapeName"></h1>
    <div id="editableProperties"></div>
`

export class shapeEditor extends abstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.shapeName = this.shadowRoot.getElementById("shapeName")
        this.propertiesList = this.shadowRoot.getElementById("editableProperties")

        // being ordered (alphabetically by name) means that the order in which shape properties appear is consistent
        this.selectedShapesOrdered = []
        this.propertyInputs = []
        this.propertyNames = new Set()
    }

    static shapeToInputInformation(shape){
        return {...shapePropertyToInput,...shapeToShapeProperties[shape.constructor.name]}
    }

    connectedCallback() {
        super.connectedCallback()

        // can only modify the following once connected
        this.style.backgroundColor = "white"

        // when am disconnected, need to unsubscribe so not taking up space in controller
        // however, am sometimes disconnected due to windows moving around
        // therefore, I subscribe every time I connect and unsubscribe every time I disconnect
        controller.subscribeTo(this,"selectedShapes")
        controller.subscribeTo(this,"timelineEvents")
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeTo(this,"selectedShapes")
        controller.unsubscribeTo(this,"timelineEvents")
    }

    errorCheckAggregateModel(aggregateModel){
        if (aggregateModel !== "selectedShapes" && aggregateModel !== "timelineEvents"){
            console.error("shape editor got updates from",aggregateModel)
        }
    }

    populateShapeInputs(){

        for (const propertyInput of this.propertyInputs){
            propertyInput.remove()
        }
        this.propertyInputs = []
        this.propertyNames = new Set()

        if (this.selectedShapesOrdered.length === 0){
            this.shapeName.innerText = "No shapes selected"
            return
        }

        this.shapeName.innerText = this.selectedShapesOrdered[0].name
        this.populateShapeProperties(this.selectedShapesOrdered[0])

        for (let i = 1; i<this.selectedShapesOrdered.length; i++){
            const shape = this.selectedShapesOrdered[i]

            this.shapeName.innerText += ", " + shape.name

            this.populateShapeProperties(shape)
        }
    }

    populateShapeProperties(shape){
        const inputInformation = shapeEditor.shapeToInputInformation(shape)

        for (const [name,element] of Object.entries(inputInformation)) {

            if (this.propertyNames.has(name)){
                continue
            }

            const labelledElement = document.createElement("div")
            labelledElement.className = "labelInputContainer"

            const label = document.createElement("label")
            label.innerText = name
            label.for = name
            labelledElement.appendChild(label)

            const input = element.cloneNode(true)
            input.className = "input"
            input.name = name
            input.value = nameToGetFunction[name](shape)

            input.onchange = () => {
                this.updateProperty(name,input.value)
            }

            labelledElement.appendChild(input)

            this.propertiesList.appendChild(labelledElement)

            this.propertyInputs.push(labelledElement)
            this.propertyNames.add(name)
        }
    }

    updateProperty(propertyName,newValue){

        // validated to false
        if (!nameToValidation[propertyName](newValue)){
            // don't touch the controller and just rebuild everything from scratch
            this.updateAggregateModel("selectedShapes",controller.selectedShapes())
            return
        }

        const shapesAffected = []

        for (const shape of this.selectedShapesOrdered) {

            const inputInformation = shapeEditor.shapeToInputInformation(shape)

            // only change shapes with the property we aim to change
            if (propertyName in inputInformation){
                shapesAffected.push(shape)
            }
        }

        const previousValues = shapesAffected.map((shape) => {return nameToGetFunction[propertyName](shape)})

        const changeFunction = nameToChangeFunction[propertyName]

        controller.newAction(
            () => {
                for (const shape of shapesAffected){
                    changeFunction(shape,newValue)
                }
            },
            () => {
                for (let i = 0; i<shapesAffected.length;i++){
                    changeFunction(shapesAffected[i],previousValues[i])
                }
            },
            []
        )
    }

    sortShapeNames(){
        this.selectedShapesOrdered.sort((shape1,shape2) => {return shape1.name.localeCompare(shape2.name)})
    }

    addModel(aggregateModel,model){

        // appearance and disappearance events are added before shape added
        // therefore no timeline event will ever be added that I care about from timelineEvents
        if (aggregateModel === "timelineEvents"){
            return
        }

        this.errorCheckAggregateModel(aggregateModel)
        this.selectedShapesOrdered.push(model)
        this.sortShapeNames()
        this.populateShapeInputs()
    }

    updateAggregateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

        // we only need to update the list of shapes if there are new selected shapes
        if (aggregateModel === "selectedShapes") {
            this.selectedShapesOrdered = []
            for (const newModel of model) {
                this.selectedShapesOrdered.push(newModel)
            }
            this.sortShapeNames()
        }

        this.populateShapeInputs()
    }

    updateModel(aggregateModel,model){
        // in this case, updating the whole list should be the same as updating one item in the list
        this.updateAggregateModel(aggregateModel,controller.selectedShapes())
    }

    removeModel(aggregateModel,model){

        // appearance and disappearance events are removed when shape removed
        // therefore no timeline event will ever be removed that I care about from timelineEvents
        if (aggregateModel === "timelineEvents"){
            return
        }

        this.updateAggregateModel(aggregateModel,controller.selectedShapes())
    }

    // here for polymorphic reasons
    loseFocus(){
    }
}

window.customElements.define("shape-editor",shapeEditor)
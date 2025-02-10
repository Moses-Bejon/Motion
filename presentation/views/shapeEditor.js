import {abstractView} from "../view.js";
import {controller} from "../../controller.js";

const template = document.createElement("template")
template.innerHTML = `
    <style>
    </style>
`

export class shapeEditor extends abstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))
    }

    connectedCallback() {
        super.connectedCallback()

        // can only modify the following once connected
        this.style.backgroundColor = "white"

        // when am disconnected, need to unsubscribe so not taking up space in controller
        // however, am sometimes disconnected due to windows moving around
        // therefore, I subscribe every time I connect and unsubscribe every time I disconnect
        controller.subscribeTo(this,"selectedShapes")
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeTo(this,"selectedShapes")
    }

    errorCheckAggregateModel(aggregateModel){
        if (aggregateModel !== "selectedShapes"){
            console.error("shape editor got updates from",aggregateModel)
        }
    }

    addModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)

    }

    updateAggregateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)
    }

    updateModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)
    }

    removeModel(aggregateModel,model){
        this.errorCheckAggregateModel(aggregateModel)
    }

    // here for polymorphic reasons
    loseFocus(){
    }
}

window.customElements.define("shape-editor",shapeEditor)
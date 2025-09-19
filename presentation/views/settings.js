import {AbstractView} from "../view.js";
import {
    fontSize,
    fontFamily,
    typicalIconSize
} from "../../globalValues.js";
import {stringToNatural, stringToPositiveReal, stringToReal} from "../../dataStructureOperations.js";
import {controller} from "../../controller.js";
import {clamp} from "../../maths.js";

const template = document.createElement("template")
template.innerHTML = `
<style>
#settingsList{
        position: relative;
        top:${typicalIconSize};

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
    input{
        min-width: 50px;
        width: 20%;
    }
</style>
<div id="settingsList">
    <div class="labelInputContainer">
        <label for="animationEndTime">Animation end time (s)</label>
        <input type="number" id="animationEndTime">
    </div>
    <div class="labelInputContainer">
        <label for="onionSkinsOn">Onion skins</label>
        <input type="checkbox" id="onionSkinsOn">
    </div>
    <div class="labelInputContainer" id="onionSkinsTimeGapContainer">
        <label for="onionSkinsTimeGap">Time between now and onion skin</label>
        <input type="number" id="onionSkinsTimeGap">
    </div>
    <div class="labelInputContainer">
        <label for="autoAddToTimeline">Automatically add actions to timeline</label>
        <input type="checkbox" id="autoAddToTimeline">
    </div>
    <div class="labelInputContainer">
        <label for="canvasWidth">Resolution width (pixels)</label>
        <input type="number" id="canvasWidth">
    </div>
    <div class="labelInputContainer">
        <label for="canvasHeight">Resolution height (pixels)</label>
        <input type="number" id="canvasHeight">
    </div>
    <div class="labelInputContainer">
        <label for="lineSimplificationEpsilon">Line simplifying (0 - don't simplify)</label>
        <input type="number" id="lineSimplificationEpsilon">
    </div>
    <div class="labelInputContainer">
        <label for="timelineFPS">Timeline framerate (timeline snaps according to this) (fps)</label>
        <input type="number" id="timelineFPS">
    </div>
    <div class="labelInputContainer">
        <label for="defaultTweenLength">Length of created tween (s)</label>
        <input type="number" id="defaultTweenLength">
    </div>
</div>
`

export class Settings extends AbstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.animationEndTimeInput = this.shadowRoot.getElementById("animationEndTime")
        this.canvasWidthInput = this.shadowRoot.getElementById("canvasWidth")
        this.canvasHeightInput = this.shadowRoot.getElementById("canvasHeight")
        this.onionSkinsOnInput = this.shadowRoot.getElementById("onionSkinsOn")
        this.onionSkinsTimeGap = this.shadowRoot.getElementById("onionSkinsTimeGapContainer")
        this.onionSkinsTimeGapInput = this.shadowRoot.getElementById("onionSkinsTimeGap")
        this.autoAddToTimelineInput = this.shadowRoot.getElementById("autoAddToTimeline")
        this.lineSimplififcationEpsilonInput = this.shadowRoot.getElementById("lineSimplificationEpsilon")
        this.timelineFPSInput = this.shadowRoot.getElementById("timelineFPS")
        this.defaultTweenLengthInput = this.shadowRoot.getElementById("defaultTweenLength")
        this.setupInputs()
    }

    setupInputs(){
        this.animationEndTimeInput.value = controller.animationEndTime()
        this.animationEndTimeInput.onchange = () => {

            // validation

            let value = stringToReal(this.animationEndTimeInput.value)

            if (value === null){
                alert(this.animationEndTimeInput.value + " is not a number")
                this.animationEndTimeInput.value = controller.animationEndTime()
                return
            }

            controller.setAnimationEndTime(parseFloat(this.animationEndTimeInput.value))
        }

        this.canvasWidthInput.value = controller.canvasWidth()
        this.canvasWidthInput.onchange = () => {

            // validation

            let value = stringToNatural(this.canvasWidthInput.value)

            if (value === null){
                alert("Please enter a valid width in pixels")
                this.canvasWidthInput.value = controller.canvasWidth()
                return
            }

            // codec supports maximum resolution of 900
            value = clamp(value,16,900)

            // codec only supports frames with even dimensions
            value = Math.trunc(value/2)*2

            controller.setCanvasWidth(value)
        }

        this.canvasHeightInput.value = controller.canvasHeight()
        this.canvasHeightInput.onchange = () => {

            // validation

            let value = stringToNatural(this.canvasHeightInput.value)

            if (value === null){
                alert("Please enter a valid width in pixels")
                this.canvasHeightInput.value = controller.canvasHeight()
                return
            }

            // codec supports maximum resolution of 900
            value = clamp(value,16,900)

            // codec only supports frames with even dimensions
            value = Math.trunc(value/2)*2

            controller.setCanvasHeight(value)
        }

        this.onionSkinsOnInput.checked = controller.onionSkinsOn()
        if (!controller.onionSkinsOn()){
            this.onionSkinsTimeGap.style.display = "none"
        }
        this.onionSkinsOnInput.onchange = () => {
            const value = this.onionSkinsOnInput.checked

            if (value === null){
                alert("Please enter either true or false")
                this.onionSkinsOnInput.checked = controller.onionSkinsOn()
                return
            }

            controller.setOnionSkinsOn(value)
        }

        this.onionSkinsTimeGapInput.value = controller.onionSkinTimeGap()
        this.onionSkinsTimeGapInput.onchange = () => {
            const value = stringToPositiveReal(this.onionSkinsTimeGapInput.value)

            if (value === null){
                alert("Please enter a positive number for time")
                this.onionSkinsTimeGapInput.value = controller.onionSkinTimeGap()
                return
            }

            controller.setOnionSkinTimeGap(value)
        }

        this.autoAddToTimelineInput.checked = controller.autoAddToTimeline()
        this.autoAddToTimelineInput.onchange = () => {
            const value = this.autoAddToTimelineInput.checked

            if (value === null){
                    alert("Please enter either true or false")
                    this.autoAddToTimelineInput.checked = controller.autoAddToTimeline()
                return
            }

            controller.setAutoAddToTimeline(value)
        }

        this.lineSimplififcationEpsilonInput.value = controller.lineSimplificationEpsilon()
        this.lineSimplififcationEpsilonInput.onchange = () => {

            // validation

            let value = stringToReal(this.lineSimplififcationEpsilonInput.value)

            if (value === null){
                alert("Please enter a valid number")
                this.lineSimplififcationEpsilonInput.value = controller.lineSimplificationEpsilon()
                return
            }

            value = Math.max(0,value)

            controller.setLineSimplificationEpsilon(value)
        }

        this.timelineFPSInput.value = 1/controller.timelineSnapLength()
        this.timelineFPSInput.onchange = () => {
            // validation

            const value = stringToPositiveReal(this.timelineFPSInput.value)

            if (value === null){
                alert("Please enter a valid fps")
                this.timelineFPSInput.value = 1/controller.timelineSnapLength()
                return
            }

            controller.setTimelineSnapLength(1/this.timelineFPSInput.value)
        }

        this.defaultTweenLengthInput.value = controller.defaultTweenLength()
        this.defaultTweenLengthInput.onchange = () => {
            // validation

            const value = Math.max(stringToReal(this.defaultTweenLengthInput.value),0)

            if (value === null){
                alert("Please enter a valid time in seconds")
                this.defaultTweenLengthInput.value = controller.defaultTweenLength()
                return
            }

            controller.setDefaultTweenLength(value)
        }
    }

    connectedCallback() {
        super.connectedCallback()

        // can only modify the following once connected
        this.style.backgroundColor = "white"
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
    }

    save(){
        return {"windowType":"settings"}
    }

    load(save){

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

window.customElements.define("settings-window",Settings)
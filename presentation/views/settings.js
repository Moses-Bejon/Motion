import {AbstractView} from "../view.js";
import {
    fontSize,
    fontFamily,
    typicalIconSize,
    animationEndTimeSeconds,
    changeAnimationEndTimeSeconds,
    canvasWidth,
    changeCanvasWidth,
    canvasHeight,
    changeCanvasHeight,
    defaultTweenLength,
    changeDefaultTweenLength,
    timelineSnapLength,
    changeTimelineSnapLength,
    lineSimplificationEpsilon,
    changeLineSimplificationEpsilon,
    onionSkinTimeGap,
    changeOnionSkinsOn,
    onionSkinsOn,
    changeOnionSkinTimeGap,
    autoAddToTimeline,
    changeAutoAddToTimeline
} from "../../globalValues.js";
import {stringToNatural, stringToPositiveReal, stringToReal} from "../../dataStructureOperations.js";
import {controller} from "../../controller.js";
import {refreshViews} from "../../index.js";
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
        this.animationEndTimeInput.value = animationEndTimeSeconds
        this.animationEndTimeInput.onchange = () => {

            // validation

            let value = stringToReal(this.animationEndTimeInput.value)

            if (value === null){
                alert(this.animationEndTimeInput.value + " is not a number")
                this.animationEndTimeInput.value = animationEndTimeSeconds
                return
            }

            const lastThingToHappen = controller.timelineEvents()[controller.timelineEvents().length-1]

            if (lastThingToHappen !== undefined && lastThingToHappen.time > value){
                alert("Could not set new end time because the last think to happen, likely a shape disappearance, occurred after the new end time")
                this.animationEndTimeInput.value = animationEndTimeSeconds
                return
            }
            if (controller.clock() > value){
                alert("Could not set new end time because the current time is after the new end time")
                this.animationEndTimeInput.value = animationEndTimeSeconds
                return
            }

            changeAnimationEndTimeSeconds(parseFloat(this.animationEndTimeInput.value))
            refreshViews()
        }

        this.canvasWidthInput.value = canvasWidth
        this.canvasWidthInput.onchange = () => {

            // validation

            let value = stringToNatural(this.canvasWidthInput.value)

            if (value === null){
                alert("Please enter a valid width in pixels")
                this.canvasWidthInput.value = canvasWidth
                return
            }

            // codec supports maximum resolution of 900
            value = clamp(value,16,900)

            // codec only supports frames with even dimensions
            value = Math.trunc(value/2)*2

            changeCanvasWidth(value)
            refreshViews()
        }

        this.canvasHeightInput.value = canvasHeight
        this.canvasHeightInput.onchange = () => {

            // validation

            let value = stringToNatural(this.canvasHeightInput.value)

            if (value === null){
                alert("Please enter a valid width in pixels")
                this.canvasHeightInput.value = canvasHeight
                return
            }

            // codec supports maximum resolution of 900
            value = clamp(value,16,900)

            // codec only supports frames with even dimensions
            value = Math.trunc(value/2)*2

            changeCanvasHeight(value)
            refreshViews()
        }

        this.onionSkinsOnInput.checked = onionSkinsOn
        if (!onionSkinsOn){
            this.onionSkinsTimeGap.style.display = "none"
        }
        this.onionSkinsOnInput.onchange = () => {
            const value = this.onionSkinsOnInput.checked

            if (value === null){
                alert("Please enter either true or false")
                this.onionSkinsOnInput.checked = onionSkinsOn
                return
            }

            changeOnionSkinsOn(value)
            if (onionSkinsOn){
                this.onionSkinsTimeGap.style.display = "flex"
                controller.onionSkinsOn()
            } else {
                this.onionSkinsTimeGap.style.display = "none"
                controller.onionSkinsOff()
            }
        }

        this.onionSkinsTimeGapInput.value = onionSkinTimeGap
        this.onionSkinsTimeGapInput.onchange = () => {
            const value = stringToPositiveReal(this.onionSkinsTimeGapInput.value)

            if (value === null){
                alert("Please enter a positive number for time")
                this.onionSkinsTimeGapInput.value = onionSkinTimeGap
                return
            }

            changeOnionSkinTimeGap(value)
            controller.updateOnionSkins()

            this.onionSkinsTimeGapInput.value = value
        }

        this.autoAddToTimelineInput.checked = autoAddToTimeline
        this.autoAddToTimelineInput.onchange = () => {
            const value = this.autoAddToTimelineInput.checked

            if (value === null){
                    alert("Please enter either true or false")
                    this.autoAddToTimelineInput.checked = autoAddToTimeline
                return
            }

            changeAutoAddToTimeline(this.autoAddToTimelineInput.checked)
        }

        this.lineSimplififcationEpsilonInput.value = lineSimplificationEpsilon
        this.lineSimplififcationEpsilonInput.onchange = () => {

            // validation

            let value = stringToReal(this.lineSimplififcationEpsilonInput.value)

            if (value === null){
                alert("Please enter a valid number")
                this.lineSimplififcationEpsilonInput.value = lineSimplificationEpsilon
                return
            }

            value = Math.max(0,value)

            changeLineSimplificationEpsilon(value)
            this.lineSimplififcationEpsilonInput.value = lineSimplificationEpsilon
        }

        this.timelineFPSInput.value = 1/timelineSnapLength
        this.timelineFPSInput.onchange = () => {
            // validation

            const value = stringToPositiveReal(this.timelineFPSInput.value)

            if (value === null){
                alert("Please enter a valid fps")
                this.timelineFPSInput.value = 1/timelineSnapLength
                return
            }

            changeTimelineSnapLength(1/this.timelineFPSInput.value)
            this.timelineFPSInput.value = 1/timelineSnapLength
        }

        this.defaultTweenLengthInput.value = defaultTweenLength
        this.defaultTweenLengthInput.onchange = () => {
            // validation

            const value = Math.max(stringToReal(this.defaultTweenLengthInput.value),0)

            if (value === null){
                alert("Please enter a valid time in seconds")
                this.defaultTweenLengthInput.value = defaultTweenLength
                return
            }

            changeDefaultTweenLength(value)
            this.defaultTweenLengthInput.value = defaultTweenLength
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
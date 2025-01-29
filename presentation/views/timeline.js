import {abstractView} from "../view.js"
import {shapeTimeline} from "./timelineModes/shapeTimeline.js";
import {controller} from "../../controller.js";
import {
    animationEndTimeSeconds,
    fontFamily,
    timelineLeftMenuSizePercentage,
    timelineRightMenuSizePercentage,
    timelineMargin,
    timelineBorderSize,
    timelineBumperSize,
    timelineLeftMenuSize,
    timelineRightMenuSize
} from "../../constants.js";

const template = document.createElement("template")
template.innerHTML = `

    <style>
        #timeline{
            display: flex;
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, darkgray ${timelineLeftMenuSizePercentage}%, lightgray ${timelineLeftMenuSizePercentage}%);
            
            overflow-y: auto;
        }
        #timelineList{
            position: relative;
            top: 30px;
            width: 100%;
            height: calc(100% - 30px);
            
            display: flex;
            flex-direction: column;
        }
        #playButton{
            position: absolute;
            top: 0;
            right: ${timelineRightMenuSizePercentage}%;
            width: 30px;
            height: 30px;
            user-select: none;
        }
        .timeline{
            display: flex;
        }
        .dropdown{
            width: 25px;
            height: 25px;
            margin: ${timelineMargin}px;
            user-select: none;
        }
        .timelineEvents{
            border-top: black solid ${timelineBorderSize}px;
            border-bottom: black solid ${timelineBorderSize}px;
            background-color: white;
            margin-top: ${timelineMargin}px;
            margin-bottom: ${timelineMargin}px;
        }
        .bumper{
            border-radius: 50%;
            
            width: ${timelineBumperSize}px;
            height: ${timelineBumperSize}px;
            background-color: black;
            position: absolute;
        }
        .labelDropdownContainer{
            width: ${timelineLeftMenuSizePercentage}%;
            overflow: hidden;
            
            display: flex;
        }
        h2{
            font-family: ${fontFamily};
            margin-top: ${timelineMargin}px;
            margin-bottom: ${timelineMargin}px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
            user-select: none;
        }
    </style>
    
    <div id="timeline">
        <div id="timelineList"></div>
        <img id="playButton" src="assets/play.svg" alt="play animation button">
    </div>
`

export class timeline extends abstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.timelineList = this.shadowRoot.getElementById("timelineList")
        this.lastEventEndsAt = animationEndTimeSeconds
        this.shapeToTimeline = new Map()
    }

    connectedCallback() {
        super.connectedCallback()

        // can only modify the following once connected
        this.style.backgroundColor = "white"

        // when am disconnected, need to unsubscribe so not taking up space in controller
        // however, am sometimes disconnected due to windows moving around
        // therefore, I subscribe every time I connect and unsubscribe every time I disconnect
        controller.subscribeToInputs(this)
        controller.subscribeTo(this,"selectedShapes")
        controller.subscribeTo(this,"timelineEvents")
        controller.subscribeTo(this,"clock")
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeFromInputs(this)
        controller.unsubscribeTo(this,"selectedShapes")
        controller.unsubscribeTo(this,"timelineEvents")
        controller.unsubscribeTo(this,"clock")
    }

    newShape(shape){
        const shapeSection = document.createElement("div")
        shapeSection.className = "timeline"

        const labelDropdownContainer = document.createElement("div")
        labelDropdownContainer.className = "labelDropdownContainer"

        const dropDown = document.createElement("img")
        dropDown.src = "assets/dropdown.svg"
        dropDown.className = "dropdown"
        labelDropdownContainer.appendChild(dropDown)

        const label = document.createElement("h2")
        label.innerText = shape.name
        labelDropdownContainer.appendChild(label)

        shapeSection.appendChild(labelDropdownContainer)

        const timeLine = new shapeTimeline(this,shape,label)

        shapeSection.appendChild(timeLine.timeline)

        this.timelineList.appendChild(shapeSection)
        this.shapeToTimeline.set(shape,timeLine)
    }

    timeToTimelinePosition(timeSeconds){
        if (timeSeconds > this.lastEventEndsAt){
            console.error("Not implemented")
        } else {
            return timeSeconds/this.lastEventEndsAt
        }
    }

    timeLinePositionToTime(position){
        return position*this.lastEventEndsAt
    }

    globalWidthToTimelineWidth(width){
        const boundingRect = this.getBoundingClientRect()

        // this is to account for the fact that the first 15% is dedicated to the left menu
        return width/(boundingRect.width*timelineRightMenuSize)
    }

    pointerPositionToTimelinePosition(pointerEvent){

        const boundingRect = this.getBoundingClientRect()

        // this is to account for the fact that the first 15% is dedicated to the left menu
        return ((pointerEvent.clientX-boundingRect.x)/boundingRect.width-timelineLeftMenuSize)/timelineRightMenuSizePercentage
    }

    newSelectedShapes(newSelectedShapes){

        this.timelineList.replaceChildren()

        for (const shape of newSelectedShapes){
            this.newShape(shape)
        }
    }

    addModel(aggregateModel,model){

        switch (aggregateModel){
            case "selectedShapes":
                this.newShape(model)
                break
            case "timelineEvents":
                break
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    updateAggregateModel(aggregateModel,model){

        switch (aggregateModel){
            case "selectedShapes":
                this.newSelectedShapes(model)
                break
            case "timelineEvents":
                break
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    updateModel(aggregateModel,model){
        switch (aggregateModel){
            case "selectedShapes":
                // selects the part of the html that displays the model name
                this.shapeToTimeline.get(model).label.innerText = model.name
                break
            case "timelineEvents":
                this.shapeToTimeline.get(model.shape).updatePosition()
                break
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    removeModel(aggregateModel,model){
        switch (aggregateModel){
            case "selectedShapes":
                this.shapeToTimeline.get(model).timeline.remove()
                this.shapeToTimeline.delete(model)
                break
            case "timelineEvents":
                break
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    acceptKeyDown(keyboardEvent){

        console.log("key down")
        console.log(keyboardEvent)

        return false
    }

    acceptKeyUp(keyboardEvent){

        console.log("key up")
        console.log(keyboardEvent)

        return false
    }

    // clean up animations when we lose focus
    loseFocus(){
        console.log("lost focus")
    }


}

window.customElements.define("time-line",timeline)
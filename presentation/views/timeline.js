import {abstractView} from "../view.js"
import {controller} from "../../controller.js";
import {animationEndTimeSeconds, fontFamily} from "../../constants.js";

const margin = 5
const borderSize = 2
const bumperSize = 9

const bumperTranslation = -borderSize/2-bumperSize/2

const template = document.createElement("template")
template.innerHTML = `

    <style>
        #timeline{
            display: flex;
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, darkgray 15%, white 15%);
        }
        #timelineList{
            position: relative;
            top: 30px;
            width: 100%;
            height: calc(100% - 30px);
            
            display: flex;
            flex-direction: column;
            
            overflow-y: auto;
        }
        #playButton{
            position: absolute;
            top: 0;
            right: 85%;
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
            margin: 5px;
            user-select: none;
        }
        .timelineEvents{
            border-top: black solid ${borderSize}px;
            border-bottom: black solid ${borderSize}px;
            margin-top: ${margin}px;
            margin-bottom: ${margin}px;
        }
        .bumper{
            border-radius: 50%;
            
            width: ${bumperSize}px;
            height: ${bumperSize}px;
            background-color: black;
            position: absolute;
        }
        .labelDropdownContainer{
            width: 15%;
            overflow: hidden;
            
            display: flex;
        }
        h2{
            font-family: ${fontFamily};
            margin-top: ${margin}px;
            margin-bottom: ${margin}px;
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
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeFromInputs(this)
        controller.unsubscribeTo(this,"selectedShapes")
        controller.unsubscribeTo(this,"timelineEvents")
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

        console.log("added model")
        console.log(aggregateModel,model)
    }

    newShape(shape){
        const shapeTimeline = document.createElement("div")
        shapeTimeline.className = "timeline"

        const labelDropdownContainer = document.createElement("div")
        labelDropdownContainer.className = "labelDropdownContainer"

        const dropDown = document.createElement("img")
        dropDown.src = "assets/dropdown.svg"
        dropDown.className = "dropdown"
        labelDropdownContainer.appendChild(dropDown)

        const label = document.createElement("h2")
        label.innerText = shape.name
        labelDropdownContainer.appendChild(label)

        shapeTimeline.appendChild(labelDropdownContainer)

        const timeLine = this.createTimeline(shape.appearanceTime,shape.disappearanceTime)
        shapeTimeline.appendChild(timeLine)

        this.timelineList.appendChild(shapeTimeline)
        this.shapeToTimeline[shape] = shapeTimeline
    }

    createTimeline(startTime,endTime){
        const timeline = document.createElement("div")
        timeline.style.position = "relative"

        const startProportion = this.timeToTimelinePosition(startTime)
        const startPosition = 100*startProportion + "%"
        const width = 100*(this.timeToTimelinePosition(endTime)-startProportion)-15 + "%"

        timeline.style.left = startPosition
        timeline.style.width = width
        timeline.className = "timelineEvents"

        const topLeftBumper = document.createElement("div")
        topLeftBumper.className = "bumper"
        topLeftBumper.style.left = "0"
        topLeftBumper.style.top = bumperTranslation + "px"
        timeline.appendChild(topLeftBumper)

        const topRightBumper = document.createElement("div")
        topRightBumper.className = "bumper"
        topRightBumper.style.right = "0"
        topRightBumper.style.top = bumperTranslation + "px"
        timeline.appendChild(topRightBumper)

        const bottomRightBumper = document.createElement("div")
        bottomRightBumper.className = "bumper"
        bottomRightBumper.style.right = "0"
        bottomRightBumper.style.bottom = bumperTranslation + "px"
        timeline.appendChild(bottomRightBumper)

        const bottomLeftBumper = document.createElement("div")
        bottomLeftBumper.className = "bumper"
        bottomLeftBumper.style.left = "0"
        bottomLeftBumper.style.bottom = bumperTranslation + "px"
        timeline.appendChild(bottomLeftBumper)

        return timeline
    }

    timeToTimelinePosition(timeSeconds){
        if (timeSeconds > this.lastEventEndsAt){
            console.error("Not implemented")
        } else {
            return timeSeconds/this.lastEventEndsAt
        }
    }

    newSelectedShapes(newSelectedShapes){

        this.timelineList.replaceChildren()

        for (const shape of newSelectedShapes){
            this.newShape(shape)
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
                this.shapeToTimeline[model].firstChild.innerText = model.name
                break
            case "timelineEvents":
                break
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    removeModel(aggregateModel,model){
        switch (aggregateModel){
            case "selectedShapes":
                this.shapeToTimeline[model].remove()
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
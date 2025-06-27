import {AbstractView} from "../view.js"
import {shapeTimeline} from "./timelineModes/shapeTimeline.js";
import {timeCursor} from "./timelineModes/timeCursor.js";
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
    timelineRightMenuSize,
    typicalIconSize,
    typicalIconSizeInt,
    eventTokenWidth, timelineSnapLength
} from "../../globalValues.js";
import {clamp} from "../../maths.js";

const template = document.createElement("template")
template.innerHTML = `

    <style>
        #timeline{
            display: flex;
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, darkgray ${timelineLeftMenuSizePercentage}%, lightgray ${timelineLeftMenuSizePercentage}%);
            
            overflow-y: auto;
            
            /* remove scroll bar on firefox */
            scrollbar-width: none;
        }
        #timeline::-webkit-scrollbar {
        
            /* remove scroll bar on not firefox */
            display: none
        }
        #timelineList{
            position: relative;
            top: ${typicalIconSize};
            width: 100%;
            height: calc(100% - ${typicalIconSize});
            
            display: flex;
            flex-direction: column;
        }
        #playButton{
            position: absolute;
            top: 0;
            right: ${timelineRightMenuSizePercentage}%;
            width: ${typicalIconSize};
            height: ${typicalIconSize};
            user-select: none;
            cursor: pointer;
        }
        #timeCursor{
            height: 100%;
            position: absolute;
            
            /*ensures elements underneath it are still selectable*/
            pointer-events: none;
            
            z-index: 1;
        }
        #timeCursorHead{
            height: ${typicalIconSizeInt/2}px;
            width: ${typicalIconSizeInt/2}px;
            border-radius: 50%;
            background-color: black;
            position: absolute;
            top: ${typicalIconSize};
            left: 1px;
            transform: translate(-50%, -50%);
        }
        #currentTimeInput{
            --text-outline-size: 0.5px;
            --outline-color: white;
        
            width: ${typicalIconSize};
            height: ${typicalIconSizeInt/2}px;
            transform: translate(-50%, 0);
            
            background-color: transparent;
            border: none;
            color: black;

            pointer-events: auto;
            
            /* text outline in white */
            text-shadow: 
                calc(-1 * var(--text-outline-size)) calc(-1 * var(--text-outline-size)) 0 var(--outline-color),  
                var(--text-outline-size) calc(-1 * var(--text-outline-size)) 0 var(--outline-color),  
                calc(-1 * var(--text-outline-size)) var(--text-outline-size) 0 var(--outline-color),  
                var(--text-outline-size) var(--text-outline-size) 0 var(--outline-color);
        }
        #timeCursorButtons{
            position: relative;
            top: -${typicalIconSizeInt/2}px;
            white-space: nowrap;
            
            pointer-events: auto;
        }
        #timeCursorStem{
            height: calc(100% - ${typicalIconSize});
            position: absolute;
            top: ${typicalIconSize};
            width: 2px;
            background-color: black;
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
            height: calc(100% - ${2*timelineMargin}px);
        }
        .eventToken{
            height: calc(100% - ${timelineMargin}px - ${timelineBorderSize/2}px);
            width: ${eventTokenWidth};
            position: absolute;
            top: ${timelineMargin}px;
            z-index: 1;
        }
        .tweenConnector{
            height: ${eventTokenWidth};
            
            position: absolute;
            top: calc(50% - ${timelineBorderSize/2}px);
                        
            z-index: 1;
        }
        .bumper{
            border-radius: 50%;
            
            width: ${timelineBumperSize}px;
            height: ${timelineBumperSize}px;
            background-color: black;
            position: absolute;
        }
        .labelContainer{
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

export class Timeline extends AbstractView{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.timelineList = this.shadowRoot.getElementById("timelineList")
        this.shapeToTimeline = new Map()

        this.cursor = new timeCursor(this)
        this.timelineDiv = this.shadowRoot.getElementById("timeline")
        this.timelineDiv.appendChild(this.cursor.cursor)

        this.timelineDiv.onpointerdown = (pointerEvent) => {
            controller.newClockTime(this.pointerPositionToTimelinePosition(pointerEvent)*animationEndTimeSeconds)
            this.snapTimeToCell()
        }

        this.playButton = this.shadowRoot.getElementById("playButton")
    }

    connectedCallback() {
        super.connectedCallback()

        // can only modify the following once connected
        this.style.backgroundColor = "white"

        // when am disconnected, need to unsubscribe so not taking up space in controller
        // however, am sometimes disconnected due to windows moving around
        // therefore, I subscribe every time I connect and unsubscribe every time I disconnect
        controller.subscribeToInputs(this)
        controller.subscribeToControllerState(this)
        controller.subscribeToPreviousAction(this)
        controller.subscribeToSelectedShapes(this)
        controller.subscribeToSceneModel(this,"timelineEvents")
        controller.subscribeToSceneModel(this,"clock")
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeToInputs(this)
        controller.unsubscribeToControllerState(this)
        controller.unsubscribeToPreviousAction(this)
        controller.unsubscribeToSelectedShapes(this)
        controller.unsubscribeToSceneModel(this,"timelineEvents")
        controller.unsubscribeToSceneModel(this,"clock")
    }

    save(){
        return {"windowType":"timeline"}
    }

    load(save){

    }

    // position with respect to the right part of the window, filled by the timeline
    timeToTimelinePosition(timeSeconds){
        if (timeSeconds > animationEndTimeSeconds || timeSeconds < 0){
            console.error("Time is out of bounds. Time is ",timeSeconds)
        }
        return timeSeconds/animationEndTimeSeconds
    }

    // position with respect to whole window
    timeToWindowPosition(timeSeconds){
        return this.timeToTimelinePosition(timeSeconds)*timelineRightMenuSize+timelineLeftMenuSize
    }

    timeLinePositionToTime(position){
        return position*animationEndTimeSeconds
    }

    globalWidthToTimelineWidth(width){
        const boundingRect = this.getBoundingClientRect()

        // this is to account for the fact that the first 15% is dedicated to the left menu
        return width/(boundingRect.width*timelineRightMenuSize)
    }

    pointerPositionToTimelinePosition(pointerEvent){

        const boundingRect = this.getBoundingClientRect()

        // this is to account for the fact that the first 15% is dedicated to the left menu
        return clamp(
            ((pointerEvent.clientX-boundingRect.x)/boundingRect.width-timelineLeftMenuSize)/timelineRightMenuSize,
            0,
            1
        )
    }

    newSelectedShapes(newSelectedShapes){

        this.timelineList.replaceChildren()

        for (const shape of newSelectedShapes){
            new shapeTimeline(this,shape)
        }
    }

    addModel(aggregateModel,model){

        switch (aggregateModel){
            case "selectedShapes":
                new shapeTimeline(this,model)
                break
            case "timelineEvents":
                this.shapeToTimeline.get(model.shape)?.addTimeLineEvent(model)
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
                this.newSelectedShapes(controller.selectedShapes())
                break
            case "clock":
                this.cursor.updateTimeCursor()
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

                const shape = this.shapeToTimeline.get(model.shape)

                shape.updatePosition()
                shape.updateTimeLineEvent(model)

                break
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    removeModel(aggregateModel,model){
        switch (aggregateModel){
            case "selectedShapes":
                this.shapeToTimeline.get(model).shapeSection.remove()
                this.shapeToTimeline.delete(model)
                break
            case "timelineEvents":
                this.shapeToTimeline.get(model.shape)?.removeTimeLineEvent(model)
                break
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    newControllerState(state){
        if (state === "PlayingState"){
            this.playButton.onpointerdown = (pointerEvent) => {
                controller.pauseAnimation()
                this.snapTimeToCell()
                pointerEvent.stopPropagation()
            }

            this.playButton.src = "assets/pause.svg"
        } else {
            this.playButton.onpointerdown = (pointerEvent) => {
                controller.playAnimation()
                pointerEvent.stopPropagation()
            }

            this.playButton.src = "assets/play.svg"
        }
    }

    newPreviousAction(previousAction){
        if (previousAction.addableToTimeline){
            this.cursor.previousActionTimelineEventsReady()
        } else {
            this.cursor.previousActionTimelineEventsGone()
        }
    }

    snapValueToCellBorder(value){
        return Math.round(value/timelineSnapLength)*timelineSnapLength
    }

    snapValueToCell(value){

        if (value === animationEndTimeSeconds){
            return timelineSnapLength*Math.floor(animationEndTimeSeconds/timelineSnapLength) - timelineSnapLength/2
        }

        return Math.round((value - timelineSnapLength/2)/timelineSnapLength)*timelineSnapLength + timelineSnapLength/2
    }

    snapTimeToCell(){
        const gridValue = this.snapValueToCell(controller.clock())

        controller.newClockTime(gridValue)

    }

    deselectAll(){
        for (const [shape,shapeTimeline] of this.shapeToTimeline){
            shapeTimeline.deselectAll()
        }
    }

    acceptKeyDown(keyboardEvent){

        switch (keyboardEvent.key){
            case " ":
                if (controller.animationPlaying){
                    controller.pauseAnimation()
                    this.snapTimeToCell()
                } else {
                    controller.playAnimation()
                }
                return true

            case "ArrowRight":
                controller.newClockTime(controller.clock()+timelineSnapLength)
                this.snapTimeToCell()
                return true

            case "ArrowLeft":
                controller.newClockTime(controller.clock()-timelineSnapLength)
                this.snapTimeToCell()
                return true
        }

        return false
    }

    acceptKeyUp(keyboardEvent){
        return false
    }

    // here for polymorphic reasons
    loseFocus(){
    }
}

window.customElements.define("time-line",Timeline)
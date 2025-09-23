import {AbstractView} from "../view.js"
import {shapeTimeline} from "./timelineModes/shapeTimeline.js";
import {timeCursor} from "./timelineModes/timeCursor.js";
import {controller} from "../../controller.js";
import {
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
    eventTokenWidth
} from "../../constants.js";
import {clamp} from "../../maths.js";
import {PlayingState} from "../../controllerComponents/playing.js";

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

            controller.beginAction()
            controller.takeStep("goToTime",
                [this.snapValueToCell(this.pointerPositionToTimelinePosition(pointerEvent)*controller.animationEndTime())]
            )
            controller.endAction()
        }

        this.playButton = this.shadowRoot.getElementById("playButton")
        this.playButton.onpointerdown = (pointerEvent) => {
            controller.play()
            pointerEvent.stopPropagation()
        }
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
        controller.subscribeToSceneModel(this,"clock")
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()
        controller.unsubscribeToInputs(this)
        controller.unsubscribeToControllerState(this)
        controller.unsubscribeToPreviousAction(this)
        controller.unsubscribeToSelectedShapes(this)
        controller.unsubscribeToSceneModel(this,"clock")
    }

    save(){
        return {"windowType":"timeline"}
    }

    load(save){

    }

    // position with respect to the right part of the window, filled by the timeline
    timeToTimelinePosition(timeSeconds){
        return clamp(timeSeconds/controller.animationEndTime(),0,1)
    }

    // position with respect to whole window
    timeToWindowPosition(timeSeconds){
        return this.timeToTimelinePosition(timeSeconds)*timelineRightMenuSize+timelineLeftMenuSize
    }

    timeLinePositionToTime(position){
        return position*controller.animationEndTime()
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
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    updateAggregateModel(aggregateModel,model){

        switch (aggregateModel){
            case "selectedShapes":
                this.newSelectedShapes(model)
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
                this.shapeToTimeline.get(model).shapeSection.remove()
                this.shapeToTimeline.delete(model)
                new shapeTimeline(this,model)
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
            default:
                console.error("timeline got updates from",aggregateModel)
        }
    }

    newControllerState(state){
        if (state instanceof PlayingState){
            this.playButton.src = "assets/pause.svg"
        } else {
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
        return clamp(Math.round(value/controller.timelineSnapLength())*controller.timelineSnapLength(),0,controller.animationEndTime())
    }

    snapValueToCell(value){
        return clamp(clamp(
            Math.round((value - controller.timelineSnapLength()/2)/controller.timelineSnapLength())
            *controller.timelineSnapLength() + controller.timelineSnapLength()/2,
            controller.timelineSnapLength()/2,
            controller.animationEndTime()-controller.timelineSnapLength()/2
        ),0,controller.animationEndTime())
    }

    deselectAll(){
        for (const [shape,shapeTimeline] of this.shapeToTimeline){
            shapeTimeline.deselectAll()
        }
    }

    acceptKeyDown(keyboardEvent){

        switch (keyboardEvent.key){
            case " ":
                controller.play()

                return true

            case "ArrowRight":

                controller.beginAction()
                controller.takeStep("goToTime",[this.snapValueToCell(controller.clock()+controller.timelineSnapLength())])
                controller.endAction()
                return true

            case "ArrowLeft":
                controller.beginAction()
                controller.takeStep("goToTime",[this.snapValueToCell(controller.clock()-controller.timelineSnapLength())])
                controller.endAction()
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
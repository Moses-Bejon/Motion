import {model} from "./model/model.js";
import {binaryInsertion} from "./dataStructureOperations.js";
import {randomBrightColour} from "./random.js"
import {action} from "./model/action.js";
import {rootAction} from "./model/rootAction.js";
import {animationEndTimeSeconds} from "./constants.js";

class controllerClass{
    constructor() {

        // all the aggregate models are permanent, and should be saved at the end of session
        this.aggregateModels = model

        // ordered list of views that hear about keyboard inputs
        // the higher in the hierarchy, the more likely informed (more "in focus")
        this.inputSubscribersHierarchy = []

        // used as pointer to undo/redo stack, which is implemented as a linked list
        this.previousAction = new rootAction()

        this.previousActionTimelineEventsSubscribers = new Set()

        // index of the timeline event in forward state closest to current time i.e. the one that's just been done
        // -1 if there are no timeline events or none in forward state
        this.currentTimelineEvent = -1

        // shapes that views want to copy
        this.copiedShapes = []

        // subscribers to alert when playback stops/starts
        this.animationPlayingSubscribers = new Set()
        this.animationPlaying = false

        // used to name shapes
        this.numberOfEachTypeOfShape = {}

        // used to ensure each new shape is placed higher than the last
        this.ZIndexOfHighestShape = 0

        document.addEventListener("keydown",this.keyDown.bind(this))
        document.addEventListener("keyup",this.keyUp.bind(this))
    }

    // how other classes interface with controller
    // this ensures they cannot edit the content (or shouldn't, JavaScript doesn't have private variables)
    allShapes(){
        return this.aggregateModels.allShapes.content
    }
    timelineEvents(){
        return this.aggregateModels.timelineEvents.content
    }
    clock(){
        return this.aggregateModels.clock.content
    }
    displayShapes(){
        return this.aggregateModels.displayShapes.content
    }
    selectedShapes(){
        return this.aggregateModels.selectedShapes.content
    }

    newAction(forwardAction,backwardAction,timelineEvents){

        forwardAction()

        const newAction = new action(forwardAction,backwardAction)

        this.previousActionTimelineEvents = timelineEvents

        if (this.previousActionTimelineEvents.length === 0){
            this.previousActionTimelineEventsGone()
        } else {
            this.previousActionTimelineEventsReady()
        }

        this.previousAction.addActionAfter(newAction)
        newAction.appendToUndoRedoStack(this.previousAction)

        this.previousAction = newAction
    }

    undoAction(){
        this.previousAction.backwardAction()

        this.previousAction = this.previousAction.previousAction
    }

    redoAction(){

        if (this.previousAction.nextAction === undefined){
            return
        }

        this.previousAction = this.previousAction.nextAction

        this.previousAction.forwardAction()
    }

    subscribeTo(subscriber,aggregateModel){
        this.aggregateModels[aggregateModel].subscribers.add(subscriber)

        subscriber.updateAggregateModel(aggregateModel,this.aggregateModels[aggregateModel].content)
    }

    unsubscribeTo(subscriber,aggregateModel){
        this.aggregateModels[aggregateModel].subscribers.delete(subscriber)
    }

    addModel(aggregateModel,model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.addModel(aggregateModel,model)
        }
    }

    removeModel(aggregateModel,model){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.removeModel(aggregateModel,model)
        }
    }

    updateModel(aggregateModel,model,previousModel=model){

        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.updateModel(aggregateModel,model,previousModel)
        }
    }

    updateAggregateModel(aggregateModel){
        for (const subscriber of this.aggregateModels[aggregateModel].subscribers){
            subscriber.updateAggregateModel(aggregateModel,this.aggregateModels[aggregateModel].content)
        }
    }

    newAggregateModel(aggregateModel,newModel){
        this.aggregateModels[aggregateModel].content = newModel
        this.updateAggregateModel(aggregateModel)
    }

    selectShape(shape){

        if (this.isSelected(shape)){
            return
        }

        this.aggregateModels.selectedShapes.content.add(shape)
        this.addModel("selectedShapes",shape)
    }

    isSelected(shape){
        return this.selectedShapes().has(shape);
    }

    newShape(shape){

        if (!shape.modelConstructed) {
            const shapeType = shape.constructor.name.charAt(0).toUpperCase() + shape.constructor.name.slice(1)
            if (Object.hasOwn(this.numberOfEachTypeOfShape, shapeType)) {
                this.numberOfEachTypeOfShape[shapeType]++
            } else {
                this.numberOfEachTypeOfShape[shapeType] = 1
            }
            const shapeName = shapeType + " " + this.numberOfEachTypeOfShape[shapeType]

            shape.modelConstruct(this.ZIndexOfHighestShape, shapeName)

            this.ZIndexOfHighestShape++

            this.addTimeLineEvent({
                "type": "appearance",
                "shape": shape,
                "time": shape.appearanceTime,
                "forward": () => {this.showShape(shape)},
                "backward": () => {this.hideShape(shape)}
            })
            this.addTimeLineEvent({
                "type": "disappearance",
                "shape": shape,
                "time": shape.disappearanceTime,
                "forward": () => {this.hideShape(shape)},
                "backward": () => {this.showShape(shape)}
            })
        } else {
            for (const timelineEvent of shape.timelineEvents){
                this.addTimeLineEvent(timelineEvent)
            }
        }

        this.aggregateModels.allShapes.content.add(shape)
        this.addModel("allShapes",shape)
    }

    removeShape(shape){
        this.aggregateModels.allShapes.content.delete(shape)
        this.removeModel("allShapes",shape)

        this.removeShapeFromTimeline(shape)

        if (shape.appearanceTime <= this.clock() <= shape.disappearanceTime){
            this.aggregateModels.displayShapes.content.delete(shape)
            this.removeModel("displayShapes",shape)
        }

        if (this.selectedShapes().has(shape)){
            this.selectedShapes().delete(shape)
            this.removeModel("selectedShapes",shape)
        }
    }

    insertIntoTimeline(event){
        const placeToInsert = binaryInsertion(
            this.timelineEvents(),
            event.time,
            (timeLineEvent)=>{return timeLineEvent.time}
        )

        this.aggregateModels.timelineEvents.content.splice(placeToInsert,0,event)

        if (event.time <= this.clock()){
            this.currentTimelineEvent ++
        }
    }

    removeIndexFromTimeline(index){
        this.aggregateModels.timelineEvents.content.splice(index,1)

        if (this.currentTimelineEvent >= index){
            this.currentTimelineEvent --
        }
    }

    addTimeLineEvent(event){

        if (!Object.hasOwn(event,"colour")){
            event.colour = randomBrightColour()
        }

        if (event.time <= this.clock()){
            event.forward()
        }

        this.insertIntoTimeline(event)
        event.shape.addTimelineEvent(event)

        this.addModel("timelineEvents",event)
    }

    // performs a linear search for removed event
    // could be optimised using binary search in the future
    // reason not implemented yet is you need to handle case where multiple events occur at same time
    removeTimeLineEvent(event){
        for (let i = 0; i<this.timelineEvents().length;i++){
            if (this.timelineEvents()[i] === event){

                if (i <= this.currentTimelineEvent){
                    event.backward()
                }

                event.shape.removeTimelineEvent(this.timelineEvents()[i])
                this.removeModel("timelineEvents",this.timelineEvents()[i])
                this.removeIndexFromTimeline(i)

                return
            }
        }
    }

    hideShape(shape){
        if (!this.displayShapes().has(shape)){

            console.error("attempted to hide already hidden shape",shape)

            return
        }

        this.aggregateModels.displayShapes.content.delete(shape)
        this.removeModel("displayShapes",shape)
    }

    showShape(shape){
        if (this.displayShapes().has(shape)){

            console.error("attempted to show already shown shape",shape)

            return
        }

        this.aggregateModels.displayShapes.content.add(shape)
        this.addModel("displayShapes",shape)
    }

    updateShape(shape){
        this.updateModel("allShapes",shape)

        if (this.displayShapes().has(shape)){
            this.updateModel("displayShapes",shape)
        }

        if (this.selectedShapes().has(shape)){
            this.updateModel("selectedShapes",shape)
        }
    }

    // could be optimised using binary search in the future
    // reason not implemented yet is you need to handle case where multiple events occur at same time
    changeTimeOfEvent(event,newTime){
        for (let i = 0; i<this.timelineEvents().length; i++){
            if (this.timelineEvents()[i] === event){

                if (event.time > this.clock() && newTime <= this.clock()){
                    event.forward()
                } else if (event.time <= this.clock() && newTime > this.clock()){
                    event.backward()
                }

                event.time = newTime

                this.updateModel("timelineEvents",event)
                this.removeIndexFromTimeline(i)
                this.insertIntoTimeline(event)

                return
            }
        }

        console.error("Attempted to update event but previous event was not in event list",this.timelineEvents(),event)
    }

    removeShapeFromTimeline(shape){

        const remainingEvents = []

        for (const timeLineEvent of this.timelineEvents()) {
            if (timeLineEvent.shape === shape) {
                this.removeModel("timelineEvents",timeLineEvent)

                if (timeLineEvent.time <= this.clock()){
                    this.currentTimelineEvent --
                }

            } else {
                remainingEvents.push(timeLineEvent)
            }
        }

        this.aggregateModels.timelineEvents.content = remainingEvents

    }

    playAnimation(){
        this.previousTime = performance.now()

        this.animationPlaying = true

        for (const subscriber of this.animationPlayingSubscribers){
            subscriber.animationStarted()
        }

        this.nextFrame()
    }

    nextFrame(){
        const currentTime = performance.now()
        const deltaTime = currentTime - this.previousTime

        let time = this.clock()+deltaTime/1000

        if (time > animationEndTimeSeconds){
            time = 0
            this.goBackwardToTime(time)
        } else {
            this.goForwardToTime(time)
        }

        this.aggregateModels.clock.content = time
        this.updateAggregateModel("clock")

        this.previousTime = currentTime

        this.animationFrame = requestAnimationFrame(this.nextFrame.bind(this))
    }

    pauseAnimation() {
        this.animationPlaying = false
        cancelAnimationFrame(this.animationFrame)

        for (const subscriber of this.animationPlayingSubscribers){
            subscriber.animationPaused()
        }
    }

    goForwardToTime(time){

        // for every event between now and last event
        for (let i = this.currentTimelineEvent+1;i<this.timelineEvents().length;i++){
            const nextEvent = this.timelineEvents()[i]

            if (nextEvent.time > time){

                // we are just before the place where the time is greater than us
                this.currentTimelineEvent = i-1
                return
            }

            nextEvent.forward()
        }

        this.currentTimelineEvent = this.timelineEvents().length-1
    }

    goBackwardToTime(time){

        // for every event between now and first event
        for (let i = this.currentTimelineEvent;i>=0;i--){

            const previousEvent = this.timelineEvents()[i]

            if (previousEvent.time <= time){

                this.currentTimelineEvent = i
                return
            }

            previousEvent.backward()
        }

        this.currentTimelineEvent = -1
    }

    newClockTime(time){

        if (time < this.clock()){
            this.goBackwardToTime(time)
        } else{
            this.goForwardToTime(time)
        }

        this.aggregateModels.clock.content = time
        this.updateAggregateModel("clock")
    }

    newFocus(focus){

        // indicating to the previous focus to clean stuff up as they have lost focus
        this.inputSubscribersHierarchy[0]?.loseFocus()

        // new focus placed on top of the hierarchy
        this.inputSubscribersHierarchy.unshift(focus)
    }

    setFocus(focus){

        // remove from place in hierarchy
        this.inputSubscribersHierarchy.splice(this.inputSubscribersHierarchy.indexOf(focus),1)

        // and set to top of hierarchy
        this.newFocus(focus)
    }

    subscribeToInputs(subscriber){

        // focus should always be set when a user clicks on a window
        subscriber.addFunctionToPerformOnClick(() => {this.setFocus(subscriber)})

        // keeps track of which window the user is currently hovering over
        subscriber.onmouseenter = () => {this.hoveringOver = subscriber}
        subscriber.onmouseleave = () => {subscriber.loseFocus()}

        // newly added windows are set as the focus
        this.newFocus(subscriber)
    }

    unsubscribeToInputs(subscriber){

        // removes from list of subscribers
        this.inputSubscribersHierarchy.splice(this.inputSubscribersHierarchy.indexOf(subscriber),1)
    }

    keyDown(event){

        // item that is being hovered over is the top priority for inputs
        if (this.hoveringOver?.acceptKeyDown(event)){
            event.preventDefault()

            // once a view has accepted an input, it goes to the top of the hierarchy
            // this means it is second in line when a user moves on to hover over something else
            this.setFocus(this.hoveringOver)
            return
        }

        // find top subscriber in hierarchy who accepts the input
        for (const inputSubscriber of this.inputSubscribersHierarchy){
            if (inputSubscriber.acceptKeyDown(event)){

                // if we are accepting a keyboard input, using it as an input, we don't want the browser doing the same
                event.preventDefault()

                this.setFocus(inputSubscriber)
                return
            }
        }
    }

    keyUp(event){

        if (this.hoveringOver?.acceptKeyUp(event)){
            event.preventDefault()

            this.setFocus(this.hoveringOver)
            return
        }

        for (const inputSubscriber of this.inputSubscribersHierarchy){
            if (inputSubscriber.acceptKeyUp(event)){
                event.preventDefault()

                this.setFocus(inputSubscriber)
                return
            }
        }
    }

    subscribeToAnimationPlaying(subscriber){
        this.animationPlayingSubscribers.add(subscriber)

        if (this.animationPlaying){
            subscriber.animationStarted()
        } else {
            subscriber.animationPaused()
        }
    }

    unsubscribeToAnimationPlaying(subscriber){
        this.animationPlayingSubscribers.delete(subscriber)
    }

    // allows UI for putting the timeline event to appear
    previousActionTimelineEventsReady(){
        for (const subscriber of this.previousActionTimelineEventsSubscribers){
            subscriber.previousActionTimelineEventsReady()
        }
    }

    // allows for this UI to disappear
    previousActionTimelineEventsGone() {
        for (const subscriber of this.previousActionTimelineEventsSubscribers){
            subscriber.previousActionTimelineEventsGone()
        }
    }

    addPreviousActionTimelineEventToTimeline() {
        for (const timelineEvent of this.previousActionTimelineEvents){
            timelineEvent.time = this.clock()

            // removes the previous action from the undo/redo stack
            this.undoAction()

            this.newAction(
                () => {
                    this.addTimeLineEvent(timelineEvent)
                },
                () => {
                    this.removeTimeLineEvent(timelineEvent)
                },
                []
            )

        }

        // makes sure the same events can't be added twice, that would be a real disaster
        this.previousActionTimelineEvents = []
        this.previousActionTimelineEventsGone()
    }

    subscribeToPreviousActionTimelineEvents(subscriber){
        this.previousActionTimelineEventsSubscribers.add(subscriber)
    }

    unsubscribeToPreviousActionTimelineEvents(subscriber){
        this.previousActionTimelineEventsSubscribers.delete(subscriber)
    }
}

export const controller = new controllerClass()
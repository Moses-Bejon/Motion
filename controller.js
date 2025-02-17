import {model} from "./model/model.js";
import {binaryInsertion} from "./dataStructureOperations.js";
import {randomBrightColour} from "./random.js"
import {action} from "./model/action.js";
import {rootAction} from "./model/rootAction.js";
import {animationEndTimeSeconds} from "./constants.js";
import {clamp} from "./maths.js";
import {drawing} from "./model/drawing.js";
import {shapeGroup} from "./model/shapeGroup.js";
import {ellipse} from "./model/ellipse.js";
import {graphic} from "./model/graphic.js";
import {polygon} from "./model/polygon.js";
import {text} from "./model/text.js";
import {translationTween} from "./model/tweens/translateTween.js";
import {rotationTween} from "./model/tweens/rotationTween.js";
import {scaleTween} from "./model/tweens/scaleTween.js";

class controllerClass{
    constructor() {

        // all the aggregate models are permanent, and should be saved at the end of session
        this.aggregateModels = structuredClone(model)

        // ordered list of views that hear about keyboard inputs
        // the higher in the hierarchy, the more likely informed (more "in focus")
        this.inputSubscribersHierarchy = []

        // used as pointer to undo/redo stack, which is implemented as a linked list
        this.previousAction = new rootAction()

        this.previousActionTimelineEventsSubscribers = new Set()

        // index of the timeline event in forward state closest to current time i.e. the one that's just been done
        // -1 if there are no timeline events or none in forward state
        this.currentTimelineEvent = -1

        // all the tweens the controller should think about when updating
        this.currentTimelineTweens = new Set()

        // shapes that views want to copy
        this.copiedShapes = []

        // subscribers to alert when playback stops/starts
        this.animationPlayingSubscribers = new Set()
        this.animationPlaying = false

        // used to name shapes
        this.numberOfEachTypeOfShape = {}

        // used to ensure each new shape is placed higher than the last
        this.ZIndexOfHighestShape = 0

        // to know which directory we should add shapes to, null indicates to not add it to a directory
        this.selectedDirectorySubscribers = new Set()
        this.selectedDirectory = null

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

    deselectShape(shape){
        if (!this.isSelected(shape)){
            return
        }

        this.aggregateModels.selectedShapes.content.delete(shape)
        this.removeModel("selectedShapes",shape)
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

            shape.modelConstruct(this.ZIndexOfHighestShape, shapeName,this.selectedDirectory)

            this.ZIndexOfHighestShape++
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

        if (shape.appearanceTime <= this.clock() && this.clock() <= shape.disappearanceTime){
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

        if (Object.hasOwn(event,"tween") && !event.tween.modelConstructed){
            event.tween.modelConstruct(this.clock())
        }

        this.insertIntoTimeline(event)
        event.shape.addTimelineEvent(event)

        if (event.time <= this.clock()){
            event.forward()
        }

        this.addModel("timelineEvents",event)
    }

    // performs a linear search for removed event
    // could be optimised using binary search in the future
    // reason not implemented yet is you need to handle case where multiple events occur at same time
    removeTimeLineEvent(event){
        for (let i = 0; i<this.timelineEvents().length;i++){
            if (this.timelineEvents()[i] === event){

                this.removeIndexFromTimeline(i)
                event.shape.removeTimelineEvent(this.timelineEvents()[i])

                if (i <= this.currentTimelineEvent){
                    event.backward()
                }

                this.currentTimelineTweens.delete(event.tween)

                this.removeModel("timelineEvents",this.timelineEvents()[i])

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

                const previousTime = event.time
                event.time = newTime

                this.removeIndexFromTimeline(i)
                this.insertIntoTimeline(event)

                if (previousTime > this.clock() && newTime <= this.clock()){
                    event.forward()
                } else if (previousTime <= this.clock() && newTime > this.clock()){
                    event.backward()
                }

                this.updateModel("timelineEvents",event)

                return
            }
        }

        console.error("Attempted to update event but previous event was not in event list",this.timelineEvents(),event)
    }

    filterTimelineEvents(conditionToRemove){
        const remainingEvents = []

        for (const timeLineEvent of this.timelineEvents()) {
            if (conditionToRemove(timeLineEvent)) {

                timeLineEvent.shape.removeTimelineEvent(timeLineEvent)

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

    removeTween(tween){
        this.filterTimelineEvents((timelineEvent) => {
            return timelineEvent.tween === tween
        })

        this.currentTimelineTweens.delete(tween)
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

        for (const tween of this.currentTimelineTweens){
            tween.goToTime(time)
        }

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

        time = clamp(time,0,animationEndTimeSeconds)

        if (time < this.clock()){
            this.goBackwardToTime(time)
        } else{
            this.goForwardToTime(time)
        }

        this.aggregateModels.clock.content = time
        this.updateAggregateModel("clock")

        for (const tween of this.currentTimelineTweens){
            tween.goToTime(time)
        }

    }

    addTweenToCurrentTweens(tween){
        this.currentTimelineTweens.add(tween)
    }

    removeTweenFromCurrentTweens(tween){
        this.currentTimelineTweens.delete(tween)
    }

    newSelectedDirectory(directory){
        for (const subscriber of this.selectedDirectorySubscribers){
            subscriber.newSelectedDirectory(directory,this.selectedDirectory)
        }
        this.selectedDirectory = directory
    }

    deselectSelectedDirectory(){
        for (const subscriber of this.selectedDirectorySubscribers){
            subscriber.deselectSelectedDirectory(this.selectedDirectory)
        }
        this.selectedDirectory = null
    }

    deselectDirectory(directory){
        if (this.selectedDirectory === directory){
            this.deselectSelectedDirectory()
        }
    }

    deleteDirectory(directory){

        // new set required as this.allShapes() is actively modified while we remove shapes
        const allShapesCopy = new Set(this.allShapes())

        for (const shape of allShapesCopy){
            if (shape.directory === directory){
                this.removeShape(shape)
            }
        }

        this.deselectDirectory(directory)
    }

    changeDirectoryName(oldName,newName){

        if (this.selectedDirectory === oldName){
            this.selectedDirectory = newName
        }

        for (const shape of this.allShapes()){
            if (shape.directory === oldName){
                shape.directory = newName
            }

            this.updateShape(shape)
        }
    }

    subscribeToSelectedDirectory(subscriber){
        this.selectedDirectorySubscribers.add(subscriber)
        subscriber.newSelectedDirectory(this.selectedDirectory)
    }

    unsubscribeFromSelectedDirectory(subscriber){
        this.selectedDirectorySubscribers.delete(subscriber)
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

        // find active element
        let activeElement = document.activeElement
        while (activeElement.shadowRoot) {
            activeElement = activeElement.shadowRoot.activeElement
        }

        // if the active element is an input it gets priority
        if (activeElement.tagName === "INPUT"){
            return
        }

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

        const timelineEventsCopy = new Set(this.previousActionTimelineEvents)

        // ensures they have the time at which they were added to the timeline
        for (const timelineEvent of timelineEventsCopy){
            timelineEvent.time = timelineEvent.timeChange(this.clock())
        }

        // removes the previous action from the undo/redo stack
        this.undoAction()

        this.newAction(
            () => {
                for (const timelineEvent of timelineEventsCopy){
                    this.addTimeLineEvent(timelineEvent)
                }
            },
            () => {
                for (const timelineEvent of timelineEventsCopy){
                    this.removeTimeLineEvent(timelineEvent)
                }
            },
            []
        )

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

    saveFile(rootWindowSaved){

        const fileName = window.prompt("Enter file name:","untitled")

        // if user clicks cancel
        if (fileName === null){
            return
        }

        const now = this.clock()

        // when we load the file we start here
        this.newClockTime(0)

        const file = {
            "fileVersion":0,
            "aggregateModels":{"allShapes":[],"clock":now},
            "allTweens":[],
            "numberOfEachTypeOfShape":this.numberOfEachTypeOfShape,
            "ZIndexOfHighestShape":this.ZIndexOfHighestShape,
            "rootWindow":rootWindowSaved
        }

        const allShapes = []
        this.shapeToReference = new Map()

        this.allTweens = []
        this.tweenToReference = new Map()

        let i = 0
        for (const shape of this.allShapes()){
            allShapes.push(shape.save())
            this.shapeToReference.set(shape,i)

            i++
        }

        file.aggregateModels.allShapes = allShapes
        file.allTweens = this.allTweens

        const jsonFile = JSON.stringify(file)

        const blob = new Blob([jsonFile], { type: 'application/json' })
        this.downloadFile(URL.createObjectURL(blob),fileName)

        this.newClockTime(now)
    }

    downloadFile(fileURL,fileName){
        const downloadLink = document.createElement('a')
        downloadLink.href = fileURL
        downloadLink.download = fileName
        document.body.appendChild(downloadLink)

        // trigger download automatically
        downloadLink.click()

        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(downloadLink.href)
    }

    saveTimelineEvent(timelineEvent){
        const savedTimelineEvent = {
            "type":timelineEvent.type,
            "time":timelineEvent.time,
            "colour":timelineEvent.colour
        }

        if (Object.hasOwn(timelineEvent,"tween")){
            if (!this.tweenToReference.has(timelineEvent.tween)){
                this.tweenToReference.set(timelineEvent.tween,this.allTweens.length)
                this.allTweens.push(timelineEvent.tween.save())
            }

            savedTimelineEvent.tween = this.tweenToReference.get(timelineEvent.tween)
        }

        return savedTimelineEvent
    }

    loadTimelineEvent(shape,savedTimelineEvent){

        let timelineEvent

        if (Object.hasOwn(savedTimelineEvent,"tween")){

            if (!this.tweenReferenceToLoadedTween.has(savedTimelineEvent.tween)){

                const tween = this.allTweens[savedTimelineEvent.tween]

                let loadedTween

                switch (tween.tweenType){
                    case "translationTween":
                        loadedTween = new translationTween([0,0],shape)
                        break
                    case "rotationTween":
                        loadedTween = new rotationTween(0,[0,0],shape)
                        break
                    case "scaleTween":
                        loadedTween = new scaleTween(1,[0,0],shape)
                        break
                    default:
                        console.error("unrecognised tween type",tween.tweenType)
                }

                loadedTween.load(tween)

                this.tweenReferenceToLoadedTween.set(savedTimelineEvent.tween,loadedTween)
            }

            if (savedTimelineEvent.type === "tweenStart"){
                timelineEvent = this.tweenReferenceToLoadedTween.get(savedTimelineEvent.tween).getTweenStartEvent()
            } else {
                timelineEvent = this.tweenReferenceToLoadedTween.get(savedTimelineEvent.tween).getTweenEndEvent()
            }

            timelineEvent.time = savedTimelineEvent.time
            timelineEvent.colour = savedTimelineEvent.colour

        } else {
            timelineEvent = {
                "type":savedTimelineEvent.type,
                "time":savedTimelineEvent.time,
                "colour":savedTimelineEvent.colour,
                "shape": shape
            }

            switch (savedTimelineEvent.type){
                case "appearance":
                    timelineEvent.forward = () => {
                        controller.showShape(shape)
                    }
                    timelineEvent.backward = () => {
                        controller.hideShape(shape)
                    }
                    break
                case "disappearance":
                    timelineEvent.forward = () => {
                        controller.hideShape(shape)
                    }
                    timelineEvent.backward = () => {
                        controller.showShape(shape)
                    }
                    break
                default:
                    console.error("unrecognised shape type",savedTimelineEvent.type)
            }
        }

        return timelineEvent
    }

    async loadFile(file){

        try {
            file = await this.readJSONFile(file)
        } catch (error){
            throw error
        }


        // resetting to initial state before new file loaded
        this.aggregateModels = structuredClone(model)
        this.inputSubscribersHierarchy = []
        this.previousAction = new rootAction()
        this.previousActionTimelineEventsSubscribers = new Set()
        this.currentTimelineEvent = -1
        this.currentTimelineTweens = new Set()
        this.copiedShapes = []
        this.animationPlayingSubscribers = new Set()
        this.animationPlaying = false
        this.selectedDirectorySubscribers = new Set()
        this.selectedDirectory = null

        this.newClockTime(file.aggregateModels.clock)

        this.numberOfEachTypeOfShape = file.numberOfEachTypeOfShape
        this.ZIndexOfHighestShape = file.ZIndexOfHighestShape

        this.tweenReferenceToLoadedTween = new Map()

        this.allTweens = file.allTweens

        for (const shape of file.aggregateModels.allShapes){
            const loadedShape = await this.loadShape(shape)

            this.newShape(loadedShape)
        }

        // ensures all tweens are in correct place
        this.newClockTime(this.clock())

        // allows the saved root window to be loaded in
        return file.rootWindow
    }

    readJSONFile(JSONFile){

        const fileReader = new FileReader()

        return new Promise((resolve, reject) => {
            fileReader.onload = () => {
                try {
                    resolve(JSON.parse(fileReader.result))
                } catch (error) {
                    reject(error)
                }
            }
            fileReader.onerror = () => reject(fileReader.error)
            fileReader.readAsText(JSONFile)
        })
    }

    async loadShape(shapeJSON){
        let newShape
        switch (shapeJSON.shapeType){
            case "drawing":
                newShape = new drawing(0,0,"black",1,[[1,1]])
                break
            case "shapeGroup":
                newShape = new shapeGroup(0,0,[])
                break
            case "ellipse":
                newShape = new ellipse(0,0,[0,0],1,1,"black","black",0,1)
                break
            case "graphic":
                newShape = new graphic(0,0,[0,0],0)
                break
            case "polygon":
                newShape = new polygon(0,0,"black","black",1,[[1,1],[2,2],[1,3]])
                break
            case "text":
                newShape = new text(0,0,[0,0],0,"black")
                break
            default:
                console.error("could not load shape - ",shapeJSON)
        }

        await newShape.load(shapeJSON)

        return newShape
    }
}

export const controller = new controllerClass()
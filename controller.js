import {model} from "./model/model.js";
import {binaryInsertion, objectsEqual} from "./dataStructureOperations.js";
import {action} from "./model/action.js";
import {rootAction} from "./model/rootAction.js";

class controllerClass{
    constructor() {

        // all the aggregate models are permanent, and should be saved at the end of session
        this.aggregateModels = model

        // ordered list of views that hear about keyboard inputs
        // the higher in the hierarchy, the more likely informed (more "in focus")
        this.inputSubscribersHierarchy = []

        // used as pointer to undo/redo stack, which is implemented as a linked list
        this.previousAction = new rootAction()

        // shapes that views want to copy
        this.copiedShapes = []

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

    newAction(forwardAction,backwardAction){

        forwardAction()

        const newAction = new action(forwardAction,backwardAction)

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
        }

        this.aggregateModels.allShapes.content.add(shape)
        this.addModel("allShapes",shape)

        this.addTimeLineEvent({"type": "appearance","shape": shape,"time": shape.appearanceTime})
        this.addTimeLineEvent({"type": "disappearance","shape": shape,"time": shape.disappearanceTime})

        if (shape.appearanceTime <= this.clock() <= shape.disappearanceTime){
            this.aggregateModels.displayShapes.content.add(shape)
            this.addModel("displayShapes",shape)
        }
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

        this.timelineEvents().splice(placeToInsert,0,event)
    }

    addTimeLineEvent(event){
        this.insertIntoTimeline(event)

        this.addModel("timelineEvents",event)
    }

    // could be optimised using binary search in the future
    // reason not implemented yet is you need to handle case where multiple events occur at same time
    updateTimeLineEvent(previousEvent,newEvent){
        for (let i = 0; i<this.timelineEvents().length; i++){
            if (objectsEqual(this.timelineEvents()[i],previousEvent)){

                this.updateModel("timelineEvents",newEvent,previousEvent)
                this.aggregateModels.timelineEvents.content.splice(i,1)
                this.insertIntoTimeline(newEvent)

                switch (previousEvent.type){
                    case "appearance":
                        if (previousEvent.time <= this.clock() && newEvent.time >= this.clock()){

                            if (!this.displayShapes().has(previousEvent.shape)){
                                return
                            }

                            this.aggregateModels.displayShapes.content.delete(previousEvent.shape)
                            this.removeModel("displayShapes",previousEvent.shape)
                        } else if (previousEvent.time >= this.clock() && newEvent.time <= this.clock()){

                            if (this.displayShapes().has(previousEvent.shape)){
                                return
                            }

                            this.aggregateModels.displayShapes.content.add(previousEvent.shape)
                            this.addModel("displayShapes",previousEvent.shape)
                        }
                        return
                    case "disappearance":
                        if (previousEvent.time <= this.clock() && newEvent.time >= this.clock()){

                            if (this.displayShapes().has(previousEvent.shape)){
                                return
                            }

                            this.aggregateModels.displayShapes.content.add(previousEvent.shape)
                            this.addModel("displayShapes",previousEvent.shape)
                        } else if (previousEvent.time >= this.clock() && newEvent.time <= this.clock()){

                            if (!this.displayShapes().has(previousEvent.shape)){
                                return
                            }

                            this.aggregateModels.displayShapes.content.delete(previousEvent.shape)
                            this.removeModel("displayShapes",previousEvent.shape)
                        }
                        return
                }

                console.error("Unrecognised event type",previousEvent.type)
            }
        }

        console.error("Attempted to update event but previous event was not in event list",this.timelineEvents(),previousEvent,newEvent)

    }

    removeShapeFromTimeline(shape){

        const remainingEvents = []

        for (const timeLineEvent of this.timelineEvents()) {
            if (timeLineEvent.shape === shape) {
                this.removeModel("timelineEvents",timeLineEvent)
            } else {
                remainingEvents.push(timeLineEvent)
            }
        }

        this.aggregateModels.timelineEvents.content = remainingEvents

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

    unsubscribeFromInputs(subscriber){

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
}

export const controller = new controllerClass()
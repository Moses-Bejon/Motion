import {controller} from "../controller.js";

export class KeyboardInputsManager {

    constructor() {
        // ordered list of views that hear about keyboard inputs
        // the higher in the hierarchy, the more likely informed (more "in focus")
        this.inputSubscribersHierarchy = []

        this.keysDown = new Set()

        document.addEventListener("keydown",this.keyDown.bind(this))
        document.addEventListener("keyup",this.keyUp.bind(this))
    }

    newFocus(focus){

        try {
            // indicating to the previous focus to clean stuff up as they have lost focus
            this.inputSubscribersHierarchy[0]?.loseFocus()
        } catch (e) {
            console.error(e)
        }

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

        try {
            // focus should always be set when a user clicks on a window
            subscriber.addFunctionToPerformOnClick(() => {
                this.setFocus(subscriber)
            })
        } catch (e){
            console.error(e)
        }

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

        // if the user is holding down a key, we don't need to fire the event again
        if (this.keysDown.has(event.key)){
            return
        }

        this.keysDown.add(event.key)

        if (event.ctrlKey || event.metaKey){

            if (((event.key === "z" || event.key === "Z") && event.shiftKey) || (event.key === "y" || event.key === "Y")){
                controller.historyManager.redoAction()
                return
            }
            
            if (event.key === "z" || event.key === "Z"){
                controller.historyManager.undoAction()
                return
            }
            
            if (event.key === "s" || event.key === "S"){
                controller.saveFile(rootWindow.save())
                event.preventDefault()
                return
            }
        }

        if (event.key === "a"){
            console.log("a from controller")
        }

        // find active element
        let activeElement = document.activeElement
        while (activeElement.shadowRoot) {
            activeElement = activeElement.shadowRoot.activeElement
        }

        // if the active element is a text input it gets priority
        if (activeElement.tagName === "INPUT" && (activeElement.type === "text" || activeElement.type === "number")){
            return
        }

        try {
            // item that is being hovered over is the top priority for inputs
            if (this.hoveringOver?.acceptKeyDown(event)) {
                event.preventDefault()

                // once a view has accepted an input, it goes to the top of the hierarchy
                // this means it is second in line when a user moves on to hover over something else
                this.setFocus(this.hoveringOver)
                return
            }
        } catch (e) {
            console.error(e)
        }

        // find top subscriber in hierarchy who accepts the input
        for (const inputSubscriber of this.inputSubscribersHierarchy){
            try {
                if (inputSubscriber.acceptKeyDown(event)) {

                    // if we are accepting a keyboard input, using it as an input, we don't want the browser doing the same
                    event.preventDefault()

                    this.setFocus(inputSubscriber)
                    return
                }
            } catch (e){
                console.error(e)
            }
        }
    }

    keyUp(event){

        this.keysDown.delete(event.key)

        try {
            if (this.hoveringOver?.acceptKeyUp(event)) {
                event.preventDefault()

                this.setFocus(this.hoveringOver)
                return
            }
        } catch (e){
            console.error(e)
        }

        for (const inputSubscriber of this.inputSubscribersHierarchy){
            try {
                if (inputSubscriber.acceptKeyUp(event)){
                    event.preventDefault()

                    this.setFocus(inputSubscriber)
                    return
                }
            } catch (e){
                console.error(e)
            }
        }
    }
}
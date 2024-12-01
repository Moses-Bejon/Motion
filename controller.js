class controllerClass{
    constructor() {

        // ordered list of views that hear about keyboard inputs
        // the higher in the hierarchy, the more likely informed (more "in focus")
        this.inputSubscribersHierarchy = []

        document.addEventListener("keydown",this.keyDown.bind(this))
        document.addEventListener("keyup",this.keyUp.bind(this))
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
        subscriber.onclick = () => {this.setFocus(subscriber)}

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
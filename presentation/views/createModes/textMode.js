import {controller} from "../../../controller.js";
import {buttonSelectedColour, fontFamily, fontSizeInt} from "../../../constants.js";

export class TextMode {
    constructor(createCanvas) {
        this.createCanvas = createCanvas

        this.createCanvas.main.onclick = this.createTextBox.bind(this)

        this.ourButton = this.createCanvas.shadowRoot.getElementById("text")

        // indicate we are now in text mode to user
        this.ourButton.style.backgroundColor = buttonSelectedColour
    }

    static acceptKeyDownOnShape(keyboardEvent,shape){

        const key = keyboardEvent.key

        switch (key){
            // removes last letter of text
            case "Backspace":
                controller.beginAction()
                controller.takeStep("newText",[shape,shape.text.slice(0,-1)])
                controller.endAction()
                return true
        }

        // this removes stuff like alt or shift
        if (key.length !== 1){
            return false
        }

        // if the default text has been replaced, add on to text
        // otherwise, replace the default text
        if (shape.defaultTextReplaced){
            controller.beginAction()
            controller.takeStep("newText",[shape,shape.text+key])
            controller.endAction()
        } else {
            controller.beginAction()
            controller.takeStep("newText",[shape,key])
            controller.endAction()
        }
        return true
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){
        this.createCanvas.main.onclick = null

        // deselects text once done
        controller.getSelectedShapesManager().selectNewShapes(new Set())

        // remove text mode indication
        this.ourButton.style.backgroundColor = null
    }

    createTextBox(pointerEvent){

        const [start,end] = this.createCanvas.timeToShapeAppearanceDisappearanceTime(controller.clock())

        controller.beginAction()
        controller.takeStep("createText",
            [start, end,
                this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),
                0, "#000000",fontSizeInt,fontFamily])

        // controller returns the textShape it created
        controller.endAction().then(([textShape]) => {
            controller.getSelectedShapesManager().selectNewShapes(new Set([textShape]))
        })
    }
}
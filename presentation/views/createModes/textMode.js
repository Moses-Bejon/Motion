import {controller} from "../../../controller.js";
import {buttonSelectedColour, fontFamily, fontSizeInt} from "../../../globalValues.js";
import {subtractSets} from "../../../maths.js";

export class TextMode {
    constructor(createCanvas) {
        this.createCanvas = createCanvas

        this.createCanvas.canvas.onclick = this.createTextBox.bind(this)

        this.ourButton = this.createCanvas.shadowRoot.getElementById("text")

        // indicate we are now in text mode to user
        this.ourButton.style.backgroundColor = buttonSelectedColour
    }

    static acceptKeyDownOnShape(keyboardEvent,shape){

        const key = keyboardEvent.key

        switch (key){
            // removes last letter of text
            case "Backspace":
                shape.geometryAttributeUpdate("text",shape.text.slice(0,-1))
                shape.defaultTextReplaced = true
                return true
        }

        // this removes stuff like alt or shift
        if (key.length !== 1){
            return false
        }

        // if the default text has been replaced, add on to text
        // otherwise, replace the default text
        if (shape.defaultTextReplaced){
            shape.geometryAttributeUpdate("text",shape.text+key)
        } else {
            shape.defaultTextReplaced = true
            shape.geometryAttributeUpdate("text",key)
        }
        return true
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){
        this.createCanvas.canvas.onclick = null

        // deselects text once done
        controller.getSelectedShapesManager().selectNewShapes(new Set())

        // remove text mode indication
        this.ourButton.style.backgroundColor = null
    }

    createTextBox(pointerEvent){

        const [start,end] = this.createCanvas.timeToShapeAppearanceDisappearanceTime(controller.clock())

        const previousShapes = new Set(controller.allShapes())

        controller.beginAction()
        controller.takeStep("createText",
            [start, end,
                this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),
                0, "#000000",fontSizeInt,fontFamily])
        controller.endAction()

        const newShapes = subtractSets(previousShapes,controller.allShapes())

        for (const shape of newShapes){
            // select the text box by default at creation (to allow the user to type in it)
            controller.getSelectedShapesManager().selectNewShapes(new Set([textShape]))
        }

        // this is the price we pay for not having the view create the model
    }
}
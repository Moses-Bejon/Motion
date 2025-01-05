import {text} from "../../../model/text.js";
import {animationEndTimeSeconds} from "../../../constants.js";
import {controller} from "../../../controller.js";

export class textMode{
    constructor(createCanvas) {
        this.createCanvas = createCanvas

        this.createCanvas.canvas.onclick = this.createTextBox.bind(this)
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
        controller.newAggregateModel("selectedShapes",new Set([]))
    }

    createTextBox(pointerEvent){

        const textShape = new text(
            0,
            animationEndTimeSeconds,
            this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY),
            0,
            "black"
        )

        controller.newShape(textShape)

        // select the text box by default at creation (to allow the user to type in it)
        controller.newAggregateModel("selectedShapes",new Set([textShape]))
    }
}
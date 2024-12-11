import {fontFamily, fontSize} from "../../../constants.js";

export class textMode{
    constructor(createCanvas) {
        this.createCanvas = createCanvas

        this.createCanvas.canvas.onclick = this.createTextBox.bind(this)
    }

    acceptKeyDown(keyboardEvent){
        return false
    }

    switchMode(){
        this.createCanvas.canvas.onclick = null
    }

    createTextBox(pointerEvent){
        this.currentShape = document.createElementNS("http://www.w3.org/2000/svg","g")
        this.createCanvas.canvas.appendChild(this.currentShape)

        this.text = document.createElementNS("http://www.w3.org/2000/svg","text")

        const position = this.createCanvas.toCanvasCoordinates(pointerEvent.clientX,pointerEvent.clientY)

        this.text.setAttribute("x",position[0])
        this.text.setAttribute("y",position[1])

        this.text.style.font = fontFamily
        this.text.style.fontSize = fontSize

        this.text.innerHTML = "Is this working?"

        this.currentShape.appendChild(this.text)
        this.createCanvas.canvas.appendChild(this.currentShape)
    }
}
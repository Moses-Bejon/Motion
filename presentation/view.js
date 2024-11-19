// all views, like canvas, timeline etc. inherit from this class

import {abstractWindow} from "./window.js"

// All types of window listed here can be switched to by a user
// The data is of the form {"name displayed to user":"type of window I should create"}
const typesOfWindow = {
    "view":"abstract-view",
    "horizontallySplit":"horizontally-split-window",
    "verticallySplit":"vertically-split-window"
}

const template = document.createElement("template")
template.innerHTML = `
<style>
#fullScreenAndDropDownContainer{
    background-color: darkgray;
    width: 60px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
}
#fullScreenButton{
    border: 5px solid;
    width: 10px;
    height: 10px;
    border-radius: 10%;
}
#switchWindowDropDownContainer{
    width: 20px;
    height: 20px;
}
#switchWindowDropDown{

    /*The opacity is 0 so it does not show up, as the fake dropdown UI is being used*/
    opacity: 0;
    
    width: 20px;
    height: 20px;
    background-color: transparent;
    border: none;
    outline: none;
    position: absolute;
}
#fakeDropDown{
    width: 20px;
    height: 20px;
    position: absolute;
}
</style>
<div id="fullScreenAndDropDownContainer">
    <div id="fullScreenButton"></div>
    <div id="switchWindowDropDownContainer">
        <!-- This SVG is a triangle -->
        <svg id="fakeDropDown" viewBox="0 0 1 1">
            <polygon points="0, 0, 0.5, 1, 1, 0">
        </svg>
        <select id="switchWindowDropDown"></select>
    </div>
</div>
`

export class abstractView extends abstractWindow{
    constructor() {
        super()

        this.attachShadow({mode:"open"})

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        const switchWindowDropDown = this.shadowRoot.getElementById("switchWindowDropDown")

        for (const [windowName,windowType] of Object.entries(typesOfWindow)){
            const option = document.createElement("option")
            option.innerText = windowName
            option.value = windowType
            switchWindowDropDown.appendChild(option)
        }

        switchWindowDropDown.onchange = () => {
            this.switchWindowTo(document.createElement(switchWindowDropDown.value))
        }

        this.shadowRoot.getElementById("fullScreenButton").onclick = () => {
            this.fullScreen(this)
        }

    }
}
window.customElements.define("abstract-view",abstractView)
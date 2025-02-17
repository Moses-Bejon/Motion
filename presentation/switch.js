import {fontFamily, fontSize} from "../globalValues.js";

const template = document.createElement("template")

template.innerHTML = `
<style>
    #switch{
        display: flex;
        justify-content: space-around;
        background-color: black;
        
        margin: 1%;
        height: 30px;
        
        cursor: pointer;
    }
    #off,#on{
        width: 40%;
        
        text-align: center;
        line-height: 30px;
        user-select: none;
        
        font-family: ${fontFamily};
        font-size: ${fontSize};
    }
</style>
<div id="switch">
    <div id="off"></div>
    <div id="on"></div>
</div>
`

export class switchElement extends HTMLElement{
    static observedAttributes = ["off-text","on-text"]

    constructor(){
        super()

        this.attachShadow({mode:"open"})
        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.off = this.shadowRoot.getElementById("off")
        this.on = this.shadowRoot.getElementById("on")

        // by default, we are in our off state
        this.turnOff()
        this.currentlyOn = false
        this.onclick = this.turnOn
    }

    attributeChangedCallback(name,oldValue,newValue){
        if (name === "off-text") {
            this.off.innerText = newValue
        } else if (name === "on-text"){
            this.on.innerText = newValue
        }
    }

    turnOn(){
        this.off.style.backgroundColor = "black"
        this.off.style.color = "white"
        this.on.style.backgroundColor = "lightGray"
        this.on.style.color = "black"

        this.onclick = this.turnOff

        this.onCallback?.()

        this.currentlyOn = true
    }

    turnOff(){
        this.off.style.backgroundColor = "lightGray"
        this.off.style.color = "black"
        this.on.style.backgroundColor = "black"
        this.on.style.color = "white"

        this.onclick = this.turnOn

        this.offCallback?.()

        this.currentlyOn = false
    }
}

window.customElements.define("switch-element",switchElement)
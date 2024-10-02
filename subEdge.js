const template = document.createElement("template")

template.innerHTML = `
<div id="subEdge" style="width: 100%; height: 100%"></div>
`

export class subEdge extends HTMLElement{
    constructor() {
        super()
    }

    connectedCallback(){
        this.attachShadow({mode:"open"})
        this.shadowRoot.appendChild(template.content.cloneNode(true))
    }
}

window.customElements.define("sub-edge",subEdge)
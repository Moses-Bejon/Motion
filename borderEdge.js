export class borderEdge extends HTMLElement{
    static observedAttributes = ["type"]

    constructor() {
        super()
    }

    connectedCallback(){
        this.attachShadow({mode:"open"})
        //this.shadowRoot.appendChild(template.content.cloneNode(true))
    }

    attributeChangedCallback(name,oldValue,newValue){

        // type determines whether or not this sub-borderEdge is on the left/right sides or top/bottom sides
        if (name === "type"){
            if (newValue === "vertical"){

                // this.start, this.end and this.thickness hold what attribute
                // should be changed when the start, end or thickness of a sub-borderEdge changes
                this.start = "top"
                this.end = "bottom"
                this.thickness = "width"
            } else if (newValue === "horizontal") {
                this.start = "left"
                this.end = "right"
                this.thickness = "height"
            }
        }
    }


}

window.customElements.define("border-edge",borderEdge)
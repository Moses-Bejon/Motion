export function addDragLogicTo(element,drag,endDrag){
    element.onmousedown = (mouseEvent) => {

        // prevents the document attempting to drag the div/highlight text/other default behaviour
        // while user is dragging edge
        mouseEvent.preventDefault()
        drag(mouseEvent)

        document.addEventListener("mousemove",drag)

        document.addEventListener("mouseup", (mouseEvent) => {
            endDrag(mouseEvent)
            document.removeEventListener("mousemove",drag)
        },{
            once: true
        })
    }
}

export function addCreateLogicTo(element,create){
    element.onmousedown = (mouseEvent) => {
        mouseEvent.preventDefault()

        const newElement = create(mouseEvent)
        newElement.drag(mouseEvent)

        document.addEventListener("mousemove",newElement.drag)

        document.addEventListener("mouseup",(mouseEvent) => {
            newElement.endDrag(mouseEvent)
            document.removeEventListener("mousemove",newElement.drag)
        },{
            once: true
        })
    }
}
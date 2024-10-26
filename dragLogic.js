// anything draggable uses functions from this file

export function addDragLogicTo(element,drag,endDrag){
    element.onpointerdown = (pointerEvent) => {

        // prevents the document attempting to drag the div/highlight text/other default behaviour
        // while user is dragging edge
        pointerEvent.preventDefault()
        drag(pointerEvent)

        document.addEventListener("pointermove",drag)

        document.addEventListener("pointerup", (pointerEvent) => {
            endDrag(pointerEvent)
            document.removeEventListener("pointermove",drag)
        },{
            once: true
        })
    }
}

export function addCreateLogicTo(element,create){
    element.onpointerdown = (pointerEvent) => {
        pointerEvent.preventDefault()

        const newElement = create(pointerEvent)
        newElement.drag(pointerEvent)

        document.addEventListener("pointermove",newElement.drag)

        document.addEventListener("pointerup",(pointerEvent) => {
            newElement.endDrag(pointerEvent)
            document.removeEventListener("pointermove",newElement.drag)
        },{
            once: true
        })
    }
}
// anything draggable uses functions from this file

export function addDragLogicTo(element,drag,endDrag,beginDrag=()=>{},cursorHover = "grab",cursor = "grabbing"){
    element.style.cursor = cursorHover
    element.onpointerdown = (pointerEvent) => {
        beginDrag(pointerEvent)
        beginDragging(drag,endDrag,pointerEvent,cursor)
    }
}

export function addCreateLogicTo(element,create,cursorHover = "grab",cursor = "grabbing"){
    element.style.cursor = cursorHover
    element.onpointerdown = (pointerEvent) => {
        const newElement = create(pointerEvent)

        beginDragging(newElement.drag,newElement.endDrag,pointerEvent,cursor)
    }
}

function beginDragging(drag,endDrag,pointerEvent,cursor){

    // prevents the document attempting to drag the div/highlight text/other default behaviour
    // while user is dragging edge
    pointerEvent.preventDefault()

    const overRideElement = document.createElement("div")
    overRideElement.style.position = "fixed"
    overRideElement.style.inset = "0"
    overRideElement.style.zIndex = "10"

    document.body.appendChild(overRideElement)

    overRideElement.style.cursor = cursor

    drag(pointerEvent)

    document.addEventListener("pointermove",drag)
    document.addEventListener("pointerup",(pointerEvent) => {

        /* This try catch avoids the catastrophic scenario that an error occurs when the user is finished dragging
        and they get stuck in an infinite drag, unable to escape, because every time they try to end the code gets
        stuck here */
        try {
            endDrag(pointerEvent)
        } catch (error){
            console.error(error)
        }

        overRideElement.remove()
        document.removeEventListener("pointermove",drag)
    },{
        once: true
    })
}
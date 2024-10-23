export function addDragLogicTo(element,drag){
    element.onmousedown = (mouseEvent) => {
        mouseEvent.preventDefault()
        drag(mouseEvent)

        document.addEventListener("mousemove",drag)

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove",drag)
        },{
            once: true
        })
    }
}
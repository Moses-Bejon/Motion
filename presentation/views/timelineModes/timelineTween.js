export class timelineTween{
    constructor(parentTimeline,timelineContainer) {
        this.parentTimeline = parentTimeline
        this.timelineContainer = timelineContainer

        this.receivedStart = false
        this.receivedEnd = false
    }

    receiveStart(start){
        this.receivedStart = true
        this.start = start

        this.startNode = document.createElement("div")
        this.startNode.className = "eventToken"
        this.startNode.style.backgroundColor = this.start.colour
        this.startPositionPercent = this.parentTimeline.timeToTimelinePosition(this.start.time)*100
        this.startNode.style.left = this.startPositionPercent + "%"

        if (this.receivedEnd){
            this.finaliseTween()
        }
    }

    receiveEnd(end){
        this.receivedEnd = true
        this.end = end

        this.endNode = document.createElement("div")
        this.endNode.className = "eventToken"
        this.endPositionPercent = this.parentTimeline.timeToTimelinePosition(this.end.time)*100
        this.endNode.style.left = this.endPositionPercent + "%"

        if (this.receivedStart){
            this.finaliseTween()
        }
    }

    finaliseTween(){
        this.endNode.style.backgroundColor = this.start.colour

        this.connector = document.createElement("div")
        this.connector.className = "tweenConnector"
        this.connector.style.left = this.startPositionPercent + "%"
        this.connector.style.right = (100-this.endPositionPercent) + "%"
        this.connector.style.backgroundColor = this.start.colour

        this.timelineContainer.appendChild(this.startNode)
        this.timelineContainer.appendChild(this.endNode)
        this.timelineContainer.appendChild(this.connector)
    }
}
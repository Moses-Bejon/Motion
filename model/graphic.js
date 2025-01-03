import {shape} from "./shape.js";

export class graphic extends shape{
    constructor(appearanceTime,disappearanceTime,centre,rotation){
        super(appearanceTime,disappearanceTime)

        this.centre = centre
        this.rotation = rotation
    }

    // as loading up a new image source can take a while, it is separate from the update geometry and constructor logic
    loadImageSource(source){
        const fileReader = new FileReader()
        fileReader.readAsDataURL(source)

        return new Promise((resolve) => {
            fileReader.onload = () => {
                this.image = document.createElementNS("http://www.w3.org/2000/svg","image")
                this.image.setAttribute("href",fileReader.result)

                this.width = this.image.width
                this.height = this.image.height

                this.updateGeometry()

                resolve()
            }
        })
    }

    getTop(){
        return this.centre[1] - this.height/2
    }

    getBottom(){
        return this.centre[1] + this.height/2
    }

    getLeft(){
        return this.centre[0]-this.width/2
    }

    getRight(){
        return this.centre[0] + this.width/2
    }

    updateGeometry(){
        const group = document.createElementNS("http://www.w3.org/2000/svg","g")

        const clonedImage = this.image.cloneNode(false)

        clonedImage.style.width = this.width
        clonedImage.style.height = this.height
        clonedImage.setAttribute("x",this.centre[0])
        clonedImage.setAttribute("y",this.centre[1])

        group.appendChild(clonedImage)

        this.geometry = group.innerHTML
    }
}
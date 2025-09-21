import {controller} from "../../controller.js";
import {Canvas} from "./canvas.js";
import {
    typicalIconSizeInt,
    fontSize,
    fontFamily
}from "../../constants.js";
import {fontsCSS} from "../../fontsCSS.js";
import {downloadFile} from "../../fileUitilities/fileUserInteraction.js";

const serializer = new XMLSerializer()
const DOMURL = self.URL || self.webkitURL || self
const frame = new Image()

const template = document.createElement("template")
template.innerHTML = `
    <style>
         #buttonsContainer{
            position: relative;
            left: ${typicalIconSizeInt * 2}px;
            height: ${typicalIconSizeInt}px;
            display: flex;
            gap: 10px;
            align-items: center;
            font-family: ${fontFamily};
            font-size: ${fontSize};
        }
        #renderAnimationButton,#renderFrameButton{
            cursor: pointer;
        }
    </style>
    <div id="buttonsContainer">
        <button id="renderAnimationButton"></button>
        <button id="renderFrameButton">Render current frame</button>
        <label for="fpsInput">FPS: </label>
        <input type="number" id="fpsInput" min="1" max="120" value="30">
    </div>
`

export class Renderer extends Canvas{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.fps = this.shadowRoot.getElementById("fpsInput")

        this.renderAnimationButton = this.shadowRoot.getElementById("renderAnimationButton")
        this.restoreRenderAnimationButton()
        this.shadowRoot.getElementById("renderFrameButton").onpointerdown = () => {
            downloadFile(this.getSVGURL(),"animation frame")
        }
    }

    connectedCallback() {
        super.connectedCallback()

        // ensures the background is white when we render the animation
        const background = document.createElementNS("http://www.w3.org/2000/svg","rect")
        background.setAttribute("x",0)
        background.setAttribute("y",0)
        background.setAttribute("width",controller.canvasWidth())
        background.setAttribute("height",controller.canvasHeight())
        background.setAttribute("stroke", "white")
        background.setAttribute("fill", "white")
        this.canvas.prepend(background)

        // this could be optimised in the future by only loading fonts that are actually used
        // (rather than all of them every time)
        fontsCSS.then(css => {
            const fonts = document.createElementNS("http://www.w3.org/2000/svg","defs")
            fonts.innerHTML = "<style>" + css + "</style>"
            this.canvas.prepend(fonts)
        })
    }

    disconnectedCallback(){

        // clean stuff up when we get disconnected from the DOM
        this.loseFocus()

        // cancels the current renderAnimation (since it's an async function)
        this.renderCancelled = true

        super.disconnectedCallback()
    }

    save(){
        return {"windowType":"renderer"}
    }

    load(save){

    }

    restoreRenderAnimationButton(){
        this.renderAnimationButton.onpointerdown = this.renderAnimation.bind(this)
        this.renderAnimationButton.textContent = "Render animation"
    }

    async renderAnimation(){
        const fps = parseFloat(this.fps.value)

        if (isNaN(fps) || fps < 1 || fps > 120){
            alert("Please enter a valid fps between 1 and 120")
            return
        }

        this.renderAnimationButton.onpointerdown = () => {
            this.renderCancelled = true
        }
        this.renderAnimationButton.textContent = "Cancel render"

        this.renderCancelled = false
        const now = controller.clock()

        let muxer = new Mp4Muxer.Muxer({
            target: new Mp4Muxer.ArrayBufferTarget(),
            video: {
                codec: 'avc',
                width: controller.canvasWidth(),
                height: controller.canvasHeight()
            },
            fastStart: 'in-memory'
        })

        this.videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: error => console.error(error)
        })
        this.videoEncoder.configure({
            codec: 'avc1.42001f',
            width: controller.canvasWidth(),
            height: controller.canvasHeight(),
            bitrate: 1e6
        })

        const timePerFrame = 1/fps
        const timePerTimestamp = Math.round(1000000/fps)

        const numberOfFrames = Math.trunc(controller.animationEndTime()*fps)

        // go to start of animation
        controller.beginAction()
        controller.takeStep("goToTime",[0])
        await controller.endAction()

        for (let i = 0; i<numberOfFrames;i++){
            if (this.renderCancelled){
                break
            }

            controller.beginAction()
            controller.takeStep("goToTime",[i*timePerFrame])
            await controller.endAction()

            await this.captureFrame(timePerTimestamp*i,timePerTimestamp)
        }

        if (!this.renderCancelled) {

            await this.videoEncoder.flush()
            muxer.finalize()

            let {buffer} = muxer.target // Buffer contains final MP4 file

            const videoUrl = URL.createObjectURL(new Blob([buffer], {type: 'video/mp4'}))

            downloadFile(videoUrl,"animation render")
        }

        controller.beginAction()
        controller.takeStep("goToTime",[now])
        await controller.endAction()
        this.restoreRenderAnimationButton()
    }

    async captureFrame(timeStamp,duration){

        // fun fact, it's actually faster to recreate the canvas each time from scratch than it is to clone the node
        const canvas = document.createElement("canvas")
        canvas.width = controller.canvasWidth()
        canvas.height = controller.canvasHeight()
        const ctx = canvas.getContext("2d")

        frame.src = this.getSVGURL()

        return new Promise((resolve) => {
            frame.onload = () => {
                ctx.drawImage(frame,0,0,controller.canvasWidth(),controller.canvasHeight())
                const videoFrame = new VideoFrame(canvas, { timestamp: timeStamp, duration: duration, alpha: "keep"})
                this.videoEncoder.encode(videoFrame)
                videoFrame.close()

                resolve()
            }
        })
    }

    getSVGURL(){
        const svgString = serializer.serializeToString(this.canvas)

        const svgBinary = new Blob([svgString],{type:"image/svg+xml;charset=utf-8"})

        return DOMURL.createObjectURL(svgBinary)
    }

    // here for polymorphic reasons
    loseFocus(){
    }
}

window.customElements.define("renderer-window",Renderer)
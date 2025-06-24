import {controller} from "../../controller.js";
import {canvas} from "./canvas.js";
import {
    animationEndTimeSeconds,
    canvasHeight,
    canvasWidth,
    typicalIconSizeInt,
    fontSize,
    fontFamily
}from "../../globalValues.js";
import {fontsCSS} from "../../fontsCSS.js";

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

export class renderer extends canvas{
    constructor() {
        super()

        this.shadowRoot.appendChild(template.content.cloneNode(true))

        this.fps = this.shadowRoot.getElementById("fpsInput")

        this.renderAnimationButton = this.shadowRoot.getElementById("renderAnimationButton")
        this.restoreRenderAnimationButton()
        this.shadowRoot.getElementById("renderFrameButton").onpointerdown = () => {
            controller.downloadFile(this.getSVGURL(),"animation frame")
        }
    }

    connectedCallback() {
        super.connectedCallback()

        // ensures the background is white when we render the animation
        const background = document.createElementNS("http://www.w3.org/2000/svg","rect")
        background.setAttribute("x",0)
        background.setAttribute("y",0)
        background.setAttribute("width",canvasWidth)
        background.setAttribute("height",canvasHeight)
        background.setAttribute("stroke", "white")
        background.setAttribute("fill", "white")
        this.canvas.prepend(background)

        // this could be optimised in the future by only loading fonts that are actually used
        // (rather than all of them every time)
        fontsCSS.then(css => {
            const fonts = document.createElementNS("http://www.w3.org/2000/svg","defs")
            fonts.innerHTML = css
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
        this.renderAnimationButton.innerText = "Render animation"
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
        this.renderAnimationButton.innerText = "Cancel render"

        this.renderCancelled = false
        const now = controller.clock()

        let muxer = new Mp4Muxer.Muxer({
            target: new Mp4Muxer.ArrayBufferTarget(),
            video: {
                codec: 'avc',
                width: canvasWidth,
                height: canvasHeight
            },
            fastStart: 'in-memory'
        })

        this.videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: error => console.error(error)
        })
        this.videoEncoder.configure({
            codec: 'avc1.42001f',
            width: canvasWidth,
            height: canvasHeight,
            bitrate: 1e6
        })

        const timePerFrame = 1/fps
        const timePerTimestamp = Math.round(1000000/fps)

        const numberOfFrames = Math.trunc(animationEndTimeSeconds*fps)

        // no onion skins in render please
        controller.onionSkinsOff()

        // go to start of animation
        controller.goBackwardToTime(0)

        for (let i = 0; i<numberOfFrames;i++){
            if (this.renderCancelled){
                break
            }

            controller.goForwardToTime(i*timePerFrame)

            await this.captureFrame(timePerTimestamp*i,timePerTimestamp)
        }

        // telling the clock it is now at the end of the animation
        controller.aggregateModels.clock.content = (numberOfFrames-1)*timePerFrame

        if (!this.renderCancelled) {

            await this.videoEncoder.flush()
            muxer.finalize()

            let {buffer} = muxer.target // Buffer contains final MP4 file

            const videoUrl = URL.createObjectURL(new Blob([buffer], {type: 'video/mp4'}))

            controller.downloadFile(videoUrl,"animation render")
        }

        controller.onionSkinsOn()
        controller.newClockTime(now)
        this.restoreRenderAnimationButton()
    }

    async captureFrame(timeStamp,duration){

        // fun fact, it's actually faster to recreate the canvas each time from scratch than it is to clone the node
        const canvas = document.createElement("canvas")
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext("2d")

        frame.src = this.getSVGURL()

        return new Promise((resolve) => {
            frame.onload = () => {
                ctx.drawImage(frame,0,0,canvasWidth,canvasHeight)
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

window.customElements.define("renderer-window",renderer)
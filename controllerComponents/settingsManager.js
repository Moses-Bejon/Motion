import {controller} from "../controller.js";
import {replaceRootWindowWithSave} from "../rootWindowOperations.js";
import {typicalIconSize} from "../constants.js";

export class SettingsManager {
    constructor() {
        this.canvasWidth = 960
        this.canvasHeight = 540
        this.animationEndTimeSeconds = 10
        this.defaultTweenLength = 0.2

        // this is coupled to model.js where half of it is the default start time
        this.timelineSnapLength = 0.2

        this.lineSimplificationEpsilon = 1
        this.onionSkinTimeGap = 0.2
        this.onionSkinsOn = false
        this.autoAddToTimeline = false
        this.penCursor = false

        this.penCursorImage = document.createElement("img")
        this.penCursorImage.src = "assets/pen.svg"

        this.penCursorImage.style.position = "absolute"
        this.penCursorImage.style.width = typicalIconSize
        this.penCursorImage.style.height = typicalIconSize
        this.penCursorImage.style.display = "none"
        this.penCursorImage.style.zIndex = "8"
        this.penCursorImage.style.transform = "translate(0, -100%)"

        document.body.appendChild(this.penCursorImage)

        this.updatePenCursor = (pointerEvent) => {
            this.penCursorImage.style.left = pointerEvent.clientX + "px"
            this.penCursorImage.style.top = pointerEvent.clientY + "px"
        }
    }

    static load(save){
        const settingsManager = new SettingsManager()

        settingsManager.canvasWidth = save.canvasWidth
        settingsManager.canvasHeight = save.canvasHeight
        settingsManager.animationEndTimeSeconds = save.animationEndTimeSeconds
        settingsManager.defaultTweenLength = save.defaultTweenLength
        settingsManager.timelineSnapLength = save.timelineSnapLength
        settingsManager.lineSimplificationEpsilon = save.lineSimplificationEpsilon
        settingsManager.onionSkinTimeGap = save.onionSkinTimeGap
        settingsManager.onionSkinsOn = save.onionSkinsOn
        settingsManager.autoAddToTimeline = save.autoAddToTimeline
        settingsManager.setPenCursor(save.penCursor)

        return settingsManager
    }

    updateSettings(){
        const viewsSave = window.rootWindow.save()
        replaceRootWindowWithSave(viewsSave)
    }

    getCanvasWidth() {
        return this.canvasWidth
    }

    setCanvasWidth(newWidth) {
        this.canvasWidth = newWidth
        this.updateSettings()
    }

    getCanvasHeight() {
        return this.canvasHeight
    }

    setCanvasHeight(newHeight) {
        this.canvasHeight = newHeight
        this.updateSettings()
    }

    getSnappingDistance(){
        return Math.hypot(this.canvasHeight,this.canvasWidth)/100
    }

    getAnimationEndTimeSeconds() {
        return this.animationEndTimeSeconds
    }

    setAnimationEndTimeSeconds(newTime) {

        if (controller.clock() > newTime){
            controller.beginAction()
            controller.takeStep("goToTime",[newTime])
            controller.endAction()
        }

        this.animationEndTimeSeconds = newTime
        this.updateSettings()
    }

    getDefaultTweenLength() {
        return this.defaultTweenLength
    }

    setDefaultTweenLength(newTweenLength) {
        this.defaultTweenLength = newTweenLength
        this.updateSettings()
    }

    getTimelineSnapLength() {
        return this.timelineSnapLength
    }

    setTimelineSnapLength(newSnapLength) {
        this.timelineSnapLength = newSnapLength
        this.updateSettings()
    }

    getLineSimplificationEpsilon() {
        return this.lineSimplificationEpsilon
    }

    setLineSimplificationEpsilon(newLineSimplificationEpsilon) {
        this.lineSimplificationEpsilon = newLineSimplificationEpsilon
        this.updateSettings()
    }

    getOnionSkinTimeGap() {
        return this.onionSkinTimeGap
    }

    setOnionSkinTimeGap(newOnionSkinTimeGap) {
        this.onionSkinTimeGap = newOnionSkinTimeGap
        this.updateSettings()
        controller.onionSkinsManager.updateOnionSkins()
    }

    getOnionSkinsOn() {
        return this.onionSkinsOn
    }

    setOnionSkinsOn(newOnionSkinsOn) {
        this.onionSkinsOn = newOnionSkinsOn
        this.updateSettings()
        controller.onionSkinsManager.updateOnionSkins()
    }

    getAutoAddToTimeline() {
        return this.autoAddToTimeline
    }

    setAutoAddToTimeline(newAutoAddToTimeline) {
        this.autoAddToTimeline = newAutoAddToTimeline
        this.updateSettings()
    }

    getPenCursor() {
        return this.penCursor
    }

    setPenCursor(newPenCursor) {
        this.penCursor = newPenCursor

        if (this.penCursor){
            this.penCursorImage.style.display = "block"
            document.addEventListener("pointermove",this.updatePenCursor)
        } else {
            this.penCursorImage.style.display = "none"
            document.removeEventListener("pointermove",this.updatePenCursor)
        }
    }

    save(){
        return {
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            animationEndTimeSeconds: this.animationEndTimeSeconds,
            defaultTweenLength: this.defaultTweenLength,
            timelineSnapLength: this.timelineSnapLength,
            lineSimplificationEpsilon: this.lineSimplificationEpsilon,
            onionSkinTimeGap: this.onionSkinTimeGap,
            onionSkinsOn: this.onionSkinsOn,
            autoAddToTimeline: this.autoAddToTimeline,
            penCursor: this.penCursor,
        }
    }
}
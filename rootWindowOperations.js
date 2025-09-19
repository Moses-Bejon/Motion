import {AbstractWindow} from "./presentation/window.js";

// for very complicated reasons, this needs to be in a separate file

// (basically this function needs to be run by settingsManager.js, and if it is defined in index.js (the logical place)
// then when settingManager is loaded it will load index.js and index.js will run commands on create-edit-canvas es
// before window.customElements.define is called by createEditCanvas.js, for this reason nobody can import index.js
// so it is defined here instead)

export function replaceRootWindowWithSave(save){
    // collapse root window into single window
    while (true){
        if (window.rootWindow.constructor.name === "HorizontallySplitWindow"){
            window.rootWindow.collapseLeftWindow()
        } else if (window.rootWindow.constructor.name === "VerticallySplitWindow"){
            window.rootWindow.collapseTopWindow()
        } else {
            break
        }
    }

    window.rootWindow.switchWindowTo(AbstractWindow.loadWindow(save))
    window.rootWindow.load(save)
}
export function downloadFile(fileURL,fileName){
    const downloadLink = document.createElement('a')
    downloadLink.href = fileURL
    downloadLink.download = fileName
    document.body.appendChild(downloadLink)

    // trigger download automatically
    downloadLink.click()

    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(downloadLink.href)
}

export function readJSONFile(JSONFile){
    const fileReader = new FileReader()

    return new Promise((resolve, reject) => {
        fileReader.onload = () => {
            try {
                resolve(JSON.parse(fileReader.result))
            } catch (error) {
                reject(error)
            }
        }
        fileReader.onerror = () => reject(fileReader.error)
        fileReader.readAsText(JSONFile)
    })
}

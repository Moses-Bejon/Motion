// loads fonts from google's API to allow the renderer to access them

const fontUrl = "https://fonts.googleapis.com/css2?family=Balsamiq+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Comic+Neue:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Coming+Soon&family=Doto:wght@100..900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Jolly+Lodger&family=Modern+Antiqua&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Pangolin&family=Playwrite+NG+Modern:wght@100..400&family=Roboto:ital,wght@0,100..900;1,100..900&family=Sofia&family=Tiny5&family=Yellowtail&family=Zilla+Slab:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap";

async function getFontsCSS(){
    const fileReader = new FileReader()

    const response = await fetch(fontUrl)
    let fontsCSS = await response.text()

    let localFontsCSS = ""

    const delineators = /@font-face.*?}/s
    const urlRegex = /url\(.*?\)/

    let fontCSSFound = delineators.exec(fontsCSS)

    while (fontCSSFound !== null){
        let fontCSS = fontCSSFound[0]

        fontsCSS = fontsCSS.slice(fontCSSFound.index+fontCSS.length)

        const urlFound = urlRegex.exec(fontCSS)
        const url = urlFound[0]

        const response = await fetch(url.slice(4,url.length-1))
        const blob = await response.blob()

        fileReader.readAsDataURL(blob)
        const localURL = await new Promise((resolve) => {
            fileReader.onload = () => {
                resolve(fileReader.result)
            }
        })

        fontCSS = fontCSS.replace(url,`url(${localURL})`)

        localFontsCSS += fontCSS + "\n"

        fontCSSFound = delineators.exec(fontsCSS)
    }

    return localFontsCSS
}

export const fontsCSS = getFontsCSS()
// I hate it too, but after trying for ages to get the fonts to render in the exported SVG...
// ...this seemed to be the only thing I could do to get to work

const fontUrl = "https://fonts.googleapis.com/css2?family=Balsamiq+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Comic+Neue:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Coming+Soon&family=Doto:wght@100..900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Jolly+Lodger&family=Modern+Antiqua&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Pangolin&family=Playwrite+NG+Modern:wght@100..400&family=Roboto:ital,wght@0,100..900;1,100..900&family=Sofia&family=Tiny5&family=Yellowtail&family=Zilla+Slab:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap";

export const fontsCSS = new Promise((resolve, reject) => {
    fetch(fontUrl).then(response => {
        return response.text()
    }).then(result => {
        resolve("<style>"+result+"</style>")
    })
})
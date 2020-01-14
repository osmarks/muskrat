import m from "mithril"
import "./style.stylus"

// detect mobile device by checking for touch capability
// mostly focused on portrait-mode use on touchscreens
// Firefox's native audio player controls (from the <audio> element)
// do not actually seem to scale to work on mobile well
// so as well as changing the CSS, this also enables a "play/pause" button
const isMobile = "ontouchstart" in window

if (isMobile) {
    document.body.className = "mobile"
}

let currentSong = null
let audioElem = null
const songName = song => {
    if (song.artist && song.title) {
        return `${song.title} - ${song.artist}`
    } else {
        return song.file.replace(/\.[^/.]+$/, "") // strip extension
    }
}

const setupPlayer = audio => {
    audioElem = audio
    audio.addEventListener("ended", () => getNext())
    audio.addEventListener("play", () => m.redraw())
    audio.addEventListener("pause", () => m.redraw())
}

const getNext = () => {
    m.request({
        method: "GET",
        url: "api/next",
        responseType: "json"
    }).then(response => {
        currentSong = response
        document.title = songName(currentSong)
        console.log(currentSong)
        if (audioElem) {
            audioElem.src = `music/${currentSong.file}`
            audioElem.addEventListener("canplaythrough", () => audioElem.play())
        }
    })
}

const rescan = () => {
    m.request({
        method: "POST",
        url: "api/rescan"
    })
}

const field = (name, content) => content ? m("div", [
        m("span.field-name", name),
        m("span.field-content", content)
    ]) : null

const Spinner = {
    view: () => m("div.spinner", "Loading...")
}

const togglePaused = () => audioElem.paused ? audioElem.play() : audioElem.pause()

const App = {
    view: () => m("div", [
        m(".extra-controls", [
            m("button", { onclick: getNext }, "Next"),
            m("button", { onclick: rescan }, "Rescan"),
            isMobile && audioElem ? m("button", { onclick: togglePaused }, audioElem.paused ? "Play" : "Pause") : null
        ]),
        m("audio.music-player", { 
            controls: true, 
            oncreate: node => setupPlayer(node.dom)
        }),
        currentSong ? m(".song-info", [
            m(".song-name", songName(currentSong)),
            field("Title", currentSong.title),
            field("Album", currentSong.album),
            field("Artist", currentSong.artist)
        ]) : m(Spinner),
    ])
}

m.mount(document.getElementById("app"), App)
getNext()
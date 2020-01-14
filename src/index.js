const metadataParser = require("music-metadata")
const express = require("express")
const promisify = require("util").promisify
const path = require("path")
const fswalk = require("@nodelib/fs.walk")
const PromisePool = require('es6-promise-pool')
const expressPromiseRouter = require("express-promise-router")

const musicFolder = "./music"

const loadSongs = async () => {
    const files = fswalk.walkSync(musicFolder, { basePath: "" }).filter(x => x.dirent.isFile()).map(x => x.path)
    const songs = []
    const promiseProducer = () => {
        const file = files.shift()
        if (file === undefined) { return null }
        const filepath = path.join(musicFolder, file)
        return metadataParser.parseFile(filepath, { skipCovers: true }).then(fileMeta => {
            const meta = fileMeta.common
            meta.file = file
            songs.push(meta)
        })
    }
    await new PromisePool(promiseProducer, 4).start()
    return songs
}

let songsPromise = loadSongs()

songsPromise.then(songs => {
    console.log(songs.length, "files processed")

    const app = express()
    const api = expressPromiseRouter()

    api.get("/next", async (req, res) => {
        const x = songs[Math.floor(Math.random() * songs.length)]
        res.json(x)
    })

    api.post("/rescan", async (req, res) => {
        loadSongs().then(s => { console.log("Rescan complete"); songs = s })
        res.json(true)
    })

    app.use("/api/", api)
    app.use("/music", express.static(musicFolder, {
        maxAge: "2min"
    }))
    app.use("/", express.static("./dist"))

    app.listen(8333, () => console.log("listening on port 8333"))
})
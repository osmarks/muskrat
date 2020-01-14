# muskrat

This is a web-based automatic music streaming server using a local library.
To expand on this a bit: this is a simple web application which plays randomly picked songs from your library (which is assumed to be in the `./music` folder for now), which can function on desktop or mobile devices.

## Setup

1. `git clone` this
2. `npm install` - install dependencies
3. `npm run build:client` - build the frontend - the backend doesn't require a build step
4. `node src/index.js` (you probably want to run this automatically; make sure the working directory is right)

The files in your music folder are assumed to have valid metadata (in any format accepted by [music-metadata](http://npmjs.com/package/music-metadata)) and be playable directly by your browser. 
This does not include some sort of automatic transcoding, so don't use exotic formats.
If metadata is missing it should *function*, but some features may be unavailable or broken.

## TODO

* Figure out a way to make the native `<audio>` controls look decent on mobile Firefox.
* Maybe some sort of service worker setup for local caching, so it can work without a good internet connection.
* Do some sort of shuffle, instead of naive random picking - possibly just use weighted random, biased against recently played songs.
* Preload the next song to reduce latency.
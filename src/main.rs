use std::path::Path;
use walkdir::{WalkDir, DirEntry};
use taglib;
use rand::{self, seq::SliceRandom};
use serde_derive::{Serialize};
use warp::{self, Filter};
use std::sync::{Arc, RwLock};
use std::error::Error;

#[derive(Clone, Debug, Serialize)]
struct Song {
    file: String,
    title: String,
    album: Option<String>,
    artist: String
}

fn is_hidden(entry: &DirEntry) -> bool {
    entry.file_name()
         .to_str()
         .map(|s| s.starts_with("."))
         .unwrap_or(false)
}

fn read_metadata(path: &Path) -> Option<Song> {
    let file = taglib::File::new(path.to_str()?).ok()?;
    let tag = file.tag().ok()?;
    Some(Song {
        file: path.strip_prefix("music").unwrap().to_str()?.to_string(),
        title: tag.title()?,
        artist: tag.artist()?,
        album: tag.album()
    })
}

fn scan_songs() -> Result<Vec<Song>, Box<dyn Error>> {
    let mut songs = vec![];
    for entry in WalkDir::new("music").follow_links(true).into_iter().filter_entry(|e| !is_hidden(e)) {
        let entry = entry?;
        if entry.file_type().is_file() {
            if let Some(song) = read_metadata(entry.path()) {
                songs.push(song);
            }
        }
    }
    println!("{} songs found", songs.len());
    Ok(songs)
}

fn next_song(songs: Arc<RwLock<Vec<Song>>>) -> Song {
    let mut rng = rand::thread_rng();
    songs.read().unwrap().choose(&mut rng).unwrap().clone()
}

fn reload_songs(songs: Arc<RwLock<Vec<Song>>>) -> impl warp::Reply {
    match scan_songs() {
        Ok(new) => {
            let mut w = songs.write().unwrap();
            *w = new;
            warp::reply::json(&Ok(true))
        },
        Err(e) => warp::reply::json(&Err(e.to_string()))
    }
}

fn main() {
    let songs = scan_songs().unwrap();
        
    let with_state = warp::any().map(move || Arc::new(RwLock::new(songs.clone())));
    let next = warp::path("next").and(warp::get2().and(with_state.clone()).map(|songs| warp::reply::json(&next_song(songs))));
    let reload = warp::path("reload").and(warp::post2().and(with_state).map(|songs| reload_songs(songs)));
    let api = next.or(reload);

    let dist = warp::fs::dir("dist");
    let music = warp::path("music").and(warp::fs::dir("music"));
    let static_files = music.or(dist);

    let app = static_files.or(warp::path("api").and(api));

    warp::serve(app)
        .run(([127, 0, 0, 1], 8333));
}
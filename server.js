const { error } = require("console");
const { captureRejectionSymbol } = require("events");
const express = require("express");
const app = express();
const path = require("path");
const hostname = "127.0.0.1";
const port = 3000;

const apiController = (() => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const playlistId = process.env.PLAYLIST_ID;

  const _getToken = async () => {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
        body: "grant_type=client_credentials",
      });
      const data = await response.json();
      return data.access_token;
    } catch (err) {
      console.log("Error fetching the token:", err);
    }
  };

  const _getTracksFromPlaylist = async (token) => {
    const limit = 8;
    const offset = Math.floor(Math.random() * 400) + 1;
    const fields =
      "items(track(name,artists(name),album(images),duration_ms,preview_url))";
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=${fields}`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));
      const validTracks = data.items
        .filter((item) => item.track.preview_url !== null)
        .map((item) => {
          const track = item.track;
          return {
            songName: track.name,
            artistName: track.artists.map((artist) => artist.name).join(", "),
            songCover: track.album.images[0]?.url,
            songDuration: track.duration_ms / 1000,
            previewUrl: track.preview_url,
          };
        });
      return validTracks;
    } catch (err) {
      console.log("Error fetching song track:", err);
    }
  };

  return {
    getToken() {
      return _getToken();
    },
    getTracks(token) {
      return _getTracksFromPlaylist(token);
    },
  };
})();

app.use(express.static(path.join(__dirname, "/public")));

app.get("/tracks", async (req, res) => {
  try {
    const token = await apiController.getToken();
    if (token) {
      const tracks = await apiController.getTracks(token);
      res.json(tracks);
    } else {
      res.status(500).json({ error: "Failed to obtain token" });
    }
  } catch (err) {
    console.error("Error during the API request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

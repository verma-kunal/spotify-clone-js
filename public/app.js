// DOM elements
const songItems = document.querySelectorAll(".songItem");
const backwardIcon = document.querySelector(".backwardIcon");
const masterPlayIcon = document.querySelector(".masterPlayIcon");
const forwardIcon = document.querySelector(".forwardIcon");
const progressBar = document.getElementById("progressBar");
const songGif = document.getElementById("songGif");
const playSongName = document.querySelector("#playSongName");
let songIndex = 0;
let audioElement = new Audio();

const trimToMainName = (songName) => {
  // Regular expression to match until the first occurrence of " (From" or " (feat."
  const regex = /^(.*?)( \(From|\ \(feat)/;
  const match = songName.match(regex);
  return match ? match[1] : songName; // If there's a match, return the main part; otherwise, return the original song name
};

const toggleRotation = (element, isPlaying) => {
  const songCovers = document.querySelectorAll("img#songCover");
  songCovers.forEach((cover) => cover.classList.remove("rotate")); // Remove rotation from all covers
  if (isPlaying) {
    element.classList.add("rotate");
  }
};

// function to play a song
const songPlay = (data, index) => {
  audioElement.src = data[index].previewUrl;
  playSongName.innerHTML = trimToMainName(data[index].songName);
  audioElement.play();
  masterPlayIcon.classList.remove("fa-circle-play");
  masterPlayIcon.classList.add("fa-circle-pause");

  // css
  songGif.style.opacity = 1;
  playSongName.style.display = "contents";
  const currentCover = songItems[index].querySelector("img#songCover");
  toggleRotation(currentCover, true); // Start rotation on the current cover
};

// function to pause a song
const songPause = () => {
  audioElement.pause();
  masterPlayIcon.classList.remove("fa-circle-pause");
  masterPlayIcon.classList.add("fa-circle-play");
  songGif.style.opacity = 0;
  playSongName.style.display = "none";
  toggleRotation(null, false);
};

// updating song info
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/tracks");
    const data = await response.json();

    // update song name & cover in DOM
    songItems.forEach((element, index) => {
      if (index < data.length) {
        element.querySelector("span.songName").innerHTML = trimToMainName(
          data[index].songName
        );
        element.querySelector("img#songCover").src = data[index].songCover;

        // song card click event
        element.addEventListener("click", () => {
          // update song index
          songIndex = index;
          songPlay(data, songIndex);
        });
      }
    });

    // forward functionality
    forwardIcon.addEventListener("click", () => {
      if (songIndex < data.length - 1) {
        songIndex++;
        songPlay(data, songIndex);
      }
    });
    backwardIcon.addEventListener("click", () => {
      if (songIndex > 0) {
        songIndex--;
        songPlay(data, songIndex);
      }
    });
  } catch (err) {
    console.error("Error fetching tracks:", err);
  }
});

// handle play/pause
masterPlayIcon.addEventListener("click", () => {
  if (audioElement.paused || audioElement.currentTime <= 0) {
    audioElement.play();
    masterPlayIcon.classList.remove("fa-circle-play");
    masterPlayIcon.classList.add("fa-circle-pause");
    audioElement.loop = true; // play again when finished
    songGif.style.opacity = 1;

    const currentCover = songItems[songIndex].querySelector("img#songCover");
    toggleRotation(currentCover, true); // Start rotation on the current cover
  } else {
    songPause();
  }
});

// update progress bar - percentage to duration
audioElement.addEventListener("timeupdate", () => {
  let progressPercentage = parseInt(
    (audioElement.currentTime / audioElement.duration) * 100
  );
  progressBar.value = progressPercentage;
});

// change time on progress bar change
progressBar.addEventListener("change", () => {
  // new current time/playback position - at the point where progress bar is clicked
  audioElement.currentTime = (progressBar.value * audioElement.duration) / 100;
});

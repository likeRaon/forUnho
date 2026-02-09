const yesButton = document.getElementById("yes-btn");
const noButton = document.getElementById("no-btn");
const buttonArea = document.getElementById("button-area");
const celebrateSection = document.getElementById("celebrate");
const confettiCanvas = document.getElementById("confetti");
const confettiContext = confettiCanvas.getContext("2d");
const audio = document.getElementById("audio");
const playButton = document.getElementById("play-btn");
const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const currentTimeLabel = document.getElementById("current-time");
const durationLabel = document.getElementById("duration");
const playerStatus = document.getElementById("player-status");
const lyricsLine = document.getElementById("lyrics-line");
const lyricsData = document.getElementById("lyrics-data");
const waveformCanvas = document.getElementById("waveform");
const waveformContext = waveformCanvas.getContext("2d");

const confettiPieces = [];
let confettiFrame = null;
let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

const drawIdleWaveform = () => {
  const width = waveformCanvas.clientWidth;
  const height = waveformCanvas.clientHeight;
  waveformContext.clearRect(0, 0, width, height);
  const barCount = 28;
  const barWidth = (width / barCount) * 0.6;
  let x = 8;
  for (let i = 0; i < barCount; i += 1) {
    const barHeight = 8 + (i % 6) * 4;
    waveformContext.fillStyle = "rgba(255, 141, 183, 0.35)";
    waveformContext.fillRect(x, height - barHeight - 6, barWidth, barHeight);
    x += barWidth + 6;
  }
};

const resizeCanvas = () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  waveformCanvas.width = waveformCanvas.clientWidth * window.devicePixelRatio;
  waveformCanvas.height = waveformCanvas.clientHeight * window.devicePixelRatio;
  waveformContext.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  drawIdleWaveform();
};

const formatClock = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const spawnConfetti = () => {
  confettiPieces.length = 0;
  const colors = ["#ff8db7", "#ffb3d1", "#ffd6e8", "#f4c6df", "#ffc2e2"];
  const count = 180;

  for (let i = 0; i < count; i += 1) {
    confettiPieces.push({
      x: randomBetween(0, confettiCanvas.width),
      y: randomBetween(-confettiCanvas.height, 0),
      size: randomBetween(6, 12),
      speed: randomBetween(2, 5),
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.1, 0.1),
      color: colors[Math.floor(Math.random() * colors.length)],
      drift: randomBetween(-1.2, 1.2),
    });
  }
};

const drawConfetti = () => {
  confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach((piece) => {
    confettiContext.save();
    confettiContext.translate(piece.x, piece.y);
    confettiContext.rotate(piece.rotation);
    confettiContext.fillStyle = piece.color;
    confettiContext.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
    confettiContext.restore();

    piece.y += piece.speed;
    piece.x += piece.drift;
    piece.rotation += piece.rotationSpeed;
    if (piece.y > confettiCanvas.height + 20) {
      piece.y = randomBetween(-200, -20);
      piece.x = randomBetween(0, confettiCanvas.width);
    }
  });

  confettiFrame = requestAnimationFrame(drawConfetti);
};

const celebrate = () => {
  document.body.classList.add("buttons-hidden");
  celebrateSection.classList.remove("hidden");
  spawnConfetti();
  if (confettiFrame) cancelAnimationFrame(confettiFrame);
  drawConfetti();
};

const moveNoButton = (event) => {
  const areaRect = buttonArea.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const padding = 12;
  const radius = 140;

  const localX = (event?.clientX ?? lastPointer.x) - areaRect.left;
  const localY = (event?.clientY ?? lastPointer.y) - areaRect.top;
  const angle = randomBetween(0, Math.PI * 2);
  const distance = randomBetween(70, radius);

  let nextX = localX + Math.cos(angle) * distance - buttonRect.width / 2;
  let nextY = localY + Math.sin(angle) * distance - buttonRect.height / 2;

  const maxX = areaRect.width - buttonRect.width - padding;
  const maxY = areaRect.height - buttonRect.height - padding;

  if (maxX <= padding || maxY <= padding) {
    nextX = (areaRect.width - buttonRect.width) / 2;
    nextY = (areaRect.height - buttonRect.height) / 2;
  } else {
    nextX = Math.min(Math.max(padding, nextX), maxX);
    nextY = Math.min(Math.max(padding, nextY), maxY);
  }

  noButton.style.position = "absolute";
  noButton.style.left = `${nextX}px`;
  noButton.style.top = `${nextY}px`;
  noButton.style.opacity = "1";
  noButton.style.visibility = "visible";
  noButton.style.zIndex = "4";
};

yesButton.addEventListener("click", celebrate);
noButton.addEventListener("mouseenter", moveNoButton);
noButton.addEventListener("mouseover", moveNoButton);
noButton.addEventListener("focus", moveNoButton);
noButton.addEventListener("click", (event) => event.preventDefault());

window.addEventListener("resize", () => {
  resizeCanvas();
  moveNoButton();
});

resizeCanvas();

window.addEventListener("pointermove", (event) => {
  lastPointer = { x: event.clientX, y: event.clientY };
});

const parseLrc = (text) => {
  const lines = text.split(/\r?\n/);
  const entries = [];
  lines.forEach((line) => {
    const match = line.match(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,2}))?\](.*)/);
    if (!match) return;
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const millis = match[3] ? Number(match[3]) * 10 : 0;
    const content = match[4].trim();
    const time = minutes * 60 + seconds + millis / 1000;
    if (content) entries.push({ time, content });
  });
  return entries.sort((a, b) => a.time - b.time);
};

let lyrics = [];
let currentLyricIndex = -1;

const updateLyrics = (currentTime) => {
  if (lyrics.length === 0) return;
  const index = lyrics.findIndex((line, i) => {
    const next = lyrics[i + 1];
    return currentTime >= line.time && (!next || currentTime < next.time);
  });
  if (index !== -1 && index !== currentLyricIndex) {
    currentLyricIndex = index;
    const [en, kr] = lyrics[index].content.split("||").map((part) => part.trim());
    lyricsLine.innerHTML = `
      <span class="en">${en || ""}</span>
      <span class="kr">${kr || ""}</span>
    `;
    lyricsLine.classList.remove("active");
    void lyricsLine.offsetWidth;
    lyricsLine.classList.add("active");
  }
};

const loadLyrics = async () => {
  try {
    if (lyricsData?.textContent?.trim()) {
      const inlineText = lyricsData.textContent.trim();
      lyrics = parseLrc(inlineText);
      if (lyrics.length > 0) {
        const [en, kr] = lyrics[0].content.split("||").map((part) => part.trim());
        lyricsLine.innerHTML = `
          <span class="en">${en || ""}</span>
          <span class="kr">${kr || ""}</span>
        `;
        return;
      }
    }
    const response = await fetch("Ifidietomorrow.lrc");
    if (!response.ok) return;
    const text = await response.text();
    lyrics = parseLrc(text);
    if (lyrics.length > 0) {
      const [en, kr] = lyrics[0].content.split("||").map((part) => part.trim());
      lyricsLine.innerHTML = `
        <span class="en">${en || ""}</span>
        <span class="kr">${kr || ""}</span>
      `;
    }
  } catch (error) {
    console.warn("가사 파일을 불러오지 못했습니다.", error);
  }
};

let audioContext;
let analyser;
let dataArray;
let waveformFrame;

const setupWaveform = () => {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
};

const drawWaveform = () => {
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);

  const width = waveformCanvas.clientWidth;
  const height = waveformCanvas.clientHeight;
  waveformContext.clearRect(0, 0, width, height);

  const barWidth = (width / dataArray.length) * 1.6;
  let x = 0;
  dataArray.forEach((value) => {
    const barHeight = (value / 255) * (height - 10);
    waveformContext.fillStyle = "rgba(255, 141, 183, 0.85)";
    waveformContext.fillRect(x, height - barHeight, barWidth, barHeight);
    x += barWidth + 2;
  });

  waveformFrame = requestAnimationFrame(drawWaveform);
};

playButton.addEventListener("click", () => {
  if (audio.paused) {
    setupWaveform();
    if (audioContext.state === "suspended") audioContext.resume();
    audio.play();
  } else {
    audio.pause();
  }
});

audio.addEventListener("loadedmetadata", () => {
  durationLabel.textContent = formatClock(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  currentTimeLabel.textContent = formatClock(audio.currentTime);
  if (audio.duration) {
    progress.value = String((audio.currentTime / audio.duration) * 100);
  }
  updateLyrics(audio.currentTime);
});

audio.addEventListener("play", () => {
  playButton.textContent = "Pause";
  playerStatus.textContent = "재생 중";
  if (waveformFrame) cancelAnimationFrame(waveformFrame);
  drawWaveform();
});

audio.addEventListener("pause", () => {
  playButton.textContent = "Play";
  playerStatus.textContent = "일시정지";
  if (waveformFrame) cancelAnimationFrame(waveformFrame);
  drawIdleWaveform();
});

progress.addEventListener("input", () => {
  if (!audio.duration) return;
  const nextTime = (Number(progress.value) / 100) * audio.duration;
  audio.currentTime = nextTime;
});

volume.addEventListener("input", () => {
  audio.volume = Number(volume.value);
});

audio.volume = Number(volume.value);
loadLyrics();

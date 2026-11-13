// =====================================================
// 1. PHOTOS & SONG CONFIGURATION
// =====================================================
const PHOTOS = [
  "photo1.jpg",
  "photo2.jpg",
  "photo3.jpg"
];

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80"
];

const FALLBACK_SONG = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112191.mp3";

const resolvedPhotos = [...PHOTOS];

function initPhotoSources() {
  PHOTOS.forEach((src, idx) => {
    const testImg = new Image();
    testImg.onload = () => updatePhotoDOM(idx, src);
    testImg.onerror = () => {
      resolvedPhotos[idx] = FALLBACK_PHOTOS[idx];
      updatePhotoDOM(idx, FALLBACK_PHOTOS[idx]);
    };
    testImg.src = src;
  });
}

function updatePhotoDOM(index, url) {
  const el = document.querySelector(`.user-photo-${index + 1}`);
  if (el) el.src = url;
  if (index === 0) {
    document.getElementById("scratch-img").src = url;
    document.getElementById("puzzle-peek-img").src = url;
  }
}

initPhotoSources();

// =====================================================
// 2. SMART AUTO-PLAY BACKGROUND MUSIC CONTROLLER
// =====================================================
const bgMusic = document.getElementById("bg-music");
const musicToggle = document.getElementById("music-toggle");
const autoplayOverlay = document.getElementById("autoplay-overlay");
let musicStarted = false;

bgMusic.volume = 0.85;

bgMusic.addEventListener("error", () => {
  if (bgMusic.src !== FALLBACK_SONG) {
    bgMusic.src = FALLBACK_SONG;
    startAutoPlay();
  }
}, true);

function markMusicPlaying() {
  musicStarted = true;
  musicToggle.classList.add("playing");
  musicToggle.textContent = "🎵";
  if (autoplayOverlay) autoplayOverlay.classList.remove("show");
}

function startAutoPlay() {
  if (musicStarted) return;

  const playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        markMusicPlaying();
      })
      .catch(() => {
        if (!bgMusic.src.includes("http") && bgMusic.networkState === 3) {
          bgMusic.src = FALLBACK_SONG;
          bgMusic.play().then(markMusicPlaying).catch(showUnlockPrompt);
        } else {
          showUnlockPrompt();
        }
      });
  }
}

function showUnlockPrompt() {
  if (autoplayOverlay && !musicStarted) {
    autoplayOverlay.classList.add("show");
  }
}

window.addEventListener("DOMContentLoaded", startAutoPlay);
window.addEventListener("load", startAutoPlay);

const unlockEvents = ["click", "touchstart", "touchend", "pointerdown", "keydown"];
function unlockAudio() {
  if (!musicStarted) {
    bgMusic.play().then(() => {
      markMusicPlaying();
      unlockEvents.forEach(ev => document.removeEventListener(ev, unlockAudio));
    }).catch(() => {});
  }
}
unlockEvents.forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));

if (autoplayOverlay) {
  autoplayOverlay.addEventListener("click", () => {
    bgMusic.play().then(markMusicPlaying);
  });
}

musicToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  if (bgMusic.paused) {
    bgMusic.play();
    markMusicPlaying();
  } else {
    bgMusic.pause();
    musicToggle.classList.remove("playing");
    musicToggle.textContent = "🔇";
  }
});

// =====================================================
// 3. SCENE NAVIGATION
// =====================================================
function showScene(num) {
  document.querySelectorAll(".scene").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(`scene-${num}`);
  if (target) target.classList.add("active");

  if (num === 2) {
    setTimeout(() => showScene(3), 3000);
  } else if (num === 3) {
    startHeartTree();
  } else if (num === 5) {
    runPolaroidSequence();
  } else if (num === 7) {
    setTimeout(() => loadScratchPhoto(0), 100);
  } else if (num === 8) {
    setTimeout(() => initPuzzle(), 100);
  } else if (num === 11) {
    startFinaleHearts();
  }
}

// =====================================================
// SCENE 1: BOW & ARROW SHOOT
// =====================================================
const bowWrapper = document.getElementById("bow-wrapper");
const arrowGroup = document.getElementById("arrow-group");
const targetHeart = document.getElementById("target-heart");
const hitMessage = document.getElementById("hit-message");
const bowHint = document.getElementById("bow-hint");
let arrowShot = false;

bowWrapper.addEventListener("click", shootArrow);
bowWrapper.addEventListener("touchend", (e) => {
  e.preventDefault();
  unlockAudio();
  shootArrow();
});

function shootArrow() {
  if (arrowShot) return;
  arrowShot = true;

  arrowGroup.style.transition = "transform 0.35s ease-in";
  arrowGroup.style.transform = "translate(160px, -160px)";

  setTimeout(() => {
    targetHeart.style.transform = "scale(1.5)";
    targetHeart.style.opacity = "0";
    hitMessage.classList.add("show");
    bowHint.textContent = "tap anywhere to keep going →";

    setTimeout(() => {
      document.getElementById("scene-1").onclick = () => showScene(2);
    }, 350);
  }, 320);
}

// =====================================================
// SCENE 3: PERFECT HEART-SHAPED TREE CANOPY
// =====================================================
let treeAnimId = null;

function startHeartTree() {
  const canvas = document.getElementById("tree-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (treeAnimId) cancelAnimationFrame(treeAnimId);

  const isMobile = window.innerWidth < 650;
  // Position tree nicely on right/center depending on screen
  const treeCenterX = isMobile ? canvas.width * 0.56 : canvas.width * 0.65;
  const groundY = canvas.height;
  const heartCenterY = isMobile ? canvas.height * 0.36 : canvas.height * 0.42;
  const heartScale = isMobile
    ? Math.min(canvas.width, canvas.height) * 0.0082
    : Math.min(canvas.width, canvas.height) * 0.011;

  // Generate 520 heart leaves inside a mathematical Heart Equation
  const colors = ["#ff0a54", "#ff477e", "#ff7096", "#ff85a1", "#fbb1bd", "#ffd166", "#d81b60"];
  const canopyHearts = [];
  const totalLeaves = 520;

  for (let i = 0; i < totalLeaves; i++) {
    const t = Math.random() * Math.PI * 2;
    // sqrt distribution fills the heart evenly from center to edge
    const r = Math.sqrt(Math.random());
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    canopyHearts.push({
      x: treeCenterX + hx * heartScale * r + (Math.random() - 0.5) * 8,
      y: heartCenterY + hy * heartScale * r + (Math.random() - 0.5) * 8,
      size: 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: (Math.random() - 0.5) * 0.7,
      delay: Math.random() * 110 // staggered blooming
    });
  }

  // Falling petals from the heart tree
  const fallingHearts = Array.from({ length: 22 }, () => ({
    x: treeCenterX + (Math.random() - 0.5) * heartScale * 26,
    y: heartCenterY + Math.random() * 120,
    size: 6 + Math.random() * 6,
    speedY: 0.7 + Math.random() * 1.2,
    speedX: -0.4 - Math.random() * 0.8,
    color: colors[Math.floor(Math.random() * colors.length)],
    sway: Math.random() * Math.PI * 2
  }));

  function drawSingleHeart(x, y, size, color, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-size, -size, -size * 1.45, size * 0.45, 0, size * 1.35);
    ctx.bezierCurveTo(size * 1.45, size * 0.45, size, -size, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawTrunk(progress) {
    const trunkTopY = heartCenterY + heartScale * 4;
    const currentTopY = groundY - (groundY - trunkTopY) * Math.min(1, progress);

    ctx.save();
    ctx.fillStyle = "#5c342e";
    ctx.strokeStyle = "#5c342e";
    ctx.lineCap = "round";

    // Main tapered trunk
    ctx.beginPath();
    ctx.moveTo(treeCenterX - 18, groundY);
    ctx.quadraticCurveTo(treeCenterX - 6, (groundY + currentTopY) / 2, treeCenterX - 4, currentTopY);
    ctx.lineTo(treeCenterX + 4, currentTopY);
    ctx.quadraticCurveTo(treeCenterX + 6, (groundY + currentTopY) / 2, treeCenterX + 18, groundY);
    ctx.closePath();
    ctx.fill();

    // Supporting branches inside the heart
    if (progress > 0.65) {
      const bProg = Math.min(1, (progress - 0.65) / 0.35);
      const branches = [
        [-45, -60, 6],
        [45, -60, 6],
        [-75, -25, 4.5],
        [75, -25, 4.5],
        [0, -85, 5]
      ];
      branches.forEach(([dx, dy, w]) => {
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(treeCenterX, trunkTopY + 15);
        ctx.quadraticCurveTo(
          treeCenterX + dx * 0.4 * bProg,
          trunkTopY + dy * 0.5 * bProg,
          treeCenterX + dx * bProg,
          trunkTopY + dy * bProg
        );
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  let frame = 0;
  function animateTree() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    // 1. Grow trunk in first 35 frames
    const trunkProgress = Math.min(1, frame / 35);
    drawTrunk(trunkProgress);

    // 2. Bloom heart-shaped canopy
    if (frame > 25) {
      const bloomFrame = frame - 25;
      canopyHearts.forEach(h => {
        if (bloomFrame > h.delay) {
          const scale = Math.min(1, (bloomFrame - h.delay) / 18);
          drawSingleHeart(h.x, h.y, h.size * scale, h.color, h.rot);
        }
      });
    }

    // 3. Gentle falling hearts from the tree
    if (frame > 95) {
      fallingHearts.forEach(fh => {
        fh.y += fh.speedY;
        fh.x += fh.speedX + Math.sin(frame * 0.04 + fh.sway) * 0.4;
        if (fh.y > canvas.height + 20) {
          fh.y = heartCenterY + (Math.random() - 0.3) * 80;
          fh.x = treeCenterX + (Math.random() - 0.5) * heartScale * 24;
        }
        drawSingleHeart(fh.x, fh.y, fh.size, fh.color, Math.sin(frame * 0.03) * 0.4);
      });
    }

    treeAnimId = requestAnimationFrame(animateTree);
  }

  animateTree();

  document.getElementById("scene-3").onclick = () => {
    if (treeAnimId) cancelAnimationFrame(treeAnimId);
    showScene(4);
  };
}

// =====================================================
// SCENE 4: GIFT BOX & HIGH-DENSITY FLOWER SHOWER (180+ FLOWERS)
// =====================================================
const giftBox = document.getElementById("gift-box");
let giftOpened = false;

giftBox.addEventListener("click", () => {
  if (giftOpened) return;
  giftOpened = true;

  document.getElementById("sketch-gift").classList.add("opened");

  const container = document.getElementById("roses-container");
  const flowerEmojis = ["🌹", "🌸", "🌺", "🌷", "💮", "❤️", "💖", "🥀"];

  // High density shower: 185 flowers across full screen width
  const TOTAL_FLOWERS = 185;
  for (let i = 0; i < TOTAL_FLOWERS; i++) {
    const rose = document.createElement("div");
    rose.className = "falling-rose";
    rose.textContent = flowerEmojis[i % flowerEmojis.length];
    rose.style.left = Math.random() * 100 + "vw";
    rose.style.fontSize = (1.5 + Math.random() * 2.2) + "rem";
    rose.style.animationDuration = (1.4 + Math.random() * 2.2) + "s";
    rose.style.animationDelay = (Math.random() * 1.8) + "s";
    container.appendChild(rose);
  }

  setTimeout(() => {
    container.innerHTML = "";
    showScene(5);
  }, 4200);
});

// =====================================================
// SCENE 5: COUPLE INTRO -> 3 POLAROID PHOTOS
// =====================================================
function runPolaroidSequence() {
  const intro = document.getElementById("intro-couple");
  const stage = document.getElementById("polaroid-stage");

  setTimeout(() => {
    intro.style.display = "none";
    stage.classList.add("show");

    document.querySelectorAll(".polaroid").forEach((card, i) => {
      setTimeout(() => card.classList.add("pop"), i * 320);
    });
  }, 1800);

  document.getElementById("scene-5").onclick = () => {
    if (stage.classList.contains("show")) showScene(6);
  };
}

// =====================================================
// SCENE 6: KNOCK 3 TIMES ON MUSEUM DOOR
// =====================================================
let knocks = 0;
const doorPanel = document.getElementById("door-panel");
const knockStatus = document.getElementById("knock-status");

doorPanel.addEventListener("click", () => {
  if (knocks >= 3) return;
  knocks++;
  document.getElementById(`dot-${knocks}`).classList.add("lit");

  if (knocks < 3) {
    knockStatus.textContent = `Knock ${knocks}/3... keep knocking!`;
  } else {
    knockStatus.textContent = "Welcoming you in...";
    doorPanel.classList.add("open");
    setTimeout(() => showScene(7), 1600);
  }
});

// =====================================================
// SCENE 7: ROOM 1 - RESPONSIVE SCRATCH TO SEE (3 PHOTOS)
// =====================================================
let currentPhotoIdx = 0;
const scratchCanvas = document.getElementById("scratch-canvas");
const sCtx = scratchCanvas.getContext("2d");

function loadScratchPhoto(idx) {
  currentPhotoIdx = idx;
  const frame = document.getElementById("scratch-frame");
  const w = frame.clientWidth || 240;
  const h = frame.clientHeight || 240;

  document.getElementById("scratch-img").src = resolvedPhotos[idx];
  document.getElementById("photo-counter").textContent = `${idx + 1} / 3`;
  document.getElementById("exhibit-title").textContent = `Memory #${idx + 1}`;
  document.getElementById("exhibit-sub").textContent = `EXHIBIT ${idx + 1} · FROM OUR COLLECTION`;

  scratchCanvas.width = w;
  scratchCanvas.height = h;

  sCtx.globalCompositeOperation = "source-over";
  const grad = sCtx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#e6c786");
  grad.addColorStop(0.5, "#d4af69");
  grad.addColorStop(1, "#c59b4d");
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, w, h);

  sCtx.fillStyle = "#5c4318";
  sCtx.font = "600 14px Poppins";
  sCtx.textAlign = "center";
  sCtx.fillText("Scratch to see it ✨", w / 2, h / 2 - 6);
  sCtx.font = "10px Poppins";
  sCtx.fillText("RUB WITH FINGER OR MOUSE", w / 2, h / 2 + 14);
}

let isScratching = false;

function scratchMove(e) {
  if (!isScratching) return;
  const rect = scratchCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  sCtx.globalCompositeOperation = "destination-out";
  sCtx.beginPath();
  sCtx.arc(x, y, 24, 0, Math.PI * 2);
  sCtx.fill();
}

scratchCanvas.addEventListener("mousedown", () => (isScratching = true));
window.addEventListener("mouseup", () => (isScratching = false));
scratchCanvas.addEventListener("mousemove", scratchMove);

scratchCanvas.addEventListener("touchstart", (e) => {
  isScratching = true;
  scratchMove(e);
}, { passive: true });

scratchCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  scratchMove(e);
}, { passive: false });

window.addEventListener("touchend", () => (isScratching = false));

document.getElementById("prev-photo").onclick = () => {
  loadScratchPhoto((currentPhotoIdx - 1 + 3) % 3);
};

document.getElementById("next-photo").onclick = () => {
  loadScratchPhoto((currentPhotoIdx + 1) % 3);
};

document.getElementById("to-room-2").onclick = () => showScene(8);

// =====================================================
// SCENE 8: ROOM 2 - RESPONSIVE 3x3 PHOTO PUZZLE
// =====================================================
let tileOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let selectedTile = null;
let moves = 0;
let seconds = 0;
let timerInterval = null;

function initPuzzle() {
  tileOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
  moves = 0;
  seconds = 0;
  document.getElementById("move-count").textContent = moves;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    document.getElementById("timer-count").textContent = `${m}:${s}`;
  }, 1000);

  renderPuzzle();
}

function renderPuzzle() {
  const board = document.getElementById("puzzle-board");
  board.innerHTML = "";
  const boardSize = board.clientWidth || 246;
  const tileSize = boardSize / 3;

  const imgUrl = resolvedPhotos[0];
  document.getElementById("puzzle-peek-img").src = imgUrl;

  tileOrder.forEach((pieceIdx, posIdx) => {
    const tile = document.createElement("div");
    tile.className = "puzzle-tile";
    if (selectedTile === posIdx) tile.classList.add("selected");

    const row = Math.floor(pieceIdx / 3);
    const col = pieceIdx % 3;
    tile.style.backgroundImage = `url('${imgUrl}')`;
    tile.style.backgroundSize = `${boardSize}px ${boardSize}px`;
    tile.style.backgroundPosition = `-${col * tileSize}px -${row * tileSize}px`;

    tile.onclick = () => onTileClick(posIdx);
    board.appendChild(tile);
  });
}

function onTileClick(posIdx) {
  if (selectedTile === null) {
    selectedTile = posIdx;
    renderPuzzle();
  } else if (selectedTile === posIdx) {
    selectedTile = null;
    renderPuzzle();
  } else {
    const temp = tileOrder[selectedTile];
    tileOrder[selectedTile] = tileOrder[posIdx];
    tileOrder[posIdx] = temp;
    selectedTile = null;
    moves++;
    document.getElementById("move-count").textContent = moves;
    renderPuzzle();

    if (tileOrder.every((val, i) => val === i)) {
      clearInterval(timerInterval);
      document.getElementById("puzzle-win-msg").style.display = "block";
    }
  }
}

window.addEventListener("resize", () => {
  if (document.getElementById("scene-8").classList.contains("active")) {
    renderPuzzle();
  }
});

const peekBtn = document.getElementById("peek-btn");
const peekImg = document.getElementById("puzzle-peek-img");
peekBtn.addEventListener("mousedown", () => peekImg.classList.add("show"));
peekBtn.addEventListener("mouseup", () => peekImg.classList.remove("show"));
peekBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  peekImg.classList.add("show");
});
peekBtn.addEventListener("touchend", () => peekImg.classList.remove("show"));

document.getElementById("to-room-3").onclick = () => showScene(9);

// =====================================================
// SCENE 9: ROOM 3 - ENVELOPE & LETTER
// =====================================================
document.getElementById("envelope-stage").onclick = () => {
  document.getElementById("envelope-stage").style.display = "none";
  document.getElementById("letter-paper-wrap").classList.add("show");
};

document.getElementById("to-room-4").onclick = () => showScene(10);

// =====================================================
// SCENE 10: ROOM 4 - SEAL PROMISES -> GO TO FOREVER PAGE
// =====================================================
const makeOfficialBtn = document.getElementById("make-official-btn");
const stampSeal = document.getElementById("stamp-seal");

makeOfficialBtn.onclick = () => {
  // Stamp the wax seal on the promises card first
  stampSeal.classList.add("stamped");
  makeOfficialBtn.textContent = "Sealed Forever ❤️";

  // Transition to the romantic Scene 11 Forever Page
  setTimeout(() => {
    showScene(11);
  }, 1200);
};

// =====================================================
// SCENE 11: GRAND FINALE FLOATING HEARTS & REPLAY
// =====================================================
let finaleInterval = null;

function startFinaleHearts() {
  const container = document.getElementById("finale-hearts-container");
  container.innerHTML = "";
  const symbols = ["❤️", "💖", "💗", "✨", "💕", "🌹"];

  clearInterval(finaleInterval);
  finaleInterval = setInterval(() => {
    const h = document.createElement("div");
    h.className = "floating-finale-heart";
    h.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    h.style.left = Math.random() * 96 + "vw";
    h.style.fontSize = (1.2 + Math.random() * 1.8) + "rem";
    h.style.animationDuration = (3.5 + Math.random() * 3) + "s";
    container.appendChild(h);

    setTimeout(() => h.remove(), 6500);
  }, 180);
}

// Replay button resets the experience
document.getElementById("replay-btn").onclick = () => {
  clearInterval(finaleInterval);
  arrowShot = false;
  giftOpened = false;
  knocks = 0;
  arrowGroup.style.transform = "translate(0, 0)";
  targetHeart.style.transform = "scale(1)";
  targetHeart.style.opacity = "1";
  hitMessage.classList.remove("show");
  document.getElementById("sketch-gift").classList.remove("opened");
  doorPanel.classList.remove("open");
  document.querySelectorAll(".k-dot").forEach(d => d.classList.remove("lit"));
  stampSeal.classList.remove("stamped");
  makeOfficialBtn.textContent = "Make it official ❤️";
  showScene(1);
};
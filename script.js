(() => {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");

  const GRID_SIZE = 20;
  const CELL = canvas.width / GRID_SIZE;
  const BASE_SPEED_MS = 130;
  const MIN_SPEED_MS = 60;
  const SPEEDUP_EVERY = 5;

  const BEST_KEY = "snake_best_score";

  let snake, direction, nextDirection, food, score, best;
  let running = false;
  let paused = false;
  let loopTimer = null;
  let speed = BASE_SPEED_MS;

  function loadBest() {
    return Number(localStorage.getItem(BEST_KEY) || 0);
  }

  function saveBest(value) {
    localStorage.setItem(BEST_KEY, String(value));
  }

  function resetState() {
    const mid = Math.floor(GRID_SIZE / 2);
    snake = [
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = BASE_SPEED_MS;
    scoreEl.textContent = "0";
    placeFood();
  }

  function placeFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some((seg) => seg.x === pos.x && seg.y === pos.y));
    food = pos;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 2.4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#7dffb3" : "#4fd88f";
      const pad = 1.5;
      ctx.fillRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2
      );
    });
  }

  function step() {
    direction = nextDirection;
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE ||
      snake.some((seg) => seg.x === head.x && seg.y === head.y)
    ) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      if (score % SPEEDUP_EVERY === 0) {
        speed = Math.max(MIN_SPEED_MS, speed - 8);
        restartTimer();
      }
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function restartTimer() {
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = setInterval(step, speed);
  }

  function gameOver() {
    running = false;
    clearInterval(loopTimer);
    loopTimer = null;
    if (score > best) {
      best = score;
      saveBest(best);
      bestEl.textContent = String(best);
    }
    overlayText.textContent = `游戏结束!得分 ${score},按空格或点击重新开始`;
    startBtn.textContent = "再来一局";
    overlay.classList.remove("hidden");
  }

  function startGame() {
    resetState();
    running = true;
    paused = false;
    overlay.classList.add("hidden");
    draw();
    restartTimer();
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) {
      clearInterval(loopTimer);
      loopTimer = null;
      overlayText.textContent = "已暂停,按空格继续";
      startBtn.textContent = "继续";
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
      restartTimer();
    }
  }

  function setDirection(dx, dy) {
    if (!running) return;
    if (paused) return;
    if (direction.x === -dx && direction.y === -dy) return;
    if (
      (direction.x === dx && direction.y === dy) ||
      (nextDirection.x === -dx && nextDirection.y === -dy)
    ) {
      return;
    }
    nextDirection = { x: dx, y: dy };
  }

  const KEY_MAP = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    w: [0, -1],
    s: [0, 1],
    a: [-1, 0],
    d: [1, 0],
    W: [0, -1],
    S: [0, 1],
    A: [-1, 0],
    D: [1, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (!running) {
        startGame();
      } else {
        togglePause();
      }
      return;
    }
    const dir = KEY_MAP[e.key];
    if (dir) {
      e.preventDefault();
      setDirection(dir[0], dir[1]);
    }
  });

  startBtn.addEventListener("click", () => {
    if (!running) {
      startGame();
    } else if (paused) {
      togglePause();
    }
  });

  document.querySelectorAll(".controls-mobile button[data-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const map = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0],
      };
      const dir = map[btn.dataset.dir];
      if (!running) {
        startGame();
      }
      setDirection(dir[0], dir[1]);
    });
  });

  best = loadBest();
  bestEl.textContent = String(best);
  resetState();
  draw();
})();

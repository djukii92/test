const canvas = document.querySelector('#gameCanvas');
const context = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const bestScoreElement = document.querySelector('#bestScore');
const statusText = document.querySelector('#statusText');
const startButton = document.querySelector('#startButton');
const pauseButton = document.querySelector('#pauseButton');
const centerButton = document.querySelector('#centerButton');
const directionButtons = document.querySelectorAll('[data-direction]');

const gridSize = 15;
const tileCount = canvas.width / gridSize;
const tickSpeed = 125;
const storageKey = 'retroSnakeBestScore';

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem(storageKey) || 0);
let gameLoop;
let gameState = 'ready';
let touchStart = null;

bestScoreElement.textContent = bestScore;

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreElement.textContent = score;
  food = createFood();
  draw();
}

function startGame() {
  if (gameState === 'running') return;
  if (gameState === 'ready' || gameState === 'gameover') resetGame();
  gameState = 'running';
  statusText.textContent = 'PLAY';
  clearInterval(gameLoop);
  gameLoop = setInterval(step, tickSpeed);
}

function pauseGame() {
  if (gameState !== 'running') return;
  gameState = 'paused';
  statusText.textContent = 'PAUSE';
  clearInterval(gameLoop);
}

function step() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (hitWall(head) || hitSelf(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreElement.textContent = score;
    food = createFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  context.fillStyle = '#9cac72';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawPixelGrid();
  drawFood();
  drawSnake();

  if (gameState === 'ready') drawMessage('PRESS START');
  if (gameState === 'paused') drawMessage('PAUSED');
  if (gameState === 'gameover') drawMessage('GAME OVER');
}

function drawPixelGrid() {
  context.strokeStyle = 'rgba(31, 40, 22, 0.12)';
  context.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    context.beginPath();
    context.moveTo(i * gridSize, 0);
    context.lineTo(i * gridSize, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, i * gridSize);
    context.lineTo(canvas.width, i * gridSize);
    context.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    context.fillStyle = index === 0 ? '#11170d' : '#26351a';
    context.fillRect(part.x * gridSize + 2, part.y * gridSize + 2, gridSize - 4, gridSize - 4);

    if (index === 0) {
      context.fillStyle = '#9cac72';
      context.fillRect(part.x * gridSize + 5, part.y * gridSize + 5, 3, 3);
    }
  });
}

function drawFood() {
  context.fillStyle = '#1f2816';
  context.beginPath();
  context.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, 5, 0, Math.PI * 2);
  context.fill();
}

function drawMessage(message) {
  context.fillStyle = 'rgba(156, 172, 114, 0.82)';
  context.fillRect(30, 125, 240, 50);
  context.strokeStyle = '#1f2816';
  context.strokeRect(30, 125, 240, 50);
  context.fillStyle = '#1f2816';
  context.font = 'bold 20px Courier New, monospace';
  context.textAlign = 'center';
  context.fillText(message, canvas.width / 2, 157);
}

function createFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((part) => part.x === newFood.x && part.y === newFood.y));
  return newFood;
}

function changeDirection(newDirection) {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const candidate = directions[newDirection];
  if (!candidate) return;
  if (candidate.x + direction.x === 0 && candidate.y + direction.y === 0) return;
  nextDirection = candidate;
}

function hitWall(head) {
  return head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
}

function hitSelf(head) {
  return snake.some((part) => part.x === head.x && part.y === head.y);
}

function endGame() {
  clearInterval(gameLoop);
  gameState = 'gameover';
  statusText.textContent = 'OVER';
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(storageKey, bestScore);
    bestScoreElement.textContent = bestScore;
  }
  draw();
}

function handleKeydown(event) {
  const keyMap = {
    ArrowUp: 'up',
    w: 'up',
    W: 'up',
    ArrowDown: 'down',
    s: 'down',
    S: 'down',
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',
  };

  if (keyMap[event.key]) {
    event.preventDefault();
    changeDirection(keyMap[event.key]);
  }

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    gameState === 'running' ? pauseGame() : startGame();
  }
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}

function handleTouchEnd(event) {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const diffX = touch.clientX - touchStart.x;
  const diffY = touch.clientY - touchStart.y;
  if (Math.max(Math.abs(diffX), Math.abs(diffY)) < 24) return;
  changeDirection(Math.abs(diffX) > Math.abs(diffY) ? (diffX > 0 ? 'right' : 'left') : (diffY > 0 ? 'down' : 'up'));
  touchStart = null;
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
centerButton.addEventListener('click', () => (gameState === 'running' ? pauseGame() : startGame()));
directionButtons.forEach((button) => button.addEventListener('click', () => changeDirection(button.dataset.direction)));
document.addEventListener('keydown', handleKeydown);
canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

resetGame();

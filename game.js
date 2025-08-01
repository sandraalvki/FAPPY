class FlappyBonk {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Game state
    this.gameState = 'start'; // 'start', 'playing', 'gameOver'
    this.score = 0;
    this.highScore = localStorage.getItem('flappyBonkHighScore') || 0;

    // Character selection
    this.currentCharacter = 'bonk';
    this.characterImages = {
      bonk: new Image(),
      hippo: new Image(),
      bird: new Image(),
    };

    // Load character images
    this.characterImages.bonk.src = 'avatar1.png';
    this.characterImages.hippo.src = 'avatar2.png';
    this.characterImages.bird.src = 'avatar3.png';

    // Player properties (bigger size)
    this.player = {
      x: 120,
      y: this.height / 2,
      width: 60,
      height: 60,
      velocity: 0,
      gravity: 0.6,
      jumpPower: -12,
      rotation: 0,
    };

    // Pipes (adjusted for larger game area)
    this.pipes = [];
    this.pipeWidth = 100;
    this.pipeGap = 180;
    this.pipeSpacing = 250;
    this.pipeSpeed = 2.5;

    // Background elements
    this.clouds = [];
    this.initClouds();

    // Input handling
    this.keys = {};
    this.setupEventListeners();

    // UI elements
    this.scoreElement = document.getElementById('score');
    this.highScoreElement = document.getElementById('highScore');
    this.startScreen = document.getElementById('startScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.finalScoreElement = document.getElementById('finalScore');

    // Character selector
    this.setupCharacterSelector();

    // Initialize
    this.updateHighScoreDisplay();
    this.gameLoop();
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleInput();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse/touch events
    this.canvas.addEventListener('click', () => this.handleInput());
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleInput();
    });

    // Button events
    document
      .getElementById('startButton')
      .addEventListener('click', () => this.startGame());
    document
      .getElementById('restartButton')
      .addEventListener('click', () => this.restartGame());
  }

  setupCharacterSelector() {
    const characterOptions = document.querySelectorAll('.character-option');
    characterOptions.forEach((option) => {
      option.addEventListener('click', () => {
        // Remove active class from all options
        characterOptions.forEach((opt) => opt.classList.remove('active'));
        // Add active class to clicked option
        option.classList.add('active');
        // Update current character
        this.currentCharacter = option.dataset.character;
      });
    });
  }

  handleInput() {
    if (this.gameState === 'start') {
      this.startGame();
    } else if (this.gameState === 'playing') {
      this.jump();
    } else if (this.gameState === 'gameOver') {
      this.restartGame();
    }
  }

  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.player.y = this.height / 2;
    this.player.velocity = 0;
    this.player.rotation = 0;
    this.pipes = [];
    this.generatePipes();
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.updateScoreDisplay();
  }

  restartGame() {
    this.startGame();
  }

  gameOver() {
    this.gameState = 'gameOver';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('flappyBonkHighScore', this.highScore);
      this.updateHighScoreDisplay();
    }
    this.finalScoreElement.textContent = this.score;
    this.gameOverScreen.classList.remove('hidden');
  }

  jump() {
    this.player.velocity = this.player.jumpPower;
  }

  updatePlayer() {
    if (this.gameState !== 'playing') return;

    // Apply gravity
    this.player.velocity += this.player.gravity;
    this.player.y += this.player.velocity;

    // Update rotation based on velocity
    this.player.rotation = Math.min(
      Math.PI / 2,
      Math.max(-Math.PI / 4, this.player.velocity * 0.1)
    );

    // Check boundaries
    if (this.player.y < 0) {
      this.player.y = 0;
      this.player.velocity = 0;
    }

    if (this.player.y + this.player.height > this.height) {
      this.gameOver();
    }
  }

  generatePipes() {
    const gapY = Math.random() * (this.height - this.pipeGap - 120) + 60;
    this.pipes.push({
      x: this.width,
      gapY: gapY,
      passed: false,
    });
  }

  updatePipes() {
    if (this.gameState !== 'playing') return;

    // Move pipes
    this.pipes.forEach((pipe) => {
      pipe.x -= this.pipeSpeed;
    });

    // Remove off-screen pipes
    this.pipes = this.pipes.filter((pipe) => pipe.x > -this.pipeWidth);

    // Generate new pipes
    if (
      this.pipes.length === 0 ||
      this.pipes[this.pipes.length - 1].x < this.width - this.pipeSpacing
    ) {
      this.generatePipes();
    }

    // Check collisions and scoring
    this.pipes.forEach((pipe) => {
      // Check collision
      if (this.checkCollision(pipe)) {
        this.gameOver();
      }

      // Check scoring
      if (!pipe.passed && pipe.x + this.pipeWidth < this.player.x) {
        pipe.passed = true;
        this.score++;
        this.updateScoreDisplay();
      }
    });
  }

  checkCollision(pipe) {
    const playerRight = this.player.x + this.player.width;
    const playerLeft = this.player.x;
    const playerTop = this.player.y;
    const playerBottom = this.player.y + this.player.height;

    const pipeRight = pipe.x + this.pipeWidth;
    const pipeLeft = pipe.x;

    // Check if player is within pipe's x-range
    if (playerRight > pipeLeft && playerLeft < pipeRight) {
      // Check if player hits top or bottom pipe
      if (playerTop < pipe.gapY || playerBottom > pipe.gapY + this.pipeGap) {
        return true;
      }
    }

    return false;
  }

  initClouds() {
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height / 2),
        size: Math.random() * 40 + 25,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }

  updateClouds() {
    this.clouds.forEach((cloud) => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.size < 0) {
        cloud.x = this.width + cloud.size;
        cloud.y = Math.random() * (this.height / 2);
      }
    });
  }

  drawBackground() {
    // Sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.clouds.forEach((cloud) => {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawPipes() {
    this.ctx.fillStyle = '#2E8B57';
    this.pipes.forEach((pipe) => {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);

      // Bottom pipe
      this.ctx.fillRect(
        pipe.x,
        pipe.gapY + this.pipeGap,
        this.pipeWidth,
        this.height - pipe.gapY - this.pipeGap
      );

      // Pipe caps
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(pipe.x - 8, pipe.gapY - 25, this.pipeWidth + 16, 25);
      this.ctx.fillRect(
        pipe.x - 8,
        pipe.gapY + this.pipeGap,
        this.pipeWidth + 16,
        25
      );
      this.ctx.fillStyle = '#2E8B57';
    });
  }

  drawPlayer() {
    this.ctx.save();
    this.ctx.translate(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2
    );
    this.ctx.rotate(this.player.rotation);

    const currentImage = this.characterImages[this.currentCharacter];

    if (currentImage && currentImage.complete) {
      // Draw character image with transparency support
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.drawImage(
        currentImage,
        -this.player.width / 2,
        -this.player.height / 2,
        this.player.width,
        this.player.height
      );
    } else {
      // Draw fallback character
      this.ctx.fillStyle = this.getCharacterColor();
      this.ctx.fillRect(
        -this.player.width / 2,
        -this.player.height / 2,
        this.player.width,
        this.player.height
      );

      // Add character emoji
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.getCharacterEmoji(), 0, 8);
    }

    this.ctx.restore();
  }

  getCharacterColor() {
    switch (this.currentCharacter) {
      case 'bonk':
        return '#FFA500';
      case 'hippo':
        return '#8B4513';
      case 'bird':
        return '#FFD700';
      default:
        return '#FFA500';
    }
  }

  getCharacterEmoji() {
    switch (this.currentCharacter) {
      case 'bonk':
        return '🐕';
      case 'hippo':
        return '🦛';
      case 'bird':
        return '🐦';
      default:
        return '🐕';
    }
  }

  updateScoreDisplay() {
    this.scoreElement.textContent = this.score;
  }

  updateHighScoreDisplay() {
    this.highScoreElement.textContent = this.highScore;
  }

  gameLoop() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update game objects
    this.updatePlayer();
    this.updatePipes();
    this.updateClouds();

    // Draw everything
    this.drawBackground();
    this.drawPipes();
    this.drawPlayer();

    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
  new FlappyBonk();
});

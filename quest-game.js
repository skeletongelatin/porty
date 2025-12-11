// ========================================
// QUEST RPG - GAME LOGIC (MOBILE OPTIMIZED)
// Top-down game with sprite animation + touch controls
// ========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ========== MOBILE DETECTION & CANVAS SETUP ==========
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// Responsive canvas sizing - maintain 4:3 aspect ratio
function resizeCanvas() {
    if (isMobile) {
        // Mobile: maintain 800x600 (4:3) aspect ratio, fit to screen width
        const maxWidth = Math.min(window.innerWidth - 20, 800);
        const aspectRatio = 600 / 800; // 0.75 (4:3)
        canvas.width = maxWidth;
        canvas.height = maxWidth * aspectRatio;
        
        // Also center the canvas
        canvas.style.marginTop = '10px';
    } else {
        // Desktop: fixed size
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.marginTop = '0';
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Intro crawl
const introCrawl = document.getElementById('introCrawl');
let introActive = true;

function skipIntro() {
    introActive = false;
    introCrawl.classList.add('hidden');
    setTimeout(() => {
        introCrawl.style.display = 'none';
    }, 1000);
}

// Skip intro on space OR touch
document.addEventListener('keydown', function(e) {
    if (e.key === ' ' && introActive) {
        e.preventDefault();
        skipIntro();
    }
});

introCrawl.addEventListener('touchstart', function(e) {
    if (introActive) {
        e.preventDefault();
        skipIntro();
    }
});

introCrawl.addEventListener('click', function(e) {
    if (introActive) {
        skipIntro();
    }
});

// Auto skip after 8 seconds
setTimeout(() => {
    if (introActive) {
        skipIntro();
    }
}, 8000);

// Game state
const game = {
    running: false,
    score: 0,
    keys: {},
    lastTime: 0
};

// Wait for intro to finish before starting game
setTimeout(() => {
    game.running = true;
    requestAnimationFrame(gameLoop);
}, 1000);

// Load sprite images
const sprites = {
    player: {
        idleUp: new Image(),
        idleDown: new Image(),
        idleLeft: new Image(),
        idleRight: new Image(),
        walkUp1: new Image(),
        walkUp2: new Image(),
        walkDown1: new Image(),
        walkDown2: new Image(),
        walkLeft1: new Image(),
        walkLeft2: new Image(),
        walkRight1: new Image(),
        walkRight2: new Image()
    },
    enemy: {
        idleUp: new Image(),
        idleDown: new Image(),
        idleLeft: new Image(),
        idleRight: new Image(),
        walkUp1: new Image(),
        walkUp2: new Image(),
        walkDown1: new Image(),
        walkDown2: new Image(),
        walkLeft1: new Image(),
        walkLeft2: new Image(),
        walkRight1: new Image(),
        walkRight2: new Image()
    },
    background: new Image(),
    ui: {
        healthBarFrame: new Image(),
        healthBarFill: new Image(),
        hpLabel: new Image(),
        scoreLabel: new Image(),
        scoreFrame: new Image(),
        gameBorder: new Image(),
        gameOverFrame: new Image(),
        torchFlame1: new Image(),
        torchFlame2: new Image(),
        torchFlame3: new Image()
    }
};

// Set sprite paths
// Player idle sprites
sprites.player.idleUp.src = 'assets/player-idle-up.png';
sprites.player.idleDown.src = 'assets/player-idle-down.png';
sprites.player.idleLeft.src = 'assets/player-idle-left.png';
sprites.player.idleRight.src = 'assets/player-idle-right.png';

// Player walk sprites
sprites.player.walkUp1.src = 'assets/player-walk-up-1.png';
sprites.player.walkUp2.src = 'assets/player-walk-up-2.png';
sprites.player.walkDown1.src = 'assets/player-walk-down-1.png';
sprites.player.walkDown2.src = 'assets/player-walk-down-2.png';
sprites.player.walkLeft1.src = 'assets/player-walk-left-1.png';
sprites.player.walkLeft2.src = 'assets/player-walk-left-2.png';
sprites.player.walkRight1.src = 'assets/player-walk-right-1.png';
sprites.player.walkRight2.src = 'assets/player-walk-right-2.png';

// Enemy idle sprites
sprites.enemy.idleUp.src = 'assets/enemy-idle-up.png';
sprites.enemy.idleDown.src = 'assets/enemy-idle-down.png';
sprites.enemy.idleLeft.src = 'assets/enemy-idle-left.png';
sprites.enemy.idleRight.src = 'assets/enemy-idle-right.png';

// Enemy walk sprites
sprites.enemy.walkUp1.src = 'assets/enemy-walk-up-1.png';
sprites.enemy.walkUp2.src = 'assets/enemy-walk-up-2.png';
sprites.enemy.walkDown1.src = 'assets/enemy-walk-down-1.png';
sprites.enemy.walkDown2.src = 'assets/enemy-walk-down-2.png';
sprites.enemy.walkLeft1.src = 'assets/enemy-walk-left-1.png';
sprites.enemy.walkLeft2.src = 'assets/enemy-walk-left-2.png';
sprites.enemy.walkRight1.src = 'assets/enemy-walk-right-1.png';
sprites.enemy.walkRight2.src = 'assets/enemy-walk-right-2.png';

// Background
sprites.background.src = 'assets/game-background.png';

// UI sprites
sprites.ui.healthBarFrame.src = 'assets/health-bar-frame.png';
sprites.ui.healthBarFill.src = 'assets/health-bar-fill.png';
sprites.ui.hpLabel.src = 'assets/hp-label.png';
sprites.ui.scoreLabel.src = 'assets/score-label.png';
sprites.ui.scoreFrame.src = 'assets/score-frame.png';
sprites.ui.gameBorder.src = 'assets/game-border.png';
sprites.ui.gameOverFrame.src = 'assets/game-over-frame.png';
sprites.ui.torchFlame1.src = 'assets/torch-flame-1.png';
sprites.ui.torchFlame2.src = 'assets/torch-flame-2.png';
sprites.ui.torchFlame3.src = 'assets/torch-flame-3.png';

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 64,
    speed: 150,
    health: 100,
    maxHealth: 100,
    attackCooldown: 0,
    attackDuration: 300,
    isAttacking: false,
    direction: 'down',
    moving: false,
    walkFrame: 0,
    walkTimer: 0,
    walkAnimSpeed: 200
};

// Enemies
const enemies = [];
let lastEnemySpawn = 0;
const enemySpawnRate = 2000;

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 56;
        this.speed = 80;
        this.health = 100;
        this.direction = 'down';
        this.moving = true;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.walkAnimSpeed = 200;
    }

    update(deltaTime) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (absDx > absDy) {
                this.x += (dx / absDx) * this.speed * deltaTime;
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.y += (dy / absDy) * this.speed * deltaTime;
                this.direction = dy > 0 ? 'down' : 'up';
            }

            this.walkTimer += deltaTime * 1000;
            if (this.walkTimer >= this.walkAnimSpeed) {
                this.walkFrame = (this.walkFrame + 1) % 2;
                this.walkTimer = 0;
            }
            this.moving = true;
        } else {
            this.moving = false;
        }

        if (distance < 30) {
            player.health -= 10 * deltaTime;
            if (player.health <= 0) {
                gameOver();
            }
            updateHealthBar();
        }
    }

    draw() {
        let sprite;
        
        if (this.moving) {
            const frameSprites = {
                'up': [sprites.enemy.walkUp1, sprites.enemy.walkUp2],
                'down': [sprites.enemy.walkDown1, sprites.enemy.walkDown2],
                'left': [sprites.enemy.walkLeft1, sprites.enemy.walkLeft2],
                'right': [sprites.enemy.walkRight1, sprites.enemy.walkRight2]
            };
            sprite = frameSprites[this.direction][this.walkFrame];
        } else {
            const idleSprites = {
                'up': sprites.enemy.idleUp,
                'down': sprites.enemy.idleDown,
                'left': sprites.enemy.idleLeft,
                'right': sprites.enemy.idleRight
            };
            sprite = idleSprites[this.direction];
        }

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else {
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
    }
}

function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -30; break;
        case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break;
        case 3: x = -30; y = Math.random() * canvas.height; break;
    }

    enemies.push(new Enemy(x, y));
}

// ========== TOUCH CONTROLS (MOBILE ONLY) ==========
let touchControls = {
    joystick: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        identifier: null
    },
    attackButton: {
        active: false,
        identifier: null
    }
};

if (isMobile) {
    // Create touch control UI
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'touch-controls';
    controlsContainer.innerHTML = `
        <div class="joystick-area" id="joystickArea">
            <div class="joystick-base" id="joystickBase">
                <div class="joystick-stick" id="joystickStick"></div>
            </div>
        </div>
        <button class="attack-button" id="attackButton">⚔</button>
    `;
    document.body.appendChild(controlsContainer);

    const joystickArea = document.getElementById('joystickArea');
    const joystickBase = document.getElementById('joystickBase');
    const joystickStick = document.getElementById('joystickStick');
    const attackButton = document.getElementById('attackButton');

    // Joystick touch handlers
    joystickArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        
        if (!touchControls.joystick.active) {
            touchControls.joystick.active = true;
            touchControls.joystick.identifier = touch.identifier;
            
            // Get joystick area bounds
            const rect = joystickArea.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            touchControls.joystick.startX = centerX;
            touchControls.joystick.startY = centerY;
            touchControls.joystick.currentX = touch.clientX;
            touchControls.joystick.currentY = touch.clientY;

            joystickBase.classList.add('active');
        }
    });

    joystickArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        for (let touch of e.changedTouches) {
            if (touch.identifier === touchControls.joystick.identifier) {
                touchControls.joystick.currentX = touch.clientX;
                touchControls.joystick.currentY = touch.clientY;

                const dx = touchControls.joystick.currentX - touchControls.joystick.startX;
                const dy = touchControls.joystick.currentY - touchControls.joystick.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 40;

                const constrainedDist = Math.min(distance, maxDistance);
                const angle = Math.atan2(dy, dx);
                const constrainedX = Math.cos(angle) * constrainedDist;
                const constrainedY = Math.sin(angle) * constrainedDist;

                joystickStick.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
                break;
            }
        }
    });

    joystickArea.addEventListener('touchend', (e) => {
        for (let touch of e.changedTouches) {
            if (touch.identifier === touchControls.joystick.identifier) {
                touchControls.joystick.active = false;
                touchControls.joystick.identifier = null;
                joystickBase.classList.remove('active');
                joystickStick.style.transform = 'translate(0, 0)';
                break;
            }
        }
    });

    // Attack button handlers
    attackButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        
        if (!touchControls.attackButton.active) {
            touchControls.attackButton.active = true;
            touchControls.attackButton.identifier = touch.identifier;
            attackButton.classList.add('active');
            playerAttack();
        }
    });

    attackButton.addEventListener('touchend', (e) => {
        for (let touch of e.changedTouches) {
            if (touch.identifier === touchControls.attackButton.identifier) {
                touchControls.attackButton.active = false;
                touchControls.attackButton.identifier = null;
                attackButton.classList.remove('active');
                break;
            }
        }
    });
}

// Keyboard input (desktop)
document.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;

    if (e.key === ' ') {
        e.preventDefault();
        playerAttack();
    }

    if (e.key === 'Escape') {
        window.location.href = 'index.html';
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
});

// Update player position
function updatePlayer(deltaTime) {
    player.moving = false;
    let dx = 0;
    let dy = 0;

    // Keyboard input (desktop)
    if (game.keys['w'] || game.keys['arrowup']) {
        dy -= 1;
        player.direction = 'up';
        player.moving = true;
    } else if (game.keys['s'] || game.keys['arrowdown']) {
        dy += 1;
        player.direction = 'down';
        player.moving = true;
    } else if (game.keys['a'] || game.keys['arrowleft']) {
        dx -= 1;
        player.direction = 'left';
        player.moving = true;
    } else if (game.keys['d'] || game.keys['arrowright']) {
        dx += 1;
        player.direction = 'right';
        player.moving = true;
    }

    // Touch input (mobile joystick)
    if (touchControls.joystick.active) {
        const jdx = touchControls.joystick.currentX - touchControls.joystick.startX;
        const jdy = touchControls.joystick.currentY - touchControls.joystick.startY;
        const deadzone = 10;

        if (Math.abs(jdx) > deadzone || Math.abs(jdy) > deadzone) {
            const magnitude = Math.sqrt(jdx * jdx + jdy * jdy);
            dx = jdx / magnitude;
            dy = jdy / magnitude;

            // Set direction based on dominant axis
            if (Math.abs(jdx) > Math.abs(jdy)) {
                player.direction = jdx > 0 ? 'right' : 'left';
            } else {
                player.direction = jdy > 0 ? 'down' : 'up';
            }
            player.moving = true;
        }
    }

    // Move player
    if (player.moving) {
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            player.x += (dx / length) * player.speed * deltaTime;
            player.y += (dy / length) * player.speed * deltaTime;
        }

        // Walk animation
        player.walkTimer += deltaTime * 1000;
        if (player.walkTimer >= player.walkAnimSpeed) {
            player.walkFrame = (player.walkFrame + 1) % 2;
            player.walkTimer = 0;
        }
    }

    // Keep player in bounds
    player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
    player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));

    // Attack cooldown
    if (player.attackCooldown > 0) {
        player.attackCooldown -= deltaTime * 1000;
        if (player.attackCooldown <= 0) {
            player.isAttacking = false;
        }
    }
}

// Player attack
function playerAttack() {
    if (player.attackCooldown <= 0) {
        player.isAttacking = true;
        player.attackCooldown = player.attackDuration;

        const attackRange = 100;
        enemies.forEach((enemy, index) => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let inRange = false;
            if (distance <= attackRange) {
                switch (player.direction) {
                    case 'up': if (dy < 30) inRange = true; break;
                    case 'down': if (dy > -30) inRange = true; break;
                    case 'left': if (dx < 30) inRange = true; break;
                    case 'right': if (dx > -30) inRange = true; break;
                }

                if (inRange) {
                    enemies.splice(index, 1);
                    game.score += 100;
                    updateScore();
                }
            }
        });
    }
}

// Draw player
function drawPlayer() {
    let sprite;
    
    if (player.moving) {
        const frameSprites = {
            'up': [sprites.player.walkUp1, sprites.player.walkUp2],
            'down': [sprites.player.walkDown1, sprites.player.walkDown2],
            'left': [sprites.player.walkLeft1, sprites.player.walkLeft2],
            'right': [sprites.player.walkRight1, sprites.player.walkRight2]
        };
        sprite = frameSprites[player.direction][player.walkFrame];
    } else {
        const idleSprites = {
            'up': sprites.player.idleUp,
            'down': sprites.player.idleDown,
            'left': sprites.player.idleLeft,
            'right': sprites.player.idleRight
        };
        sprite = idleSprites[player.direction];
    }

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx.drawImage(sprite, player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    } else {
        ctx.fillStyle = '#6495ed';
        ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    }

    // Draw attack slash effect
    if (player.isAttacking) {
        const slashProgress = 1 - (player.attackCooldown / player.attackDuration);
        const slashAlpha = 1 - (slashProgress * 0.6);

        let slashX = player.x;
        let slashY = player.y;
        let startAngle, endAngle;

        switch (player.direction) {
            case 'up':
                slashY -= 20;
                startAngle = Math.PI;
                endAngle = 0;
                break;
            case 'down':
                slashY += 20;
                startAngle = 0;
                endAngle = Math.PI;
                break;
            case 'left':
                slashX -= 20;
                startAngle = Math.PI / 2;
                endAngle = Math.PI * 1.5;
                break;
            case 'right':
                slashX += 20;
                startAngle = -Math.PI / 2;
                endAngle = Math.PI / 2;
                break;
        }

        const gradient = ctx.createRadialGradient(slashX, slashY, 0, slashX, slashY, 50);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${slashAlpha})`);
        gradient.addColorStop(0.5, `rgba(220, 220, 230, ${slashAlpha * 0.8})`);
        gradient.addColorStop(1, `rgba(180, 180, 200, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(slashX, slashY, 50, startAngle - 0.5, endAngle + 0.5);
        ctx.stroke();
    }
}

// Draw background
function drawBackground() {
    if (sprites.background.complete && sprites.background.naturalWidth > 0) {
        ctx.drawImage(sprites.background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#1a2332';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// UI functions
function updateHealthBar() {
    const healthFill = document.getElementById('healthFill');
    const healthText = document.getElementById('healthText');
    if (healthFill) {
        healthFill.style.width = (player.health / player.maxHealth * 100) + '%';
    }
    if (healthText) {
        healthText.textContent = Math.max(0, Math.floor(player.health)) + '/' + player.maxHealth;
    }
}

function updateScore() {
    const scoreText = document.getElementById('scoreText');
    if (scoreText) {
        scoreText.textContent = game.score;
    }
}

function gameOver() {
    game.running = false;
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScore = document.getElementById('finalScore');
    
    if (gameOverScreen) {
        gameOverScreen.classList.add('active');
    }
    if (finalScore) {
        finalScore.textContent = game.score;
    }
}

// Restart button
const restartBtn = document.getElementById('restartBtn');
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        location.reload();
    });
}

// Torch animation state
const torchAnim = {
    frame: 0,
    timer: 0,
    frameDelay: 150
};

// Draw clay UI
function drawClayUI(deltaTime) {
    // Update torch animation
    torchAnim.timer += deltaTime * 1000;
    if (torchAnim.timer >= torchAnim.frameDelay) {
        torchAnim.frame = (torchAnim.frame + 1) % 3;
        torchAnim.timer = 0;
    }
    
    // Scale UI for mobile
    const uiScale = isMobile ? 0.7 : 1;
    const leftMargin = isMobile ? 10 : 30;
    const topMargin = isMobile ? 5 : 10;
    
    // Draw torches (top corners)
    const torchSprite = [sprites.ui.torchFlame1, sprites.ui.torchFlame2, sprites.ui.torchFlame3][torchAnim.frame];
    if (torchSprite && torchSprite.complete && torchSprite.naturalWidth > 0) {
        ctx.drawImage(torchSprite, leftMargin, topMargin, 60 * uiScale, 80 * uiScale);
        ctx.drawImage(torchSprite, canvas.width - (leftMargin + 60 * uiScale), topMargin, 60 * uiScale, 80 * uiScale);
    }
    
    // Draw HP Label
    const hpLabelY = isMobile ? 80 : 100;
    if (sprites.ui.hpLabel.complete && sprites.ui.hpLabel.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.hpLabel, leftMargin - 10, hpLabelY, 40 * uiScale, 30 * uiScale);
    } else {
        ctx.fillStyle = '#ff6b7a';
        ctx.font = `${12 * uiScale}px "Press Start 2P"`;
        ctx.fillText('HP', leftMargin, hpLabelY + 20);
    }
    
    // Draw health bar frame
    const healthBarX = leftMargin + 40;
    if (sprites.ui.healthBarFrame.complete && sprites.ui.healthBarFrame.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.healthBarFrame, healthBarX, hpLabelY, 220 * uiScale, 30 * uiScale);
    } else {
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 3;
        ctx.strokeRect(healthBarX, hpLabelY, 220 * uiScale, 30 * uiScale);
    }
    
    // Draw health bar fill
    const healthPercent = player.health / player.maxHealth;
    if (sprites.ui.healthBarFill.complete && sprites.ui.healthBarFill.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(healthBarX + 10, hpLabelY + 5, 200 * uiScale * healthPercent, 20 * uiScale);
        ctx.clip();
        ctx.drawImage(sprites.ui.healthBarFill, healthBarX + 10, hpLabelY + 5, 200 * uiScale, 20 * uiScale);
        ctx.restore();
    } else {
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(healthBarX + 10, hpLabelY + 5, 200 * uiScale * healthPercent, 20 * uiScale);
    }
    
    // Draw Score Label
    const scoreLabelY = hpLabelY + 45;
    if (sprites.ui.scoreLabel.complete && sprites.ui.scoreLabel.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.scoreLabel, leftMargin - 10, scoreLabelY, 80 * uiScale, 30 * uiScale);
    } else {
        ctx.fillStyle = '#daa520';
        ctx.font = `${10 * uiScale}px "Press Start 2P"`;
        ctx.fillText('SCORE', leftMargin, scoreLabelY + 20);
    }
    
    // Draw score frame
    const scoreFrameX = leftMargin + 80;
    if (sprites.ui.scoreFrame.complete && sprites.ui.scoreFrame.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.scoreFrame, scoreFrameX, scoreLabelY, 150 * uiScale, 40 * uiScale);
    } else {
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.strokeRect(scoreFrameX, scoreLabelY, 150 * uiScale, 40 * uiScale);
    }
    
    // Draw score number
    ctx.fillStyle = '#ffffff';
    ctx.font = `${14 * uiScale}px "Press Start 2P"`;
    ctx.textAlign = 'center';
    ctx.fillText(game.score.toString(), scoreFrameX + 75 * uiScale, scoreLabelY + 25 * uiScale);
    ctx.textAlign = 'left';
    
    // Draw game border
    if (sprites.ui.gameBorder.complete && sprites.ui.gameBorder.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.gameBorder, 0, 0, canvas.width, canvas.height);
    }
}

// Main game loop
function gameLoop(timestamp) {
    if (!game.running) return;
    
    const deltaTime = (timestamp - game.lastTime) / 1000;
    game.lastTime = timestamp;
    
    // Spawn enemies
    if (timestamp - lastEnemySpawn > enemySpawnRate) {
        spawnEnemy();
        lastEnemySpawn = timestamp;
    }
    
    // Update
    updatePlayer(deltaTime);
    enemies.forEach(enemy => enemy.update(deltaTime));
    
    // Draw
    drawBackground();
    enemies.forEach(enemy => enemy.draw());
    drawPlayer();
    drawClayUI(deltaTime);
    
    requestAnimationFrame(gameLoop);
}

// Start game
updateHealthBar();
updateScore();
requestAnimationFrame(gameLoop);

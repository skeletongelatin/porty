// ========================================
// QUEST RPG - GAME LOGIC
// Top-down game with sprite animation
// ========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
canvas.width = 800;
canvas.height = 600;

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

// Skip intro on space
document.addEventListener('keydown', function(e) {
    if (e.key === ' ' && introActive) {
        e.preventDefault();
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
    running: false, // Don't start until intro done
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

// UI Assets
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

// Torch animation state
const torchAnim = {
    frame: 0,
    timer: 0,
    frameDelay: 150 // ms between torch frames
};

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 64,  // Doubled from 32
    height: 64, // Doubled from 32
    speed: 180,
    health: 100,
    maxHealth: 100,
    attacking: false,
    attackCooldown: 0,
    attackDuration: 300, // Time for full attack animation
    attackFrame: 0, // 0, 1, 2 for three attack frames
    attackFrameTimer: 0,
    attackFrameDelay: 100, // 100ms per attack frame
    attackRange: 70, // Increased from 40 for better reach
    direction: 'down', // up, down, left, right
    invulnerable: false,
    invulnerableTime: 0,
    moving: false,
    walkFrame: 0,
    walkTimer: 0,
    walkFrameDelay: 200 // ms between walk frames
};

// Enemies
const enemies = [];
const enemySpawnRate = 2000; // ms
let lastEnemySpawn = 0;

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 56;  // Doubled from 28
        this.height = 56; // Doubled from 28
        this.speed = 60;
        this.health = 30;
        this.damage = 10;
        this.attackCooldown = 0;
        this.hitFlash = 0;
        this.moving = true;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.walkFrameDelay = 200;
        this.direction = 'down'; // Track enemy facing direction
    }
    
    update(deltaTime) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 30) {
            // NO DIAGONAL MOVEMENT - prioritize larger distance
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            
            if (absDx > absDy) {
                // Move horizontally only
                this.x += (dx / absDx) * this.speed * deltaTime;
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                // Move vertically only
                this.y += (dy / absDy) * this.speed * deltaTime;
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            this.moving = true;
            
            // Update walk animation
            this.walkTimer += deltaTime * 1000;
            if (this.walkTimer >= this.walkFrameDelay) {
                this.walkFrame = this.walkFrame === 0 ? 1 : 0;
                this.walkTimer = 0;
            }
        } else {
            this.moving = false;
            // Attack player
            if (this.attackCooldown <= 0 && !player.invulnerable) {
                player.health -= this.damage;
                player.invulnerable = true;
                player.invulnerableTime = 1000;
                this.attackCooldown = 1000;
                updateHealthBar();
                
                if (player.health <= 0) {
                    gameOver();
                }
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime * 1000;
        }
        
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 1000;
        }
    }
    
    draw() {
        let sprite;
        
        // Choose sprite based on direction and movement
        if (this.moving) {
            const frame = this.walkFrame === 0 ? '1' : '2';
            switch (this.direction) {
                case 'up':
                    sprite = sprites.enemy['walkUp' + frame];
                    break;
                case 'down':
                    sprite = sprites.enemy['walkDown' + frame];
                    break;
                case 'left':
                    sprite = sprites.enemy['walkLeft' + frame];
                    break;
                case 'right':
                    sprite = sprites.enemy['walkRight' + frame];
                    break;
            }
        } else {
            switch (this.direction) {
                case 'up':
                    sprite = sprites.enemy.idleUp;
                    break;
                case 'down':
                    sprite = sprites.enemy.idleDown;
                    break;
                case 'left':
                    sprite = sprites.enemy.idleLeft;
                    break;
                case 'right':
                    sprite = sprites.enemy.idleRight;
                    break;
            }
        }
        
        // Draw sprite if loaded, otherwise fallback to colored rect
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#8b4789';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
        
        // Hit flash overlay
        if (this.hitFlash > 0) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            ctx.globalAlpha = 1.0;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 100;
        return this.health <= 0;
    }
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;
    
    // Attack on spacebar
    if (e.key === ' ' && !player.attacking && player.attackCooldown <= 0) {
        e.preventDefault();
        player.attacking = true;
        player.attackCooldown = player.attackDuration;
        player.attackFrame = 0;
        player.attackFrameTimer = 0;
        checkAttackHit();
    }
    
    // Escape to show menu
    if (e.key === 'Escape') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
});

// Update player
function updatePlayer(deltaTime) {
    // Movement - NO DIAGONALS, only one direction at a time
    let dx = 0;
    let dy = 0;
    
    // Priority: last pressed key wins
    if (game.keys['w'] || game.keys['arrowup']) {
        dy = -1;
        player.direction = 'up';
        player.moving = true;
    } else if (game.keys['s'] || game.keys['arrowdown']) {
        dy = 1;
        player.direction = 'down';
        player.moving = true;
    } else if (game.keys['a'] || game.keys['arrowleft']) {
        dx = -1;
        player.direction = 'left';
        player.moving = true;
    } else if (game.keys['d'] || game.keys['arrowright']) {
        dx = 1;
        player.direction = 'right';
        player.moving = true;
    } else {
        player.moving = false;
    }
    
    // Apply movement
    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;
    
    // Update walk animation
    if (player.moving) {
        player.walkTimer += deltaTime * 1000;
        if (player.walkTimer >= player.walkFrameDelay) {
            player.walkFrame = player.walkFrame === 0 ? 1 : 0;
            player.walkTimer = 0;
        }
    }
    
    // Keep player in bounds
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
    
    // Update attack animation
    if (player.attacking) {
        player.attackFrameTimer += deltaTime * 1000;
        if (player.attackFrameTimer >= player.attackFrameDelay) {
            player.attackFrame++;
            player.attackFrameTimer = 0;
            if (player.attackFrame > 2) {
                player.attackFrame = 2; // Stay on final frame
            }
        }
    }
    
    // Update attack cooldown
    if (player.attackCooldown > 0) {
        player.attackCooldown -= deltaTime * 1000;
        if (player.attackCooldown <= 0) {
            player.attacking = false;
            player.attackFrame = 0;
        }
    }
    
    // Update invulnerability
    if (player.invulnerable) {
        player.invulnerableTime -= deltaTime * 1000;
        if (player.invulnerableTime <= 0) {
            player.invulnerable = false;
        }
    }
}

// Draw player
function drawPlayer() {
    const flashInterval = 100;
    const shouldDraw = !player.invulnerable || (player.invulnerableTime % flashInterval < flashInterval / 2);
    
    if (shouldDraw) {
        let sprite;
        
        // Choose sprite based on direction and movement (no attack sprites)
        if (player.moving) {
            const frame = player.walkFrame === 0 ? '1' : '2';
            switch (player.direction) {
                case 'up':
                    sprite = sprites.player['walkUp' + frame];
                    break;
                case 'down':
                    sprite = sprites.player['walkDown' + frame];
                    break;
                case 'left':
                    sprite = sprites.player['walkLeft' + frame];
                    break;
                case 'right':
                    sprite = sprites.player['walkRight' + frame];
                    break;
            }
        } else {
            // Idle sprite based on direction
            switch (player.direction) {
                case 'up':
                    sprite = sprites.player.idleUp;
                    break;
                case 'down':
                    sprite = sprites.player.idleDown;
                    break;
                case 'left':
                    sprite = sprites.player.idleLeft;
                    break;
                case 'right':
                    sprite = sprites.player.idleRight;
                    break;
            }
        }
        
        // Draw sprite if loaded, otherwise fallback to colored rect
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
        } else {
            // Fallback colored square
            ctx.fillStyle = '#4a90e2';
            ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
            
            // Face direction indicator
            ctx.fillStyle = '#ffffff';
            switch (player.direction) {
                case 'up':
                    ctx.fillRect(player.x - 4, player.y - 10, 8, 4);
                    break;
                case 'down':
                    ctx.fillRect(player.x - 4, player.y + 6, 8, 4);
                    break;
                case 'left':
                    ctx.fillRect(player.x - 10, player.y - 4, 4, 8);
                    break;
                case 'right':
                    ctx.fillRect(player.x + 6, player.y - 4, 4, 8);
                    break;
            }
        }
        
        // Draw attack slash effect
        if (player.attacking) {
            drawSlashEffect();
        }
    }
}

// Draw directional slash effect
function drawSlashEffect() {
    // Slash fades as animation progresses but stays same size
    const progress = player.attackFrame / 2; // 0 to 1
    const alpha = 1 - (progress * 0.6); // Fade from 1 to 0.4
    const distance = 20; // Much closer to player sprite
    const size = 50; // Arc size
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Calculate slash center position based on direction
    let slashCenterX = player.x;
    let slashCenterY = player.y;
    
    switch (player.direction) {
        case 'up':
            slashCenterY = player.y - distance;
            break;
        case 'down':
            slashCenterY = player.y + distance;
            break;
        case 'left':
            slashCenterX = player.x - distance;
            break;
        case 'right':
            slashCenterX = player.x + distance;
            break;
    }
    
    // Silvery white slash color - gradient centered on slash
    const gradient = ctx.createRadialGradient(slashCenterX, slashCenterY, 0, slashCenterX, slashCenterY, size * 1.2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(220, 220, 230, 0.8)');
    gradient.addColorStop(1, 'rgba(180, 180, 200, 0)');
    
    ctx.strokeStyle = gradient;
    ctx.fillStyle = gradient;
    ctx.lineWidth = 14; // Wider visual
    
    // Draw slash arc based on direction - OUTWARD arcs, wider spread
    switch (player.direction) {
        case 'up':
            // Arc swings outward above player
            ctx.beginPath();
            ctx.arc(slashCenterX, slashCenterY, size, -0.5, Math.PI + 0.5, true);
            ctx.stroke();
            break;
            
        case 'down':
            // Arc swings outward below player
            ctx.beginPath();
            ctx.arc(slashCenterX, slashCenterY, size, Math.PI - 0.5, Math.PI * 2 + 0.5, true);
            ctx.stroke();
            break;
            
        case 'left':
            // Arc swings outward to the left
            ctx.beginPath();
            ctx.arc(slashCenterX, slashCenterY, size, -Math.PI/2 - 0.5, Math.PI/2 + 0.5, true);
            ctx.stroke();
            break;
            
        case 'right':
            // Arc swings outward to the right
            ctx.beginPath();
            ctx.arc(slashCenterX, slashCenterY, size, Math.PI/2 - 0.5, Math.PI * 1.5 + 0.5, true);
            ctx.stroke();
            break;
    }
    
    ctx.restore();
}

// Check if attack hits enemies
function checkAttackHit() {
    enemies.forEach((enemy, index) => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Kill anything within attack range (generous)
        if (dist <= player.attackRange + 30) {
            // Very simple front check - just needs to be somewhat in front
            let inFront = false;
            switch (player.direction) {
                case 'up':
                    inFront = dy < 30; // Enemy is above or near
                    break;
                case 'down':
                    inFront = dy > -30; // Enemy is below or near
                    break;
                case 'left':
                    inFront = dx < 30; // Enemy is left or near
                    break;
                case 'right':
                    inFront = dx > -30; // Enemy is right or near
                    break;
            }
            
            if (inFront && enemy.takeDamage(50)) {
                enemies.splice(index, 1);
                game.score += 100;
                updateScore();
            }
        }
    });
}

// Spawn enemy
function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -20;
            break;
        case 1: // right
            x = canvas.width + 20;
            y = Math.random() * canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 20;
            break;
        case 3: // left
            x = -20;
            y = Math.random() * canvas.height;
            break;
    }
    
    enemies.push(new Enemy(x, y));
}

// Update UI
function updateHealthBar() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('healthFill').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent = Math.max(0, player.health) + '/' + player.maxHealth;
}

function updateScore() {
    document.getElementById('scoreText').textContent = game.score;
}

// Game over
function gameOver() {
    game.running = false;
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('gameOverScreen').classList.add('active');
}

// Restart game
document.getElementById('restartBtn').addEventListener('click', () => {
    // Reset game state
    game.running = true;
    game.score = 0;
    player.health = player.maxHealth;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.attacking = false;
    player.attackCooldown = 0;
    player.invulnerable = false;
    enemies.length = 0;
    lastEnemySpawn = 0;
    
    updateHealthBar();
    updateScore();
    document.getElementById('gameOverScreen').classList.remove('active');
    
    requestAnimationFrame(gameLoop);
});

// Draw background grid
function drawBackground() {
    // Draw background sprite if loaded, otherwise fallback to grid
    if (sprites.background.complete && sprites.background.naturalWidth > 0) {
        ctx.drawImage(sprites.background, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback grid background
        ctx.fillStyle = '#1a2332';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid
        ctx.strokeStyle = 'rgba(74, 144, 226, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}

// Draw clay UI elements
function drawClayUI(deltaTime) {
    // Update torch animation
    torchAnim.timer += deltaTime * 1000;
    if (torchAnim.timer >= torchAnim.frameDelay) {
        torchAnim.frame = (torchAnim.frame + 1) % 3; // Cycle through 0, 1, 2
        torchAnim.timer = 0;
    }
    
    // Draw torches (top corners)
    const torchSprite = [sprites.ui.torchFlame1, sprites.ui.torchFlame2, sprites.ui.torchFlame3][torchAnim.frame];
    if (torchSprite && torchSprite.complete && torchSprite.naturalWidth > 0) {
        // Left torch
        ctx.drawImage(torchSprite, 30, 10, 60, 80);
        // Right torch
        ctx.drawImage(torchSprite, canvas.width - 90, 10, 60, 80);
    }
    
    // Draw HP Label
    if (sprites.ui.hpLabel.complete && sprites.ui.hpLabel.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.hpLabel, 20, 100, 40, 30);
    } else {
        // Fallback text
        ctx.fillStyle = '#ff6b7a';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('HP', 25, 120);
    }
    
    // Draw health bar frame
    if (sprites.ui.healthBarFrame.complete && sprites.ui.healthBarFrame.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.healthBarFrame, 70, 100, 220, 30);
    } else {
        // Fallback frame
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 3;
        ctx.strokeRect(70, 100, 220, 30);
    }
    
    // Draw health bar fill (red clay)
    const healthPercent = player.health / player.maxHealth;
    if (sprites.ui.healthBarFill.complete && sprites.ui.healthBarFill.naturalWidth > 0) {
        // Draw with clipping for fill amount
        ctx.save();
        ctx.beginPath();
        ctx.rect(80, 105, 200 * healthPercent, 20);
        ctx.clip();
        ctx.drawImage(sprites.ui.healthBarFill, 80, 105, 200, 20);
        ctx.restore();
    } else {
        // Fallback red bar
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(80, 105, 200 * healthPercent, 20);
    }
    
    // Draw Score Label
    if (sprites.ui.scoreLabel.complete && sprites.ui.scoreLabel.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.scoreLabel, 20, 145, 80, 30);
    } else {
        // Fallback text
        ctx.fillStyle = '#daa520';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('SCORE', 25, 165);
    }
    
    // Draw score frame
    if (sprites.ui.scoreFrame.complete && sprites.ui.scoreFrame.naturalWidth > 0) {
        ctx.drawImage(sprites.ui.scoreFrame, 110, 145, 150, 40);
    } else {
        // Fallback frame
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.strokeRect(110, 145, 150, 40);
    }
    
    // Draw score number
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(game.score.toString(), 185, 170);
    ctx.textAlign = 'left';
    
    // Draw game border (thin gold frame)
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
// ========================================
// FINAL PS1 TITLE SCREEN - JAVASCRIPT
// Starfield + Sword pierce sequence
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== PRELOAD SOUNDS ==========
    const swordSound = new Audio('assets/sword.mp3');
    swordSound.volume = 0.5;
    swordSound.preload = 'auto';
    
    const questSound = new Audio('assets/quest.mp3');
    questSound.volume = 0.5;
    questSound.preload = 'auto';
    
    // Test if audio can load
    swordSound.addEventListener('error', function() {
        console.log('Sword sound failed to load. Check that assets/sword.mp3 exists.');
    });
    
    questSound.addEventListener('error', function() {
        console.log('Quest sound failed to load. Check that assets/quest.mp3 exists.');
    });
    
    // ========== CHECK IF ANIMATION SHOULD BE SKIPPED ==========
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    
    if (hasSeenIntro) {
        // Skip animation - show everything immediately
        document.body.classList.add('skip-intro');
        
        const logo = document.getElementById('logo3d');
        const sword = document.getElementById('sword');
        const menuFrame = document.querySelector('.menu-frame');
        const subtitle = document.querySelector('.subtitle');
        const copyright = document.querySelector('.copyright');
        
        if (logo) {
            logo.style.animation = 'none';
            logo.style.opacity = '1';
        }
        if (sword) {
            sword.style.animation = 'none';
            sword.style.opacity = '1';
            sword.style.left = '50%';
            sword.style.top = '50%';
            sword.style.transform = 'translateY(-50%) translateX(-50%) rotate(0deg)';
        }
        if (menuFrame) {
            menuFrame.style.animation = 'none';
            menuFrame.style.opacity = '1';
        }
        if (subtitle) {
            subtitle.style.animation = 'none';
            subtitle.style.opacity = '1';
        }
        if (copyright) {
            copyright.style.animation = 'none';
            copyright.style.opacity = '1';
        }
        
        // Enable menu immediately
        const menuOptions = document.querySelectorAll('.menu-option');
        if (menuOptions.length > 0) {
            menuOptions[0].classList.add('active');
        }
    } else {
        // Mark that user has seen the intro
        sessionStorage.setItem('hasSeenIntro', 'true');
    }
    
    // ========== STARFIELD BACKGROUND ==========
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const stars = [];
    const numStars = 250;
    
    class Star {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.z = Math.random() * canvas.width;
            this.speed = 0.3;
        }
        
        update() {
            this.z -= this.speed;
            if (this.z <= 0) {
                this.reset();
                this.z = canvas.width;
            }
        }
        
        draw() {
            const x = (this.x - canvas.width / 2) * (canvas.width / this.z);
            const y = (this.y - canvas.height / 2) * (canvas.width / this.z);
            const size = (1 - this.z / canvas.width) * 3;
            const brightness = 1 - this.z / canvas.width;
            
            const screenX = x + canvas.width / 2;
            const screenY = y + canvas.height / 2;
            
            if (screenX >= 0 && screenX <= canvas.width && screenY >= 0 && screenY <= canvas.height) {
                // Mix of blue and gold stars
                const color = Math.random() > 0.85 
                    ? `rgba(218, 165, 32, ${brightness * 0.8})`
                    : `rgba(100, 150, 255, ${brightness * 0.7})`;
                ctx.fillStyle = color;
                ctx.fillRect(screenX, screenY, size, size);
            }
        }
    }
    
    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(5, 10, 21, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        
        requestAnimationFrame(animate);
    }
    animate();
    
    // ========== SWORD IMPACT EFFECTS ==========
    // Logo rumble on impact (exact moment sword hits at 2s)
    setTimeout(() => {
        const logoArea = document.querySelector('.logo-area');
        if (logoArea) {
            logoArea.classList.add('rumble');
            setTimeout(() => {
                logoArea.classList.remove('rumble');
            }, 300);
        }
    }, 2000);
    
    // Glow activation after impact flash
    setTimeout(() => {
        const pierceGlow = document.querySelector('.pierce-glow');
        if (pierceGlow) {
            pierceGlow.classList.add('active');
        }
    }, 2400);
    
    // ========== MENU KEYBOARD NAVIGATION ==========
    const menuOptions = document.querySelectorAll('.menu-option');
    let selectedIndex = 0;
    
    // Wait for menu to appear before enabling navigation
    setTimeout(() => {
        if (menuOptions.length > 0) {
            menuOptions[0].classList.add('active');
        }
    }, 2700);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            menuOptions[selectedIndex].classList.remove('active');
            selectedIndex = (selectedIndex + 1) % menuOptions.length;
            menuOptions[selectedIndex].classList.add('active');
            playMenuSound();
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            menuOptions[selectedIndex].classList.remove('active');
            selectedIndex = (selectedIndex - 1 + menuOptions.length) % menuOptions.length;
            menuOptions[selectedIndex].classList.add('active');
            playMenuSound();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            
            // Play appropriate sound (Quest gets special sound)
            const selectedOption = menuOptions[selectedIndex];
            const isQuestButton = selectedOption.classList.contains('menu-option-quest');
            const soundToPlay = isQuestButton ? questSound : swordSound;
            
            soundToPlay.currentTime = 0;
            soundToPlay.play().catch(e => console.log('Audio play failed:', e));
            
            // White flash fade-out (PS1 style - blurry and semi-transparent)
            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                z-index: 10000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s ease-out;
            `;
            document.body.appendChild(flash);
            
            // Trigger flash
            setTimeout(() => {
                flash.style.opacity = '1';
            }, 10);
            
            // Navigate after sound completes
            const targetUrl = selectedOption.getAttribute('href');
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 1200);
        }
    });
    
    // Remove keyboard selection when using mouse
    menuOptions.forEach((option, index) => {
        option.addEventListener('mouseenter', function() {
            menuOptions.forEach(opt => opt.classList.remove('active'));
        });
    });
    
    // ========== MENU SOUND EFFECTS (VISUAL) ==========
    function playMenuSound() {
        const option = menuOptions[selectedIndex];
        option.style.transform = 'translateX(15px) scale(1.05)';
        setTimeout(() => {
            option.style.transform = '';
        }, 150);
    }
    
    function playSelectSound() {
        // Play sword sound effect
        swordSound.currentTime = 0; // Reset to start
        swordSound.play().catch(e => console.log('Audio play failed:', e));
        
        const menuFrame = document.querySelector('.menu-frame');
        menuFrame.style.boxShadow = '0 0 50px rgba(218, 165, 32, 0.8), inset 0 0 50px rgba(218, 165, 32, 0.5), 0 8px 0 rgba(0, 0, 0, 0.5)';
        setTimeout(() => {
            menuFrame.style.boxShadow = '';
        }, 200);
    }
    
    // Also play sound when clicking menu items with mouse
    menuOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault(); // Stop immediate navigation
            const targetUrl = this.getAttribute('href');
            
            // Play appropriate sound (Quest gets special sound)
            const isQuestButton = this.classList.contains('menu-option-quest');
            const soundToPlay = isQuestButton ? questSound : swordSound;
            
            soundToPlay.currentTime = 0;
            soundToPlay.play().catch(err => console.log('Audio play failed:', err));
            
            // White flash fade-out (PS1 style - blurry and semi-transparent)
            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                z-index: 10000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s ease-out;
            `;
            document.body.appendChild(flash);
            
            // Trigger flash
            setTimeout(() => {
                flash.style.opacity = '1';
            }, 10);
            
            // Navigate after sound completes
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 1200);
        });
    });
    
    // ========== LOGO SUBTLE BREATHING ==========
    const logo3d = document.getElementById('logo3d');
    
    if (logo3d) {
        // Check if image loaded
        if (logo3d.complete) {
            logo3d.style.display = 'block';
        } else {
            logo3d.addEventListener('load', function() {
                this.style.display = 'block';
            });
            
            // If image fails to load, show fallback
            logo3d.addEventListener('error', function() {
                const fallback = document.querySelector('.logo-fallback');
                if (fallback) {
                    fallback.style.display = 'block';
                    fallback.style.opacity = '1';
                }
            });
        }
    }
    
    // ========== CRT FLICKER ==========
    const crtOverlay = document.querySelector('.crt-overlay');
    
    setInterval(() => {
        if (Math.random() < 0.04) {
            crtOverlay.style.opacity = '0.5';
            setTimeout(() => {
                crtOverlay.style.opacity = '1';
            }, 50);
        }
    }, 2500);
    
    // ========== PREVENT CONTEXT MENU ==========
    document.addEventListener('contextmenu', e => e.preventDefault());
    
});
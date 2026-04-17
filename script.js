function toggleMenu(){
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

// Experience Card Expand Toggle
function toggleExperience(clickedCard) {
    // If the card is already open, do nothing (let the close button handle closing)
    if (clickedCard.classList.contains('active')) return;

    const allCards = document.querySelectorAll('.exp-card');
    
    // Close all cards
    allCards.forEach(card => {
        card.classList.remove('active');
    });
    
    // Open the clicked card
    clickedCard.classList.add('active');
}

// Close Button Function
function closeExperience(event, btn) {
    // This stops the click from "falling through" to the card underneath the button
    event.stopPropagation(); 
    
    // Find the specific card this button belongs to and close it
    const card = btn.closest('.exp-card');
    card.classList.remove('active');
}

// Variable to remember where the user was when they opened a card
let openScrollPosition = 0; 
// How many pixels they have to scroll before it closes (Adjust this number if you want it more or less sensitive!)
const SCROLL_THRESHOLD = 50; 

// Experience Card Expand Toggle
function toggleExperience(clickedCard) {
    if (clickedCard.classList.contains('active')) return;

    const allCards = document.querySelectorAll('.exp-card');
    allCards.forEach(card => {
        card.classList.remove('active');
    });
    
    clickedCard.classList.add('active');

    // Memorize the exact scroll height the moment the card opens
    openScrollPosition = window.scrollY; 
}



/* ── Loading Screen ──────────────────────────────────────────────────────── */
(function () {
    const loader  = document.getElementById('loader');
    const countEl = document.getElementById('loader-count');
 
    document.body.classList.add('loading');
 
    let current  = 0;
    const TOTAL_MS = 2200;
    let startTime  = null;
 
    function easeInQuad(t) { return t * t; }
 
    function step(ts) {
        if (!startTime) startTime = ts;
        const elapsed  = ts - startTime;
        const progress = Math.min(elapsed / TOTAL_MS, 1);
        const val      = Math.floor(easeInQuad(progress) * 100);
 
        if (val !== current) {
            current = val;
            countEl.textContent = current;
        }
 
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            countEl.textContent = '100';
            // Tiny pause so "100" is readable, then fade counter and slide away
            setTimeout(() => {
                countEl.style.opacity = '0';
                setTimeout(() => {
                    loader.classList.add('wipe-up');
                    document.body.classList.add('loaded'); // <-- ADD THIS LINE
                    
                    loader.addEventListener('transitionend', () => {
                        loader.remove();
                        document.body.classList.remove('loading');
                    }, { once: true });
                }, 150);
            }, 300);
        }
    }
 
    requestAnimationFrame(step);
})();

/* ── Custom Ball Scrollbar ──────────────────────────────────────────────── */
(function() {
    const ball = document.getElementById('scroll-ball');
    let isDragging = false;
    let startY;
    let startScrollTop;

    // 1. Move the ball when the user scrolls normally
    window.addEventListener('scroll', () => {
        // Only auto-update if the user isn't actively dragging the ball
        if (!isDragging) {
            // Calculate how far down the page we are as a percentage (0.0 to 1.0)
            const scrollPercentage = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            // Calculate maximum pixel distance the ball can travel down its track
            const maxBallY = window.innerHeight - ball.offsetHeight;
            
            // Move the ball
            ball.style.top = `${scrollPercentage * maxBallY}px`;
        }
    });

    // 2. Start Dragging
    ball.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = window.scrollY;
        
        // Prevent annoying text highlighting while dragging
        document.body.style.userSelect = 'none'; 
    });

    // 3. Drag Logic
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Calculate how far the mouse has moved from the initial click
        const deltaY = e.clientY - startY;
        
        const scrollableHeight = document.body.scrollHeight - window.innerHeight;
        const trackHeight = window.innerHeight - ball.offsetHeight;
        
        // Convert the physical mouse movement into page scroll distance
        const scrollAmount = (deltaY / trackHeight) * scrollableHeight;
        
        // Tell the window to scroll to the new calculated position
        window.scrollTo(0, startScrollTop + scrollAmount);
    });

    // 4. Stop Dragging
    window.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = ''; // Restore text selection
    });
})();

// New Flying Experience Logic
function flyExperience(clickedCard) {
    if (clickedCard.classList.contains('active')) return;

    const allCards = document.querySelectorAll('.exp-card-fly');
    const canvas = document.getElementById('exp-canvas');
    const isMobile = window.innerWidth <= 1200;
    
    // Close all other cards
    allCards.forEach(card => {
        card.classList.remove('active');
    });
    
    // Open the clicked card
    clickedCard.classList.add('active');

    // Only hide numbers on desktop (the flying layout)
    if (!isMobile) {
        canvas.classList.add('has-active');
    }

    // Memorize scroll position for mobile auto-close feature
    openScrollPosition = window.scrollY; 
}

function closeExperience(event, btn) {
    event.stopPropagation(); 
    
    const card = btn.closest('.exp-card-fly');
    const canvas = document.getElementById('exp-canvas');
    
    card.classList.remove('active');
    canvas.classList.remove('has-active');
}

// Auto-close flying cards on scroll (Mobile) with threshold
window.addEventListener('scroll', function() {
    if (window.innerWidth <= 1200) {
        const activeCards = document.querySelectorAll('.exp-card-fly.active');
        if (activeCards.length > 0) {
            const scrollDifference = Math.abs(window.scrollY - openScrollPosition);
            if (scrollDifference > SCROLL_THRESHOLD) {
                activeCards.forEach(card => card.classList.remove('active'));
                document.getElementById('exp-canvas').classList.remove('has-active');
            }
        }
    }
});
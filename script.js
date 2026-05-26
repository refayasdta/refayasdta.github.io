function toggleMenu(){
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

function toggleExperience(clickedCard) {

    if (clickedCard.classList.contains('active')) return;

    const allCards = document.querySelectorAll('.exp-card');
    

    allCards.forEach(card => {
        card.classList.remove('active');
    });
    

    clickedCard.classList.add('active');
}

function closeExperience(event, btn) {

    event.stopPropagation(); 
    

    const card = btn.closest('.exp-card');
    card.classList.remove('active');
}

let openScrollPosition = 0; 

const SCROLL_THRESHOLD = 50; 

function toggleExperience(clickedCard) {
    if (clickedCard.classList.contains('active')) return;

    const allCards = document.querySelectorAll('.exp-card');
    allCards.forEach(card => {
        card.classList.remove('active');
    });
    
    clickedCard.classList.add('active');

    openScrollPosition = window.scrollY; 
}

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

            setTimeout(() => {
                countEl.style.opacity = '0';
                setTimeout(() => {
                    loader.classList.add('wipe-up');
                    document.body.classList.add('loaded');
                    
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

(function() {
    const ball = document.getElementById('scroll-ball');
    let isDragging = false;
    let startY;
    let startScrollTop;

    window.addEventListener('scroll', () => {

        if (!isDragging) {

            const scrollPercentage = window.scrollY / (document.body.scrollHeight - window.innerHeight);

            const maxBallY = window.innerHeight - ball.offsetHeight;
            

            ball.style.top = `${scrollPercentage * maxBallY}px`;
        }
    });

    ball.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = window.scrollY;
        

        document.body.style.userSelect = 'none'; 
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        

        const deltaY = e.clientY - startY;
        
        const scrollableHeight = document.body.scrollHeight - window.innerHeight;
        const trackHeight = window.innerHeight - ball.offsetHeight;
        

        const scrollAmount = (deltaY / trackHeight) * scrollableHeight;
        

        window.scrollTo(0, startScrollTop + scrollAmount);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
    });
})();

function flyExperience(clickedCard) {
    if (clickedCard.classList.contains('active')) return;

    const allCards = document.querySelectorAll('.exp-card-fly');
    const canvas = document.getElementById('exp-canvas');
    const isMobile = window.innerWidth <= 1200;
    

    allCards.forEach(card => {
        card.classList.remove('active');
    });
    

    clickedCard.classList.add('active');

    if (!isMobile) {
        canvas.classList.add('has-active');
    }

    openScrollPosition = window.scrollY; 
}

function closeExperience(event, btn) {
    event.stopPropagation(); 
    
    const card = btn.closest('.exp-card-fly');
    const canvas = document.getElementById('exp-canvas');
    
    card.classList.remove('active');
    canvas.classList.remove('has-active');
}

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
// Translations
const translations = {
    en: {
        timeRemaining: "Time Remaining",
        todaySignals: "Today's Signals",
        winRate: "Win Rate",
        accuracy: "Accuracy",
        status: "Status",
        getSignal: "GET SIGNAL",
        processing: "PROCESSING..."
    },
    uz: {
        timeRemaining: "Qolgan vaqt",
        todaySignals: "Bugungi signallar",
        winRate: "G'alaba foizi",
        accuracy: "Aniqlik",
        status: "Holat",
        getSignal: "SIGNAL OLISH",
        processing: "YUKLANMOQDA..."
    }
};

// Set theme based on game parameter
document.body.className = `theme-${game.toLowerCase()}`;

// Update bookmaker and game type
document.getElementById('bookmakerName').textContent = bookmaker.toUpperCase();
document.getElementById('gameType').textContent = game.toUpperCase();

// Apply translations
function updateLanguage(lang) {
    const texts = translations[lang] || translations.en;
    for (const [key, value] of Object.entries(texts)) {
        const element = document.getElementById(key);
        if (element) {
            if (key === 'getSignal') {
                document.getElementById('buttonText').textContent = value;
            } else {
                element.textContent = value;
            }
        }
    }
}

updateLanguage(lang);

// Three.js background animation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Create animated grid
const size = 50;
const divisions = 80;
const gridHelper = new THREE.GridHelper(size, divisions, 
    new THREE.Color(document.body.className === 'theme-crash' ? '#ff3e3e' : '#00a8ff'),
    new THREE.Color(document.body.className === 'theme-crash' ? '#4a1042' : '#1e3a5c')
);
scene.add(gridHelper);

camera.position.z = 6;
camera.position.y = 4;
camera.rotation.x = -0.4;

function animate() {
    requestAnimationFrame(animate);
    gridHelper.rotation.y += 0.003;
    gridHelper.position.y = Math.sin(Date.now() * 0.001) * 0.5;
    renderer.render(scene, camera);
}

animate();

// Rocket animations
const rocket = document.querySelector('.rocket');

function startRocketAnimation() {
    rocket.classList.add('flying');
}

function stopRocketAnimation() {
    rocket.classList.remove('flying');
    rocket.classList.add('landing');
    setTimeout(() => {
        rocket.classList.remove('landing');
    }, 800); // 1000ms dan 800ms ga o'zgartirdik
}

// Qor effektini yaratish
function createSnowfall() {
    const snowfall = document.querySelector('.snowfall');
    const numberOfSnowflakes = 50;

    for (let i = 0; i < numberOfSnowflakes; i++) {
        createSnowflake(snowfall);
    }
}

function createSnowflake(container) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // Random o'lcham
    const size = Math.random() * 4 + 2;
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    
    // Random pozitsiya
    snowflake.style.left = `${Math.random() * 100}%`;
    
    // Random animatsiya davomiyligi
    const duration = Math.random() * 3 + 2;
    snowflake.style.animation = `snowfall ${duration}s linear infinite`;
    
    container.appendChild(snowflake);
    
    // Animatsiya tugagach qayta yaratish
    setTimeout(() => {
        container.removeChild(snowflake);
        createSnowflake(container);
    }, duration * 1000);
}


// Sahifa yuklanganda qor effektini boshlash
document.addEventListener('DOMContentLoaded', createSnowfall);


// Signal functionality
const getSignalButton = document.getElementById('getSignal');
const countdownElement = document.getElementById('countdown');
const multiplierElement = document.getElementById('currentMultiplier');
const progressElement = document.getElementById('progress');
const buttonTextElement = document.getElementById('buttonText');

function updateCountdown(seconds) {
    countdownElement.textContent = seconds < 10 ? `00:0${seconds}` : `00:${seconds}`;
}

function updateProgress(progress) {
    progressElement.style.transform = `scaleX(${progress})`;
}

// Load stats from server
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const stats = await response.json();
        document.getElementById('todaySignalsValue').textContent = stats.today_signals;
        document.getElementById('winRateValue').textContent = stats.win_rate + '%';
        document.getElementById('accuracyValue').textContent = stats.accuracy + '%';
        document.getElementById('statusValue').textContent = stats.status;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

let countdownInterval;

// Signal olish tugmasini bosish
getSignalButton.addEventListener('click', async () => {
    // Agar tugma o'chirilgan bo'lsa, hech narsa qilmaymiz
    if (getSignalButton.disabled) return;
    
    try {
        // Tugmani o'chirib, loading holatiga o'tkazamiz
        getSignalButton.disabled = true;
        buttonTextElement.textContent = translations[lang].processing;
        getSignalButton.classList.add('signal-active');
        
        // Agar oldingi countdown bo'lsa, uni to'xtatamiz
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        // Raketa animatsiyasini boshlaymiz
        startRocketAnimation();
        document.getElementById('timeRemaining').style.display = 'block';
        
        // Serverdan signal olamiz
        const response = await fetch(`/api/signal?game=${game}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const signal = await response.json();
        
        // Multiplier va countdown elementlarini ko'rsatamiz
        if (game.toLowerCase() === 'crash') {
            // Crash uchun qizil rangda
            multiplierElement.style.color = '#ff2d55';
        } else {
            // Aviator uchun ko'k rangda
            multiplierElement.style.color = '#00c3ff';
        }
        
        multiplierElement.textContent = signal.multiplier;
        multiplierElement.style.display = 'block';
        countdownElement.style.display = 'block';
        
        // Elementlarni animate qilamiz
        setTimeout(() => {
            multiplierElement.classList.add('show');
            countdownElement.classList.add('show');
        }, 100);
        
        // Countdown boshlaymiz
        let countdown = signal.countdown;
        let initialCountdown = countdown;
        updateCountdown(countdown);
        updateProgress(1);
        
        // Har sekundda countdown yangilanadi
        countdownInterval = setInterval(() => {
            countdown--;
            updateCountdown(countdown);
            updateProgress(countdown / initialCountdown);
            
            // Agar countdown tugasa
            if (countdown <= 0) {
                // Intervalni to'xtatamiz
                clearInterval(countdownInterval);
                stopRocketAnimation();
                
                // Tugmani qayta yoqamiz
                getSignalButton.disabled = false;
                buttonTextElement.textContent = translations[lang].getSignal;
                getSignalButton.classList.remove('signal-active');
                updateProgress(0);
                
                // Qolgan vaqt yozuvini yashiramiz
                document.getElementById('timeRemaining').style.display = 'none';
                
                // Multiplier va countdown ni yashiramiz
                multiplierElement.classList.remove('show');
                countdownElement.classList.remove('show');
                setTimeout(() => {
                    multiplierElement.style.display = 'none';
                    countdownElement.style.display = 'none';
                }, 500);
                
                // Statistikani yangilaymiz
                loadStats();
                
            }
        }, 1000);
        
    } catch (error) {
        // Xatolik yuz berganda
        console.error('Error:', error);
        getSignalButton.disabled = false;
        buttonTextElement.textContent = translations[lang].getSignal;
        getSignalButton.classList.remove('signal-active');
        document.getElementById('timeRemaining').style.display = 'none';
        playErrorSound();
        alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
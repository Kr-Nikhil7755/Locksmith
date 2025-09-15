document.addEventListener('DOMContentLoaded', () => {

    // --- New Digital Rain Background Effect ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const rainDrops = [];

    for (let x = 0; x < columns; x++) {
        rainDrops[x] = 1;
    }

    const drawMatrix = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff41'; // Matrix green
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < rainDrops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

            if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                rainDrops[i] = 0;
            }
            rainDrops[i]++;
        }
    };

    setInterval(drawMatrix, 30);
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });


    // --- DOM Elements ---
    const reloadBtn = document.getElementById('reloadBtn');
    const strengthBtns = document.querySelectorAll('.strength-btn');
    const userInput = document.getElementById('userInput');
    const generateBtn = document.getElementById('generateBtn');
    const passwordOutput = document.getElementById('passwordOutput');
    const copyBtn = document.getElementById('copyBtn');
    const copySuccess = document.getElementById('copy-success');
    const step4 = document.getElementById('step4');
    const indicatorBar = document.querySelector('.indicator-bar');
    const indicatorText = document.querySelector('.indicator-text');
    const pwnedCheckBtn = document.getElementById('pwnedCheckBtn');
    const pwnedCheckResult = document.getElementById('pwnedCheckResult');
    const historyPanel = document.querySelector('.history-panel');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    let selectedStrength = 'strong';
    let generationHistory = JSON.parse(localStorage.getItem('generationHistory')) || [];

    // --- Initial Animations & UI Setup ---
    anime({ targets: '.step:not(#step4)', opacity: [0, 1], translateY: [20, 0], duration: 800, delay: anime.stagger(150) });
    updateHistoryUI();


    // --- Event Listeners ---
    reloadBtn.addEventListener('click', () => location.reload());

    strengthBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            strengthBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStrength = btn.dataset.strength;
        });
    });

    generateBtn.addEventListener('click', () => {
        if (!userInput.value) {
            anime({ targets: userInput, translateX: [-10, 10, -10, 10, 0], duration: 500, easing: 'easeInOutQuad' });
            userInput.focus();
            return;
        }

        const password = generatePassword(userInput.value, selectedStrength);
        passwordOutput.textContent = password;
        
        // This is the corrected part to show the output
        if (step4.style.display !== 'block') {
            step4.style.display = 'block';
            anime({ targets: step4, opacity: [0, 1], translateY: [20, 0], duration: 800 });
        }

        updateStrengthIndicator(password);
        addToHistory(userInput.value, password);
        pwnedCheckResult.textContent = '';
    });

    copyBtn.addEventListener('click', () => {
        if (passwordOutput.textContent) {
            navigator.clipboard.writeText(passwordOutput.textContent).then(() => {
                copySuccess.style.opacity = '1';
                anime({ targets: copySuccess, opacity: [1,0], duration: 2000, easing: 'linear' });
            });
        }
    });
    
    pwnedCheckBtn.addEventListener('click', async () => {
        const password = passwordOutput.textContent;
        if (!password) return;

        pwnedCheckResult.textContent = "Checking...";
        pwnedCheckResult.style.color = '#58a6ff';
        const isPwned = await mockPwnedCheckAPI(password);

        if (isPwned) {
            pwnedCheckResult.textContent = "Warning: Found in a data breach!";
            pwnedCheckResult.style.color = '#e74c3c';
        } else {
            pwnedCheckResult.textContent = "✅ Not found in any known breaches.";
            pwnedCheckResult.style.color = '#2ecc71';
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        generationHistory = [];
        localStorage.removeItem('generationHistory');
        updateHistoryUI();
    });

    // --- Core Functions ---

    function updateStrengthIndicator(password) {
        const result = zxcvbn(password);
        const score = result.score;
        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];
        const strengthTexts = ['Very Weak', 'Weak', 'Okay', 'Strong', 'Very Strong'];

        indicatorBar.style.width = `${(score + 1) * 20}%`;
        indicatorBar.style.backgroundColor = colors[score];
        indicatorText.textContent = `Strength: ${strengthTexts[score]}`;
        indicatorText.style.color = colors[score];
    }
    
    function addToHistory(phrase, password) {
        if (generationHistory.some(item => item.password === password)) return;
        generationHistory.unshift({ phrase, password, date: new Date().toLocaleTimeString() });
        if (generationHistory.length > 10) generationHistory.pop();
        localStorage.setItem('generationHistory', JSON.stringify(generationHistory));
        updateHistoryUI();
    }
    
    function updateHistoryUI() {
        historyList.innerHTML = '';
        if (generationHistory.length === 0) {
            historyPanel.classList.remove('visible');
            return;
        }

        historyPanel.classList.add('visible');
        generationHistory.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span><strong>${item.password}</strong> (from: ${item.phrase})</span> <small>${item.date}</small>`;
            historyList.appendChild(li);
        });
    }

    // --- Deterministic Password Generation & Helpers ---

    function cyrb128(str) {
        let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
    }

    function sfc32(a, b, c, d) {
        return function() {
          a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
          let t = (a + b) | 0;
          a = b ^ b >>> 9;
          b = c + (c << 3) | 0;
          c = (c << 21 | c >>> 11);
          d = d + 1 | 0;
          t = t + d | 0;
          c = c + t | 0;
          return (t >>> 0) / 4294967296;
        }
    }

    function generatePassword(phrase, strength) {
        const strengthProfiles = {
            good: { len: 12, symbols: true, upper: true, numbers: true },
            strong: { len: 16, symbols: true, upper: true, numbers: true },
            unbreakable: { len: 24, symbols: true, upper: true, numbers: true }
        };
        const profile = strengthProfiles[strength];
        const seed = cyrb128(phrase + strength);
        const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);
        const charSets = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", numbers: "0123456789", symbols: "!@#$%^&*" };

        let guaranteedChars = [
            charSets.lower[Math.floor(rand() * charSets.lower.length)],
            charSets.upper[Math.floor(rand() * charSets.upper.length)],
            charSets.numbers[Math.floor(rand() * charSets.numbers.length)],
            charSets.symbols[Math.floor(rand() * charSets.symbols.length)]
        ];
        
        let charPool = charSets.lower + charSets.upper + charSets.numbers + charSets.symbols;
        const phraseWithoutSpaces = phrase.replace(/\s/g, '');
        if(phraseWithoutSpaces) charPool += phraseWithoutSpaces;
        
        let remainingLen = profile.len - guaranteedChars.length;
        let fillingChars = Array.from({length: remainingLen}, () => charPool[Math.floor(rand() * charPool.length)]);
        
        let passArray = guaranteedChars.concat(fillingChars);

        for (let i = passArray.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [passArray[i], passArray[j]] = [passArray[j], passArray[i]];
        }
        
        return passArray.join('');
    }

    // --- Mock Backend Functions ---
    async function mockPwnedCheckAPI(password) {
        console.log("Simulating API call to check if password was breached...");
        return new Promise(resolve => setTimeout(() => resolve(password.includes("123")), 1000));
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Particle.js Background ---
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#58a6ff' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#58a6ff', opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });

    // --- DOM Elements ---
    const reloadBtn = document.getElementById('reloadBtn');
    const strengthBtns = document.querySelectorAll('.strength-btn');
    const userInput = document.getElementById('userInput');
    const generateBtn = document.getElementById('generateBtn');
    const passwordOutput = document.getElementById('passwordOutput');
    const copyBtn = document.getElementById('copyBtn');
    const copySuccess = document.getElementById('copy-success');
    
    let selectedStrength = 'strong'; // Default strength

    // --- Initial Animation ---
    anime({ targets: '.step', opacity: [0, 1], translateY: [20, 0], duration: 800, delay: anime.stagger(200) });

    // --- Event Listeners ---
    reloadBtn.addEventListener('click', () => {
        location.reload(); // The simplest and most effective way to reset everything
    });

    strengthBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            strengthBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedStrength = btn.dataset.strength;
        });
    });

    generateBtn.addEventListener('click', () => {
        if (!userInput.value) {
            alert("Please enter a memorable phrase to begin.");
            return;
        }

        const password = generatePassword(userInput.value, selectedStrength);
        passwordOutput.textContent = password;
        
        anime({ targets: '#step4', opacity: [0, 1], translateY: [20, 0], duration: 800 });
    });

    copyBtn.addEventListener('click', () => { /* ... (no change from before) ... */ });

    // --- Advanced Password Generation Logic ---
    function generatePassword(phrase, strength) {
        const strengthProfiles = {
            good: { len: 12, symbols: false, upper: true, numbers: true },
            strong: { len: 16, symbols: true, upper: true, numbers: true },
            unbreakable: { len: 24, symbols: true, upper: true, numbers: true }
        };

        const profile = strengthProfiles[strength];
        let password = phrase.replace(/\s/g, ''); // Remove spaces
        
        // Character substitutions from the original idea
        const charMap = { 'a': '@', 'e': '3', 'i': '1', 'o': '0', 's': '$', 't': '7' };
        password = password.toLowerCase().split('').map(char => charMap[char] || char).join('');

        // Ensure length requirement
        while (password.length < profile.len) {
            password += phrase.charAt(Math.floor(Math.random() * phrase.length));
        }
        password = password.slice(0, profile.len);
        
        // Ensure character type requirements
        if (profile.upper && !/[A-Z]/.test(password)) {
            let i = Math.floor(Math.random() * password.length);
            password = password.substring(0, i) + password.charAt(i).toUpperCase() + password.substring(i + 1);
        }
        if (profile.numbers && !/\d/.test(password)) {
            password += Math.floor(Math.random() * 10);
        }
        if (profile.symbols && !/[!@#$%^&*]/.test(password)) {
            const symbols = "!@#$%^&*";
            password += symbols.charAt(Math.floor(Math.random() * symbols.length));
        }

        // Final trim and shuffle
        return password.slice(0, profile.len).split('').sort(() => 0.5 - Math.random()).join('');
    }
});
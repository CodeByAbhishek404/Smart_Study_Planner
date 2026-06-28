/* Smart Study Planner - Theme Persistence & Preloader Manager */

// Dynamic Preloader & Theme Injector (runs instantly to prevent layout/theme flashes)
(function() {
    // 1. Read theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
    }

    // 2. Inject Preloader Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #app-preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #090d16;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            transition: opacity 0.6s cubic-bezier(0.77, 0, 0.175, 1), visibility 0.6s;
            pointer-events: all;
        }
        html.light-theme #app-preloader,
        body.light-theme #app-preloader {
            background: #f1f5f9;
        }
        .loader-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
        }
        .quantum-spinner {
            position: relative;
            width: 120px;
            height: 120px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .quantum-spinner .core {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50%;
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.8);
            animation: corePulse 1.5s ease-in-out infinite alternate;
        }
        .quantum-spinner .ring {
            position: absolute;
            border: 3px solid transparent;
            border-radius: 50%;
            animation: rotateRing 2s linear infinite;
        }
        .quantum-spinner .ring-1 {
            width: 110px;
            height: 110px;
            border-top-color: #6366f1;
            animation-duration: 1.6s;
        }
        .quantum-spinner .ring-2 {
            width: 86px;
            height: 86px;
            border-right-color: #8b5cf6;
            animation-direction: reverse;
            animation-duration: 1.2s;
        }
        .quantum-spinner .ring-3 {
            width: 62px;
            height: 62px;
            border-bottom-color: #06b6d4;
            animation-duration: 0.8s;
        }
        .loader-text {
            font-family: 'Outfit', sans-serif;
            font-size: 2.4rem;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.03em;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3));
        }
        html.light-theme .loader-text,
        body.light-theme .loader-text {
            filter: none;
        }
        .loader-subtext {
            font-family: 'Inter', sans-serif;
            font-size: 0.8rem;
            color: #94a3b8;
            margin: 0;
            font-weight: 600;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            animation: textPulse 1.5s ease-in-out infinite alternate;
        }
        html.light-theme .loader-subtext,
        body.light-theme .loader-subtext {
            color: #64748b;
        }
        @keyframes rotateRing {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes corePulse {
            0% { transform: scale(0.8); box-shadow: 0 0 12px rgba(99, 102, 241, 0.5); }
            100% { transform: scale(1.2); box-shadow: 0 0 35px rgba(99, 102, 241, 1); }
        }
        @keyframes textPulse {
            0% { opacity: 0.35; }
            100% { opacity: 1; }
        }
        #app-preloader.fade-out {
            opacity: 0;
            visibility: hidden;
        }
    `;
    
    // Safety check in case document.head is not yet initialized (adds to docElement)
    if (document.head) {
        document.head.appendChild(style);
    } else {
        document.documentElement.appendChild(style);
    }

    // 3. Create Preloader Element markup
    const preloader = document.createElement('div');
    preloader.id = 'app-preloader';
    preloader.innerHTML = `
        <div class="loader-content">
            <div class="quantum-spinner">
                <div class="ring ring-1"></div>
                <div class="ring ring-2"></div>
                <div class="ring ring-3"></div>
                <div class="core"></div>
            </div>
            <h2 class="loader-text">StudyPlanner</h2>
            <p class="loader-subtext">Initializing Study Engine</p>
        </div>
    `;

    // 4. MutationObserver to prepend the preloader as soon as the body tag exists
    const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
            // Apply body classes synchronously
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
            }
            document.body.prepend(preloader);
            obs.disconnect();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // 5. Handle page fully loaded state
    window.addEventListener('load', () => {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.remove();
        }, 600); // match CSS duration
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon();
});

// Toggle dark / light theme
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Keep html tag class in sync for early layout checks
    if (isLight) {
        document.documentElement.classList.add('light-theme');
    } else {
        document.documentElement.classList.remove('light-theme');
    }
    
    updateThemeIcon();
    
    // Dispatch event so other scripts (like Chart.js instances) can listen and redraw if needed
    window.dispatchEvent(new Event('theme-changed'));
}

// Update the icon state on all theme toggle buttons present on the page
function updateThemeIcon() {
    const isLight = document.body.classList.contains('light-theme');
    const icons = document.querySelectorAll('.theme-toggle-icon');
    
    icons.forEach(icon => {
        if (isLight) {
            icon.className = 'fas fa-moon theme-toggle-icon';
            icon.style.color = '#475569';
        } else {
            icon.className = 'fas fa-sun theme-toggle-icon';
            icon.style.color = '#f59e0b';
        }
    });
}

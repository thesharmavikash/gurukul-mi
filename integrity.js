/**
 * Integrity & Proctoring Module for GURUKUL IAS
 * Handles Fullscreen, Copy-Paste Locking, and Developer Tools Prevention
 */

export const Integrity = {
    violations: 0,
    initialized: false,
    
    init() {
        if (this.initialized) return;
        this.lockUI();
        this.setupFullscreen();
        this.initialized = true;
    },

    lockUI() {
        // Prevent Context Menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Prevent Copy/Paste
        document.addEventListener('copy', e => e.preventDefault());
        document.addEventListener('paste', e => e.preventDefault());
        
        // Prevent DevTools Shortcuts
        document.addEventListener('keydown', e => {
            if (e.keyCode === 123) e.preventDefault(); // F12
            if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) e.preventDefault(); // Ctrl+Shift+I/J
            if (e.ctrlKey && e.keyCode === 85) e.preventDefault(); // Ctrl+U
        });
    },

    setupFullscreen() {
        const checkFullscreen = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
                this.recordViolation("Fullscreen Exited");
            }
        };

        const checkBlur = () => {
            if (document.hidden || !document.hasFocus()) {
                this.recordViolation("Tab/Window Switched");
            }
        };

        document.addEventListener('fullscreenchange', checkFullscreen);
        window.addEventListener('blur', checkBlur);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) checkBlur();
        });
    },

    recordViolation(reason) {
        this.violations++;
        console.warn(`Integrity Violation (${this.violations}): ${reason}`);
        this.showViolationWarning(reason);
        // Dispatch custom event for the test engine to pick up
        window.dispatchEvent(new CustomEvent('mi_violation', { detail: { reason, total: this.violations } }));
    },

    showViolationWarning(reason) {
        let warn = document.getElementById('integrity-warn');
        if (!warn) {
            warn = document.createElement('div');
            warn.id = 'integrity-warn';
            warn.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.98); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-align:center; padding:40px; backdrop-filter:blur(10px)";
            warn.innerHTML = `
                <div style="background:#111; padding:50px; border-radius:32px; border:2px solid #e11d48; max-width:500px">
                    <div style="width:80px; height:80px; background:rgba(225,29,72,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; color:#e11d48">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <h1 style="color:#e11d48; font-size:28px; font-weight:900; margin:0">INTEGRITY ALERT</h1>
                    <p id="v-reason" style="font-size:16px; margin:20px 0; color:#94a3b8"></p>
                    <p style="font-size:14px; color:#64748b; margin-bottom:30px">Multiple violations may lead to automatic disqualification. Please resume fullscreen and stay focused on the test window.</p>
                    <button id="resume-fs" style="background:#e11d48; color:#fff; border:none; padding:18px 40px; border-radius:16px; font-weight:800; cursor:pointer; width:100%; transition:0.3s">RESUME TEST</button>
                    <p style="font-size:12px; color:#444; margin-top:30px">Violation ID: GIAS-SEC-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
            `;
            document.body.appendChild(warn);
            document.getElementById('resume-fs').onclick = async () => {
                await this.requestFullscreen();
                warn.style.display = 'none';
            };
        }
        document.getElementById('v-reason').innerText = `Reason: ${reason} (Violation #${this.violations})`;
        warn.style.display = 'flex';
    }
};

import allTranslations from './translations.js';
import { MIMetadata, getCareerSuggestions } from './mappings.js';
import { Integrity } from './integrity.js';

const testId = new URLSearchParams(window.location.search).get('id') || '2';

const state = {
    lang: sessionStorage.getItem(`mi_${testId}_lang`) || 'en',
    user: JSON.parse(sessionStorage.getItem(`mi_${testId}_user`)) || { name: '', age: '', mobile: '', email: '', student_id: '', batch_code: '' },
    currentStep: parseInt(sessionStorage.getItem(`mi_${testId}_step`)) || 0,
    currentQuestionIndex: parseInt(sessionStorage.getItem(`mi_${testId}_q_idx`)) || 0,
    answers: JSON.parse(sessionStorage.getItem(`mi_${testId}_answers`)) || [],
    shuffledIndices: JSON.parse(sessionStorage.getItem(`mi_${testId}_shuffled`)) || null,
    tabSwitches: parseInt(sessionStorage.getItem(`mi_${testId}_switches`)) || 0,
    vHash: sessionStorage.getItem(`mi_${testId}_vhash`) || '',
    vUrl: sessionStorage.getItem(`mi_${testId}_vurl`) || '',
    dbQuestions: JSON.parse(sessionStorage.getItem(`mi_${testId}_questions`)) || null,
    startTime: parseInt(sessionStorage.getItem(`mi_${testId}_start`)) || null,
    testConfig: null,
    theme: localStorage.getItem('mi_theme') || 'light'
};

// Listen for Integrity Violations
window.addEventListener('mi_violation', (e) => {
    state.tabSwitches = e.detail.total;
    saveState();
});

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('mi_theme', state.theme);
    applyTheme();
    updateHeader();
}

function createWatermark() {
    if (document.getElementById('mi-watermark')) return;
    const div = document.createElement('div');
    div.id = 'mi-watermark';
    div.style = "position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:999; display:flex; flex-wrap:wrap; align-content:space-around; justify-content:space-around; opacity:0.02; font-size:18px; font-weight:bold; color:#000; transform:rotate(-30deg); overflow:hidden;";
    const watermarkText = `${state.user.name} | ${state.user.student_id} | ${state.user.mobile} | GURUKUL IAS `.repeat(50);
    div.innerText = watermarkText;
    document.body.appendChild(div);
}

async function loadData() {
    applyTheme();
    try {
        if (!state.dbQuestions) {
            const res = await fetch(`api.php?type=questions&test_id=${testId}`);
            const data = await res.json();
            if (data && Array.isArray(data) && data.length > 0) {
                state.dbQuestions = data;
                saveState();
            }
        }
        
        const resT = await fetch('api.php?type=active_tests');
        const tests = await resT.json();
        state.testConfig = tests.find(t => t.id == testId) || { name: 'Assessment', question_count: state.dbQuestions?.length || 56 };
        
        document.getElementById('test-subtitle').innerText = state.testConfig.name + ` (${state.testConfig.question_count} Questions)`;
        document.title = state.testConfig.name + " - GURUKUL IAS";

    } catch (e) { console.error('Initialization failed', e); }
    render();
}

const t = () => allTranslations[state.lang];

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function saveState() {
    sessionStorage.setItem(`mi_${testId}_lang`, state.lang);
    sessionStorage.setItem(`mi_${testId}_user`, JSON.stringify(state.user));
    sessionStorage.setItem(`mi_${testId}_step`, state.currentStep.toString());
    sessionStorage.setItem(`mi_${testId}_q_idx`, state.currentQuestionIndex.toString());
    sessionStorage.setItem(`mi_${testId}_answers`, JSON.stringify(state.answers));
    sessionStorage.setItem(`mi_${testId}_switches`, state.tabSwitches.toString());
    sessionStorage.setItem(`mi_${testId}_vhash`, state.vHash);
    sessionStorage.setItem(`mi_${testId}_vurl`, state.vUrl);
    if (state.shuffledIndices) sessionStorage.setItem(`mi_${testId}_shuffled`, JSON.stringify(state.shuffledIndices));
    if (state.dbQuestions) sessionStorage.setItem(`mi_${testId}_questions`, JSON.stringify(state.dbQuestions));
    if (state.startTime) sessionStorage.setItem(`mi_${testId}_start`, state.startTime.toString());
}

window.resetAssessment = () => {
    if (confirm(t().confirmRestart)) {
        const keys = [`mi_${testId}_lang`, `mi_${testId}_user`, `mi_${testId}_step`, `mi_${testId}_q_idx`, `mi_${testId}_answers`, `mi_${testId}_shuffled`, `mi_${testId}_switches`, `mi_${testId}_vhash`, `mi_${testId}_vurl`, `mi_${testId}_questions`, `mi_${testId}_start` ];
        keys.forEach(k => sessionStorage.removeItem(k));
        location.href = 'index.html';
    }
};

async function syncToBackend(type, data) {
    try {
        const res = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, ...data })
        });
        const result = await res.json();
        if ((type === 'registration' || type === 'quick_registration') && result.student_id) {
            state.user.student_id = result.student_id;
            saveState();
        }
        if (type === 'result' && result.v_hash) {
            state.vHash = result.v_hash;
            state.vUrl = result.v_url;
            saveState();
        }
        return result;
    } catch (e) { console.error('Sync failed', e); }
}

function updateHeader() {
    const actionsArea = document.getElementById('header-actions');
    if (actionsArea) {
        actionsArea.innerHTML = `
            <button class="action-btn theme-toggle" onclick="window.toggleTheme()" title="Toggle Theme">
                ${state.theme === 'light' 
                    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
                    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
                }
            </button>
            <button class="action-btn reset-btn" onclick="window.resetAssessment()" title="Reset">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            </button>
            <div class="lang-switcher">
                <select id="lang-select">
                    <option value="en" ${state.lang === 'en' ? 'selected' : ''}>EN</option>
                    <option value="hi" ${state.lang === 'hi' ? 'selected' : ''}>HI</option>
                </select>
            </div>
        `;
        document.getElementById('lang-select').onchange = (e) => window.switchLanguage(e.target.value);
    }
}

window.toggleTheme = toggleTheme;

window.switchLanguage = (lang) => {
    state.lang = lang;
    saveState();
    render();
};

function showModal(title, message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal">
            <h3>${title}</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function render() {
    if (!state.testConfig) return;
    if (state.currentStep === 1) createWatermark();
    updateHeader();
    const app = document.getElementById('app');
    if (state.currentStep === 0) renderRegistration(app);
    else if (state.currentStep === 1) renderTest(app);
    else renderResult(app);
}

function getQuestions() {
    if (state.dbQuestions) {
        return state.dbQuestions.map(q => state.lang === 'hi' ? q.text_hi : q.text_en);
    }
    return [];
}

function getTotalQuestions() {
    return state.testConfig?.question_count || getQuestions().length;
}

function getMaxScorePerCat() {
    return (getTotalQuestions() / 8) * 5;
}

function calculateScores() {
    const categories = Array(8).fill(0);
    state.answers.forEach((val, i) => {
        if (val !== null) {
            const cat = state.dbQuestions ? state.dbQuestions[i].cat : null;
            if (cat !== null && cat !== undefined) {
                categories[cat] += val;
            }
        }
    });
    return categories;
}

function renderRegistration(el) {
    el.innerHTML = `
        <div class="registration-form">
            <h2>${state.testConfig.name.toUpperCase()}</h2>
            <p>${state.testConfig.description.toUpperCase()}</p>
            
            <form id="reg-form" novalidate class="perfect-form">
                <div class="input-group">
                    <label>Full Name</label>
                    <input type="text" id="name" placeholder="Enter your full name" required minlength="3" value="${state.user.name}">
                </div>

                <div class="input-group">
                    <label>Age</label>
                    <input type="number" id="age" placeholder="Enter your age" required min="5" max="100" value="${state.user.age}">
                </div>

                <div class="input-group">
                    <label>Batch Access Code (Optional)</label>
                    <input type="text" id="batch_code" placeholder="e.g. CLASS-A" value="${state.user.batch_code || ''}">
                </div>

                <div class="input-group">
                    <label>Mobile Number</label>
                    <input type="tel" id="mobile" placeholder="Enter your mobile number" required pattern="[0-9]{10}" value="${state.user.mobile}">
                </div>

                <div class="input-group">
                    <label>Email ID</label>
                    <input type="email" id="email" placeholder="Enter your email ID" required value="${state.user.email}">
                </div>

                <button type="submit" class="btn-primary" style="width:100%; margin-top:30px; font-size:24px; padding: 25px;">START ASSESSMENT</button>
            </form>
        </div>
    `;
    
    document.getElementById('reg-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const age = document.getElementById('age').value;
        const mobile = document.getElementById('mobile').value.trim();
        const email = document.getElementById('email').value.trim();
        const batch_code = document.getElementById('batch_code').value.trim();

        let valid = true;
        if (name.length < 3 || !/^[0-9]{10}$/.test(mobile) || !/^\S+@\S+\.\S+$/.test(email)) valid = false;

        if (valid) {
            state.user = { name, age, mobile, email, batch_code, student_id: '' };
            const result = await syncToBackend('quick_registration', state.user);
            state.user.student_id = result?.student_id || 'GIAS-TEMP-' + Math.floor(1000 + Math.random() * 9000);
            state.currentStep = 1;
            state.startTime = Date.now();
            
            await Integrity.requestFullscreen();
            Integrity.init();

            if (!state.shuffledIndices) {
                const indices = Array.from({length: getTotalQuestions()}, (_, i) => i);
                state.shuffledIndices = shuffle(indices);
            }
            if (state.answers.length === 0) state.answers = Array(getTotalQuestions()).fill(null);
            saveState();
            render();
        }
    };
}

function renderTest(el) {
    const questions = getQuestions();
    const visibleIndices = state.shuffledIndices;
    const currentOrigIdx = visibleIndices[state.currentQuestionIndex];
    const currentVal = state.answers[currentOrigIdx];
    const progress = ((state.currentQuestionIndex + 1) / getTotalQuestions()) * 100;

    el.innerHTML = `
        <div class="test-view focus-mode-container" style="max-width: 900px; margin: 0 auto; padding: 40px 20px;">
            <div class="test-header-modern" style="margin-bottom: 60px; text-align: center;">
                <div style="font-size: 11px; color: var(--primary); font-weight: 900; letter-spacing: 4px; margin-bottom: 20px; text-transform:uppercase; opacity:0.8">COGNITIVE ANALYSIS · STAGE ${state.currentQuestionIndex + 1}</div>
                <div class="progress-container-modern" style="height: 2px; background: rgba(255,255,255,0.05); border-radius: 10px; width:100%; position:relative">
                    <div class="progress-fill-modern" style="width: ${progress}%; height: 100%; background: var(--primary); box-shadow: 0 0 20px var(--primary); transition: 1s cubic-bezier(0.19, 1, 0.22, 1);"></div>
                </div>
            </div>

            <div class="question-container-modern" id="card-${currentOrigIdx}" style="margin-bottom: 60px;">
                <h1 class="question-text-modern" style="font-size: 34px; line-height: 1.2; color: var(--text); font-weight: 900; letter-spacing:-1px; margin-bottom: 60px;">${questions[currentOrigIdx]}</h1>
                
                <div class="options-grid-modern">
                    ${[1, 2, 3, 4, 5].map(val => {
                        const labels = t().options;
                        const checked = currentVal == val;
                        return `
                            <label class="modern-option ${checked ? 'selected' : ''}">
                                <input type="radio" name="q${currentOrigIdx}" value="${val}" ${checked ? 'checked' : ''} 
                                    onchange="selectOption(${currentOrigIdx}, ${val}, event)" style="display: none;">
                                <div class="modern-option-content">
                                    <div class="opt-index">${val}</div>
                                    <div class="opt-text">${labels[val-1]}</div>
                                </div>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="navigation-modern" style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #111; padding-top: 40px;">
                <button onclick="prevQuestion()" class="nav-btn-modern" ${state.currentQuestionIndex === 0 ? 'disabled' : ''} style="background:transparent; border:none; color:#444; cursor:pointer; padding:10px">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div style="font-size:12px; color:#222; font-weight:900">GURUKUL IAS SECURE ASSESSMENT</div>
                ${state.currentQuestionIndex === getTotalQuestions() - 1 
                    ? `<button onclick="finishTest()" class="submit-btn-modern">SUBMIT TEST</button>`
                    : `<button onclick="nextQuestion()" class="submit-btn-modern" ${currentVal === null ? 'disabled' : ''}>NEXT STEP</button>`
                }
            </div>
        </div>
    `;
}

window.selectOption = (idx, val, event) => {
    state.answers[idx] = val;
    saveState();
    setTimeout(() => {
        if (state.currentQuestionIndex < getTotalQuestions() - 1) nextQuestion();
        else render();
    }, 300);
};

window.nextQuestion = () => {
    if (state.currentQuestionIndex < getTotalQuestions() - 1) {
        state.currentQuestionIndex++;
        saveState();
        render();
    }
};

window.prevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        saveState();
        render();
    }
};

window.finishTest = () => {
    if (state.answers.includes(null)) {
        showModal("Incomplete", "Please answer all questions before finishing.");
        return;
    }
    if (confirm("Are you sure you want to submit your answers?")) {
        state.currentStep = 2;
        saveState();
        window.scrollTo(0, 0);
        render();
    }
};

function getTotalGrade(total) {
    const max = getTotalQuestions() * 5;
    if (total >= max * 0.8) return { grade: 'Highly Multi-Faceted', interpretation: 'Strong confidence in all styles.' };
    if (total >= max * 0.5) return { grade: 'Standard/Balanced', interpretation: 'Clear strengths and some growth areas.' };
    return { grade: 'Highly Specialized', interpretation: 'Relies on specific learning ways.' };
}

async function renderResult(el) {
    const scores = calculateScores();
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const totalResult = getTotalGrade(totalScore);
    const durationSec = Math.floor((Date.now() - state.startTime) / 1000);

    const allResponses = state.answers.map((val, i) => {
        const cat = state.dbQuestions ? state.dbQuestions[i].cat : null;
        return { qIndex: i, catIndex: cat, value: val };
    });

    if (!state.vHash) {
        const isSuspicious = state.tabSwitches > 5 || durationSec < (getTotalQuestions() * 1.5);
        const res = await syncToBackend('result', {
            scores: scores,
            total: totalScore,
            grade: totalResult.grade,
            test_type: state.testConfig.name,
            all_responses: allResponses,
            tab_switches: state.tabSwitches,
            duration: durationSec,
            is_suspicious: isSuspicious
        });
        state.vHash = res.v_hash;
        state.vUrl = res.v_url;
        saveState();
    }

    const sortedIndices = scores.map((s, i) => ({idx: i, score: s})).sort((a, b) => b.score - a.score);
    const top3 = sortedIndices.slice(0, 3);
    const careers = getCareerSuggestions(top3.map(t => t.idx));

    el.innerHTML = `
        <div class="result-view">
            <h2>Analysis Complete</h2>
            <div class="chart-container"><canvas id="scoreChart"></canvas></div>
            <div class="grading-card">
                <h4>Profile: ${totalResult.grade}</h4>
                <p style="color: var(--primary); font-weight: 800; font-size: 1.2rem; margin-top: 10px;">Primary Path: ${MIMetadata[top3[0].idx].name}</p>
            </div>
            <div class="interactive-guide" style="margin-top: 40px; text-align: left;">
                <h3 style="margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">Your Intelligence Breakdown</h3>
                <div class="mi-cards-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${top3.map(t => `
                        <div class="mi-detail-card" style="background:var(--card); border:1px solid var(--border); padding:20px; border-radius:16px; cursor:pointer" onclick="showMIDetail(${t.idx})">
                            <div style="display:flex; justify-content:space-between; align-items:center">
                                <h4 style="color:var(--primary); margin:0">${MIMetadata[t.idx].name}</h4>
                                <span class="badge" style="background:var(--primary); color:#fff">${t.score}</span>
                            </div>
                            <p style="font-size:12px; color:var(--secondary-text); margin:10px 0">${MIMetadata[t.idx].desc}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="career-mapping-card" style="background:rgba(225, 29, 72, 0.05); border:1px dashed var(--primary); padding:25px; border-radius:20px; margin-top:20px">
                    <h4 style="margin:0; font-size:14px; color:var(--secondary-text)">RECOMMENDED CAREER PATHS</h4>
                    <p style="font-size:22px; font-weight:900; margin:10px 0">${careers}</p>
                </div>
            </div>
            <div class="result-actions" style="margin-top:50px">
                <button id="download-btn" class="btn-primary">Download Report</button>
                <button onclick="window.resetAssessment()" class="btn-secondary">Start New</button>
            </div>
        </div>
    `;

    const ctx = document.getElementById('scoreChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: t().categories,
            datasets: [{
                data: scores,
                backgroundColor: 'rgba(225, 29, 72, 0.2)',
                borderColor: 'rgb(225, 29, 72)',
                borderWidth: 3,
                pointBackgroundColor: 'rgb(159, 18, 57)',
                pointRadius: 4
            }]
        },
        options: {
            scales: { r: { beginAtZero: true, max: getMaxScorePerCat(), ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });

    document.getElementById('download-btn').onclick = generatePDF;
}

window.showMIDetail = (idx) => {
    const m = MIMetadata[idx];
    showModal(m.name, `
        <div style="text-align:left; color:var(--text)">
            <p>${m.desc}</p>
            <p><strong>Personalities:</strong> ${m.personalities}</p>
            <p><strong>Tips:</strong> ${m.tips}</p>
            <p><strong>Careers:</strong> ${m.careers}</p>
        </div>
    `);
};

async function generatePDF() {
    const downloadBtn = document.getElementById('download-btn');
    const originalText = downloadBtn.innerText;
    downloadBtn.innerText = "Generating Report...";
    downloadBtn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        const scores = calculateScores();
        const scoreLabels = t().categories;
        const totalScore = scores.reduce((a, b) => a + b, 0);
        const totalResult = getTotalGrade(totalScore);
        const maxPossible = getTotalQuestions() * 5;
        
        document.body.classList.add('printing');

        const certContainer = document.createElement('div');
        certContainer.style.position = 'absolute';
        certContainer.style.left = '-9999px'; certContainer.style.top = '0'; certContainer.style.width = '1200px';
        certContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(certContainer);

        certContainer.innerHTML = `
            <div id="p1" style="background:#fff; color:#000; padding:20px; width:1200px; height:850px; font-family:'Inter', sans-serif">
                <div style="background:#fff; border:15px solid #000; padding:60px 80px; height:100%; box-sizing:border-box; position:relative; border-image: linear-gradient(45deg, #be123c, #000) 1;">
                    
                    <!-- Top Section: Logo & QR -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px">
                        <div style="display:flex; align-items:center; gap:20px">
                            <img src="assets/images/gurukul_ias.jpeg" alt="Logo" style="width:100px; height:100px; border-radius:20px; border:3px solid #e11d48">
                            <div>
                                <div style="font-size:48px; font-weight:900; color:#e11d48; letter-spacing:-2px; line-height:1">GURUKUL IAS</div>
                                <div style="font-size:12px; font-weight:800; color:#555; margin-top:5px; text-transform:uppercase; letter-spacing:2px">Center for Cognitive Excellence</div>
                            </div>
                        </div>
                        <div style="text-align:center">
                            <div id="qrcode" style="padding:10px; background:#fff; border:1px solid #eee; border-radius:15px; margin-bottom:8px"></div>
                            <div style="font-size:10px; font-weight:900; color:#999; letter-spacing:1px">SECURE VERIFICATION</div>
                        </div>
                    </div>

                    <div style="text-align:center; margin-bottom:50px">
                        <div style="font-size:22px; font-weight:800; color:#000; letter-spacing:8px; text-transform:uppercase; margin-bottom:20px; opacity:0.3">CERTIFICATE OF ACHIEVEMENT</div>
                        <div style="font-size:16px; font-weight:600; color:#666; margin-bottom:10px italic">This premium document is awarded to</div>
                        <div style="font-size:64px; font-weight:900; color:#000; letter-spacing:-2px; line-height:1.1; border-bottom:4px solid #e11d48; display:inline-block; padding:0 40px; margin-bottom:15px">${state.user.name.toUpperCase()}</div>
                        <div style="font-size:18px; font-weight:700; color:#444; margin-top:10px">FOR OUTSTANDING PERFORMANCE IN THE MULTIPLE INTELLIGENCES ASSESSMENT</div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:60px; margin-bottom:50px">
                        <div style="background:#f8fafc; padding:30px; border-radius:32px; border:2px solid #f1f5f9; display:flex; flex-direction:column; justify-content:center">
                            <div style="font-size:12px; font-weight:900; color:#be123c; margin-bottom:10px; letter-spacing:2px">COGNITIVE ARCHETYPE</div>
                            <div style="font-size:32px; font-weight:900; color:#000; line-height:1.2">${totalResult.grade.toUpperCase()}</div>
                            <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e2e8f0; font-size:14px; color:#64748b; line-height:1.5">${totalResult.interpretation}</div>
                        </div>
                        <div style="background:#000; color:#fff; padding:30px; border-radius:32px; border:2px solid #111; position:relative; overflow:hidden">
                            <div style="position:absolute; top:-20px; right:-20px; width:100px; height:100px; background:var(--primary); filter:blur(40px); opacity:0.3"></div>
                            <div style="font-size:12px; font-weight:900; color:#be123c; margin-bottom:10px; letter-spacing:2px">AGGREGATE SCORE</div>
                            <div style="font-size:54px; font-weight:900; color:#fff">${totalScore}<span style="font-size:24px; color:#444"> / ${maxPossible}</span></div>
                            <div style="margin-top:10px; font-size:12px; font-weight:900; color:var(--primary); text-transform:uppercase">Global Percentile: ${Math.round((totalScore/maxPossible)*100)}%</div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 500px 1fr; gap:60px; align-items:center">
                        <div style="background:#fff; border-radius:32px; padding:20px; border:1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.05)">
                            <canvas id="certChart" width="460" height="320"></canvas>
                        </div>
                        <div>
                            <div style="font-size:14px; font-weight:900; color:#000; margin-bottom:20px; letter-spacing:2px; border-left:4px solid #e11d48; padding-left:15px">INTELLECTUAL DIMENSIONS</div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                                ${scoreLabels.map((label, i) => `
                                    <div style="background:#f8fafc; padding:15px; border-radius:16px; border:1px solid #f1f5f9">
                                        <div style="font-size:9px; color:#64748b; font-weight:900; text-transform:uppercase">${label}</div>
                                        <div style="font-size:20px; color:#000; font-weight:900">${scores[i]}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Certification Seal -->
                    <div style="position:absolute; bottom:60px; right:80px; text-align:center">
                        <div style="width:150px; height:150px; background:radial-gradient(circle, #e11d48 0%, #9f1239 100%); color:#fff; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow: 0 10px 20px rgba(159, 18, 57, 0.3); border:4px double rgba(255,255,255,0.2)">
                            <div style="font-size:10px; font-weight:900; letter-spacing:1px">OFFICIAL</div>
                            <div style="font-size:24px; font-weight:900">SEAL</div>
                            <div style="font-size:8px; font-weight:800; opacity:0.6; margin-top:5px">AUTHENTICATED</div>
                        </div>
                    </div>

                    <div style="position:absolute; bottom:60px; left:80px">
                        <div style="font-size:11px; color:#999; font-weight:700">
                            <div style="margin-bottom:5px">CANDIDATE ID: <span style="color:#000">${state.user.student_id}</span></div>
                            <div style="margin-bottom:5px">VERIFICATION HASH: <span style="color:#000">${state.vHash.substring(0,20).toUpperCase()}</span></div>
                            <div>ISSUED ON: <span style="color:#000">${new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'long', year:'numeric'}).toUpperCase()}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Generate QR Code with better styling
        new QRCode(document.getElementById("qrcode"), {
            text: state.vUrl,
            width: 90,
            height: 90,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        const ctx = document.getElementById('certChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: { labels: scoreLabels, datasets: [{ data: scores, backgroundColor: 'rgba(225, 29, 72, 0.15)', borderColor: '#e11d48', borderWidth: 5, pointRadius: 0 }] },
            options: { animation: false, responsive: false, scales: { r: { beginAtZero: true, max: getMaxScorePerCat(), grid: { color: '#eee', lineWidth:1 }, angleLines: { color: '#eee' }, ticks: { display: false } } }, plugins: { legend: { display: false } } }
        });

        // Add 3 seconds for Chart.js and QRCode to render perfectly
        await new Promise(r => setTimeout(r, 3000));
        
        const canvas1 = await html2canvas(document.getElementById('p1'), { scale: 2, useCORS: true, logging: false });
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas1.width, canvas1.height] });
        pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, canvas1.width, canvas1.height);

        // BREAKDOWN PAGE
        pdf.addPage();
        const breakdownEl = document.createElement('div');
        breakdownEl.style.width = '1200px'; breakdownEl.style.padding = '80px'; breakdownEl.style.backgroundColor = '#fff';
        breakdownEl.innerHTML = `
            <div style="font-family:'Inter', sans-serif; color:#000">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:8px solid #e11d48; padding-bottom:30px; margin-bottom:50px">
                    <div>
                        <div style="font-size:14px; font-weight:900; color:#e11d48; letter-spacing:3px; text-transform:uppercase">Detailed Analytics</div>
                        <h1 style="color:#000; font-size:48px; margin:0; font-weight:900; letter-spacing:-2px">INTELLIGENCE BLUEPRINT</h1>
                    </div>
                    <div style="text-align:right; font-size:16px; font-weight:900; color:#555; text-transform:uppercase">${state.user.name}</div>
                </div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px">
                    ${Object.values(MIMetadata).map((m, i) => `
                        <div style="background:#f8fafc; border:1px solid #f1f5f9; padding:30px; border-radius:32px; position:relative">
                            <div style="position:absolute; top:30px; right:30px; font-size:32px; font-weight:900; color:rgba(225,29,72,0.1)">0${i+1}</div>
                            <h3 style="margin:0 0 15px 0; color:#e11d48; font-size:20px; font-weight:900; text-transform:uppercase">${m.name}</h3>
                            <p style="font-size:14px; color:#475569; line-height:1.6; margin-bottom:20px; font-weight:600">${m.desc}</p>
                            <div style="background:#fff; border:1px solid #e2e8f0; padding:15px; border-radius:16px; font-size:12px; color:#000">
                                <span style="color:#e11d48; font-weight:900">PROMINENT FIGURE:</span> ${m.personalities}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top:60px; padding:40px; background:#000; border-radius:40px; text-align:center; border:2px solid #e11d48; position:relative; overflow:hidden">
                    <div style="position:absolute; bottom:-30px; left:-30px; width:200px; height:200px; background:#e11d48; filter:blur(100px); opacity:0.2"></div>
                    <div style="font-size:14px; color:#be123c; font-weight:900; margin-bottom:15px; letter-spacing:4px">OPTIMIZED CAREER TRAJECTORIES</div>
                    <div style="font-size:32px; font-weight:900; color:#fff; letter-spacing:-1px">${getCareerSuggestions(scores.map((s,i)=>({i,s})).sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.i))}</div>
                </div>
            </div>
        `;
        document.body.appendChild(breakdownEl);
        const canvas2 = await html2canvas(breakdownEl, { scale: 2, logging: false });
        pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, canvas1.width, canvas1.height);
        document.body.removeChild(breakdownEl);

        const pdfBase64 = pdf.output('datauristring');
        await syncToBackend('save_pdf', { v_hash: state.vHash, pdf_base64: pdfBase64 });

        pdf.save(`${state.user.student_id}_MI_Report.pdf`);
        document.body.removeChild(certContainer);
        document.body.classList.remove('printing');
    } catch (err) {
        console.error('PDF error:', err);
        document.body.classList.remove('printing');
    } finally {
        downloadBtn.innerText = originalText;
        downloadBtn.disabled = false;
    }
}

loadData();
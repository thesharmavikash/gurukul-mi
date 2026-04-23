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
    if (state.shuffledIndices) sessionStorage.setItem(`mi_${testId}_shuffled`, JSON.stringify(state.shuffledIndices));
    if (state.dbQuestions) sessionStorage.setItem(`mi_${testId}_questions`, JSON.stringify(state.dbQuestions));
    if (state.startTime) sessionStorage.setItem(`mi_${testId}_start`, state.startTime.toString());
}

window.resetAssessment = () => {
    if (confirm(t().confirmRestart)) {
        const keys = [`mi_${testId}_lang`, `mi_${testId}_user`, `mi_${testId}_step`, `mi_${testId}_q_idx`, `mi_${testId}_answers`, `mi_${testId}_shuffled`, `mi_${testId}_switches`, `mi_${testId}_vhash`, `mi_${testId}_questions`, `mi_${testId}_start` ];
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
        if (type === 'registration' && result.student_id) {
            state.user.student_id = result.student_id;
            saveState();
        }
        if (type === 'result' && result.v_hash) {
            state.vHash = result.v_hash;
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
            const catIndex = state.dbQuestions ? state.dbQuestions[i].cat : (i % 8);
            categories[catIndex] += val;
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
            const result = await syncToBackend('registration', state.user);
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
        <div class="test-view focus-mode-container">
            <div class="progress-bar-container">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            
            <div class="test-header">
                <h3>Question ${state.currentQuestionIndex + 1} of ${getTotalQuestions()}</h3>
                <div class="student-badge">${state.user.student_id}</div>
            </div>

            <div class="question-card" id="card-${currentOrigIdx}">
                <p class="question-text">${questions[currentOrigIdx]}</p>
                <div class="options">
                    ${[1, 2, 3, 4, 5].map(val => {
                        const labels = t().options;
                        const checked = currentVal == val;
                        return `
                            <label class="option-label ${checked ? 'selected' : ''}">
                                <input type="radio" name="q${currentOrigIdx}" value="${val}" ${checked ? 'checked' : ''} 
                                    onchange="selectOption(${currentOrigIdx}, ${val}, event)">
                                <span class="option-circle">${val}</span>
                                <span class="option-desc">${labels[val-1]}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="form-actions">
                <button onclick="prevQuestion()" class="btn-secondary" ${state.currentQuestionIndex === 0 ? 'disabled' : ''}>PREVIOUS</button>
                ${state.currentQuestionIndex === getTotalQuestions() - 1 
                    ? `<button onclick="finishTest()" class="btn-primary">FINISH TEST</button>`
                    : `<button onclick="nextQuestion()" class="btn-primary" ${currentVal === null ? 'disabled' : ''}>NEXT QUESTION</button>`
                }
            </div>
            
            <p style="margin-top:30px; font-size:12px; color:var(--secondary-text)">Progress automatically saved. Stay focused.</p>
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

function getCategoryGrade(score) {
    const max = (getTotalQuestions()/8)*5;
    if (score >= max * 0.8) return { grade: 'A', label: 'Strength', desc: 'This is your Superpower.' };
    if (score >= max * 0.57) return { grade: 'B', label: 'Strength', desc: 'Very good at this.' };
    if (score >= max * 0.34) return { grade: 'C', label: 'Developing', desc: 'Takes more effort.' };
    return { grade: 'D', label: 'Emerging', desc: 'Not natural.' };
}

async function renderResult(el) {
    const scores = calculateScores();
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const totalResult = getTotalGrade(totalScore);
    const durationSec = Math.floor((Date.now() - state.startTime) / 1000);

    const allResponses = state.answers.map((val, i) => ({
        qIndex: i,
        catIndex: state.dbQuestions ? state.dbQuestions[i].cat : (i % 8),
        value: val
    }));

    if (!state.vHash) {
        const isSuspicious = state.tabSwitches > 5 || durationSec < (getTotalQuestions() * 1.5);
        const res = await syncToBackend('result', {
            user: state.user,
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
    downloadBtn.innerText = "Generating...";
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
        certContainer.style.left = '0'; certContainer.style.top = '0'; certContainer.style.width = '1100px';
        certContainer.style.backgroundColor = '#ffffff'; certContainer.style.zIndex = '-999';
        document.body.appendChild(certContainer);

        certContainer.innerHTML = `
            <div id="p1" style="background:#fff; color:#000; padding:15px; width:1100px; height:800px">
                <div style="background:#fff; border:6px double #be123c; padding:30px 50px; height:100%; box-sizing:border-box">
                    <div style="text-align:center; margin-bottom:15px;">
                        <img src="gurukul_ias.jpeg" alt="Logo" style="width:70px; height:70px; border-radius:10px;">
                        <div style="font-size:38px; font-weight:900; color:#e11d48; margin-top:5px;">GURUKUL IAS</div>
                    </div>
                    <div style="text-align:center; font-size:28px; font-weight:bold; margin-bottom:15px; font-style:italic;">Learning Profile Certificate</div>
                    <div style="text-align:center; font-size:32px; font-weight:900; border-bottom:1px solid #e2e8f0; margin:5px 0 15px;">${state.user.name}</div>
                    <div style="display:table; width:100%; background:#fef2f2; padding:15px; border-radius:10px; margin-bottom:15px; text-align:center;">
                        <div style="display:table-cell; width:50%;"><div style="font-size:22px; font-weight:900;">${totalScore} / ${maxPossible}</div></div>
                        <div style="display:table-cell; width:50%;"><div style="font-size:18px; font-weight:900;">${totalResult.grade}</div></div>
                    </div>
                    <div style="display:table; width:100%;">
                        <div style="display:table-cell; width:450px;"><canvas id="certChart"></canvas></div>
                        <div style="display:table-cell; vertical-align:top; padding-left:30px">
                            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                                ${scoreLabels.map((label, i) => `
                                    <tr><td style="padding:6px; border:1px solid #e2e8f0;"><strong>${label}</strong></td><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">${scores[i]}</td></tr>
                                `).join('')}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const ctx = document.getElementById('certChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: { labels: scoreLabels, datasets: [{ data: scores, backgroundColor: 'rgba(225, 29, 72, 0.2)', borderColor: '#e11d48', borderWidth: 2 }] },
            options: { animation: false, responsive: false, scales: { r: { beginAtZero: true, max: getMaxScorePerCat(), ticks: { display: false } } }, plugins: { legend: { display: false } } }
        });

        await new Promise(r => setTimeout(r, 2200));
        const canvas1 = await html2canvas(document.getElementById('p1'), { scale: 2 });
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas1.width, canvas1.height] });
        pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, canvas1.width, canvas1.height);

        pdf.addPage();
        const breakdownEl = document.createElement('div');
        breakdownEl.style.width = '1100px'; breakdownEl.style.padding = '50px'; breakdownEl.style.backgroundColor = '#fff';
        breakdownEl.innerHTML = `
            <div style="font-family:sans-serif; color:#000">
                <h1 style="color:#e11d48; border-bottom:2px solid #e11d48; padding-bottom:10px">Advanced Personality Breakdown</h1>
                <div style="margin-top:30px; display:grid; grid-template-columns:1fr 1fr; gap:30px">
                    ${Object.values(MIMetadata).map(m => `
                        <div style="margin-bottom:25px; border-left:4px solid #f1f5f9; padding-left:20px">
                            <h3 style="margin:0; color:#e11d48">${m.name}</h3>
                            <p style="font-size:14px; color:#475569; margin:5px 0">${m.desc}</p>
                            <p style="font-size:12px"><strong>Famous personality:</strong> ${m.personalities}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(breakdownEl);
        const canvas2 = await html2canvas(breakdownEl, { scale: 2 });
        pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, canvas1.width, canvas1.height);
        document.body.removeChild(breakdownEl);

        pdf.save(`${state.user.student_id}_Report.pdf`);
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

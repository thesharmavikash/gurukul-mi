import allTranslations from './translations.js';
import { MIMetadata, getCareerSuggestions } from './mappings.js';
import { Integrity } from './integrity.js';

const state = {
    lang: sessionStorage.getItem('mi100_lang') || 'en',
    user: JSON.parse(sessionStorage.getItem('mi100_user')) || { name: '', age: '', mobile: '', email: '', student_id: '' },
    currentStep: parseInt(sessionStorage.getItem('mi100_step')) || 0,
    answers: JSON.parse(sessionStorage.getItem('mi100_answers')) || [],
    shuffledIndices: JSON.parse(sessionStorage.getItem('mi100_shuffled')) || null,
    tabSwitches: parseInt(sessionStorage.getItem('mi100_switches')) || 0,
    vHash: sessionStorage.getItem('mi100_vhash') || '',
    dbQuestions: null
};

// Initialize Integrity
if (state.currentStep === 1) Integrity.init();

async function loadDBQuestions() {
    try {
        const res = await fetch('api.php?type=questions&test_type=100');
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
            state.dbQuestions = data;
        }
    } catch (e) { console.error('DB Questions load failed', e); }
    render();
}

const t = () => allTranslations[state.lang];

// Proctoring Logic
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.currentStep > 0 && state.currentStep === 1) {
        state.tabSwitches++;
        saveState();
        showProctoringAlert();
    }
});

function showProctoringAlert() {
    let alertBox = document.getElementById('proctor-alert');
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'proctor-alert';
        alertBox.className = 'proctoring-alert';
        document.body.appendChild(alertBox);
    }
    alertBox.innerText = "Warning: Tab switching is monitored.";
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function saveState() {
    sessionStorage.setItem('mi100_lang', state.lang);
    sessionStorage.setItem('mi100_user', JSON.stringify(state.user));
    sessionStorage.setItem('mi100_step', state.currentStep.toString());
    sessionStorage.setItem('mi100_answers', JSON.stringify(state.answers));
    sessionStorage.setItem('mi100_switches', state.tabSwitches.toString());
    sessionStorage.setItem('mi100_vhash', state.vHash);
    if (state.shuffledIndices) sessionStorage.setItem('mi100_shuffled', JSON.stringify(state.shuffledIndices));
}

window.resetAssessment = () => {
    if (confirm(t().confirmRestart)) {
        sessionStorage.clear();
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
    const subtitle = document.querySelector('.brand-text p');
    if (subtitle) subtitle.innerText = "Professional Intelligence Mapping (100 Questions)";
    
    const actionsArea = document.getElementById('header-actions');
    if (actionsArea) {
        actionsArea.innerHTML = `
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
    return []; // Should not happen with loadDBQuestions
}

function getTotalQuestions() {
    return getQuestions().length;
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
            <h2>Professional Assessment (100 Questions)</h2>
            <p>Our most detailed intelligence mapping profile.</p>
            <form id="reg-form" novalidate>
                <div class="input-group">
                    <label for="name">${t().labelName}</label>
                    <input type="text" id="name" placeholder="${t().placeholderName}" required minlength="3" value="${state.user.name}">
                    <div class="error-msg" id="error-name" style="color: #e11d48; font-size: 12px; margin-top: 5px; font-weight: bold;"></div>
                </div>
                <div class="input-group">
                    <label for="age">${t().labelAge}</label>
                    <input type="number" id="age" placeholder="${t().placeholderAge}" required min="5" max="100" value="${state.user.age}">
                    <div class="error-msg" id="error-age" style="color: #e11d48; font-size: 12px; margin-top: 5px; font-weight: bold;"></div>
                </div>
                <div class="input-group">
                    <label for="mobile">${t().labelMobile}</label>
                    <input type="tel" id="mobile" placeholder="${t().placeholderMobile}" required pattern="[0-9]{10}" value="${state.user.mobile}">
                    <div class="error-msg" id="error-mobile" style="color: #e11d48; font-size: 12px; margin-top: 5px; font-weight: bold;"></div>
                </div>
                <div class="input-group">
                    <label for="email">${t().labelEmail}</label>
                    <input type="email" id="email" placeholder="${t().placeholderEmail}" required value="${state.user.email}">
                    <div class="error-msg" id="error-email" style="color: #e11d48; font-size: 12px; margin-top: 5px; font-weight: bold;"></div>
                </div>
                <button type="submit" class="btn-primary">${t().btnStart}</button>
            </form>
        </div>
    `;
    
    document.getElementById('reg-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const age = document.getElementById('age').value;
        const mobile = document.getElementById('mobile').value.trim();
        const email = document.getElementById('email').value.trim();

        document.querySelectorAll('.error-msg').forEach(e => e.innerText = '');
        let valid = true;
        if (name.length < 3) { valid = false; document.getElementById('error-name').innerText = "Name too short"; }
        if (!age || age < 5 || age > 100) { valid = false; document.getElementById('error-age').innerText = "Invalid age"; }
        if (!/^[0-9]{10}$/.test(mobile)) { valid = false; document.getElementById('error-mobile').innerText = "10-digit mobile required"; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { valid = false; document.getElementById('error-email').innerText = "Invalid email"; }

        if (valid) {
            state.user = { name, age, mobile, email, student_id: '' };
            const result = await syncToBackend('registration', state.user);
            if (result && result.student_id) {
                state.user.student_id = result.student_id;
            } else {
                state.user.student_id = 'GIAS-TEMP-' + Math.floor(1000 + Math.random() * 9000);
            }
            state.currentStep = 1;
            
            // Fullscreen Request
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
    
    let questionsHtml = visibleIndices.map((origIdx, i) => {
        const currentVal = state.answers[origIdx];
        return `
            <div class="question-card" id="card-${origIdx}">
                <p class="question-text">${i + 1}. ${questions[origIdx]}</p>
                <div class="options">
                    ${[1, 2, 3, 4, 5].map(val => {
                        const labels = t().options;
                        const checked = currentVal == val;
                        return `
                            <label class="option-label ${checked ? 'selected' : ''}">
                                <input type="radio" name="q${origIdx}" value="${val}" ${checked ? 'checked' : ''} required 
                                    onchange="selectOption(${origIdx}, ${val}, event)">
                                <span class="option-circle">${val}</span>
                                <span class="option-desc">${labels[val-1]}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    el.innerHTML = `
        <div class="test-view">
            <div class="test-header">
                <h3>100 Question Professional Profile</h3>
                <div class="student-badge">${state.user.student_id}</div>
            </div>
            <form id="test-form" novalidate>
                ${questionsHtml}
                <div class="form-actions" style="justify-content: center;">
                    <button type="submit" class="btn-primary">${t().btnFinish}</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('test-form').onsubmit = (e) => {
        e.preventDefault();
        let missing = [];
        visibleIndices.forEach(origIdx => {
            if (state.answers[origIdx] === null) {
                missing.push(origIdx);
                document.getElementById(`card-${origIdx}`).classList.add('highlight-error');
            }
        });

        if (missing.length > 0) {
            showModal("Incomplete Assessment", `Please answer all ${missing.length} remaining questions.`);
            document.getElementById(`card-${missing[0]}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (confirm(t().confirmFinish || "Finish assessment and see results?")) {
            state.currentStep = 2;
            saveState();
            window.scrollTo(0, 0);
            render();
        }
    };
}

window.selectOption = (idx, val, event) => {
    state.answers[idx] = val;
    const card = document.getElementById(`card-${idx}`);
    card.classList.remove('highlight-error');
    card.querySelectorAll('.option-label').forEach(el => el.classList.remove('selected'));
    
    let target = event.target;
    while (target && !target.classList.contains('option-label')) target = target.parentElement;
    if (target) target.classList.add('selected');
    
    saveState();
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

    const allResponses = state.answers.map((val, i) => ({
        qIndex: i,
        catIndex: state.dbQuestions ? state.dbQuestions[i].cat : (i % 8),
        value: val
    }));

    if (!state.vHash) {
        const res = await syncToBackend('result', {
            user: state.user,
            scores: scores,
            total: totalScore,
            grade: totalResult.grade,
            test_type: '100',
            all_responses: allResponses,
            tab_switches: state.tabSwitches
        });
        state.vHash = res.v_hash;
        saveState();
    }

    const sortedIndices = scores.map((s, i) => ({idx: i, score: s})).sort((a, b) => b.score - a.score);
    const top3 = sortedIndices.slice(0, 3);
    const careers = getCareerSuggestions(top3.map(t => t.idx));
    const verifyUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '/verify.php')}?v=${state.vHash}`;

    el.innerHTML = `
        <div class="result-view">
            <h2>Analysis Complete</h2>
            <div class="chart-container"><canvas id="scoreChart"></canvas></div>
            
            <div class="grading-section">
                <div class="grading-card">
                    <h4>Professional Profile: ${totalResult.grade}</h4>
                    <p style="color: var(--primary); font-weight: 800; font-size: 1.2rem; margin-top: 10px;">Primary Path: ${MIMetadata[top3[0].idx].name}</p>
                </div>
            </div>

            <div class="interactive-guide" style="margin-top: 40px; text-align: left;">
                <h3 style="margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">Your Intelligence Breakdown</h3>
                <div class="mi-cards-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${top3.map(t => `
                        <div class="mi-detail-card" style="background:#0a0a0a; border:1px solid #222; padding:20px; border-radius:16px;">
                            <div style="display:flex; justify-content:space-between; align-items:center">
                                <h4 style="color:var(--primary); margin:0">${MIMetadata[t.idx].name}</h4>
                                <span class="badge" style="background:var(--primary); color:#fff">${t.score}</span>
                            </div>
                            <p style="font-size:12px; color:#9ca3af; margin:10px 0">${MIMetadata[t.idx].desc}</p>
                            <p style="font-size:11px; color:#666"><strong>Careers:</strong> ${MIMetadata[t.idx].careers}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="career-mapping-card" style="background:rgba(225, 29, 72, 0.05); border:1px dashed var(--primary); padding:25px; border-radius:20px; margin-top:20px">
                    <h4 style="margin:0; font-size:14px; color:#666">RECOMMENDED CAREER PATHS</h4>
                    <p style="font-size:22px; font-weight:900; margin:10px 0">${careers}</p>
                    <p style="font-size:12px; color:#666">Based on your unique combination of ${MIMetadata[top3[0].idx].name} and ${MIMetadata[top3[1].idx].name} traits.</p>
                </div>
            </div>

            <div class="result-actions" style="margin-top:50px">
                <button id="download-btn" class="btn-primary">Download Detailed Report</button>
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
        const verifyUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '/verify.php')}?v=${state.vHash}`;
        
        document.body.classList.add('printing');

        const certContainer = document.createElement('div');
        certContainer.style.position = 'absolute';
        certContainer.style.left = '0'; certContainer.style.top = '0'; certContainer.style.width = '1100px';
        certContainer.style.backgroundColor = '#ffffff'; certContainer.style.zIndex = '-999';
        document.body.appendChild(certContainer);

        // PAGE 1: Certificate
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

        // PAGE 2: Breakdown
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

        pdf.save(`${state.user.student_id}_Detailed_Report.pdf`);
        syncToBackend('save_pdf', { v_hash: state.vHash, pdf_base64: pdf.output('datauristring') });
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

loadDBQuestions();
render();

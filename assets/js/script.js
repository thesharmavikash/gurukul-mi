import allTranslations from './translations.js';
import { Integrity } from './integrity.js';

const state = {
    lang: sessionStorage.getItem('mi_lang') || 'en',
    user: JSON.parse(sessionStorage.getItem('mi_user')) || { name: '', age: '', mobile: '', email: '', student_id: '' },
    currentStep: parseInt(sessionStorage.getItem('mi_step')) || 0,
    answers: JSON.parse(sessionStorage.getItem('mi_answers')) || [],
    shuffledIndices: JSON.parse(sessionStorage.getItem('mi_shuffled')) || null,
    tabSwitches: parseInt(sessionStorage.getItem('mi_switches')) || 0,
    vHash: sessionStorage.getItem('mi_vhash') || '',
    dbQuestions: null
};

// Initialize Integrity
if (state.currentStep === 1) Integrity.init();

async function loadDBQuestions() {
    try {
        const res = await fetch('api.php?type=questions&test_type=8');
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
    if (document.hidden && state.currentStep > 0 && state.currentStep <= 1) {
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
    sessionStorage.setItem('mi_lang', state.lang);
    sessionStorage.setItem('mi_user', JSON.stringify(state.user));
    sessionStorage.setItem('mi_step', state.currentStep.toString());
    sessionStorage.setItem('mi_answers', JSON.stringify(state.answers));
    sessionStorage.setItem('mi_switches', state.tabSwitches.toString());
    sessionStorage.setItem('mi_vhash', state.vHash);
    if (state.shuffledIndices) sessionStorage.setItem('mi_shuffled', JSON.stringify(state.shuffledIndices));
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
    if (subtitle) subtitle.innerText = t().subtitle;
    
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

// Helper to get questions based on current language and set
function getQuestions() {
    if (state.dbQuestions) {
        return state.dbQuestions.map(q => state.lang === 'hi' ? q.text_hi : q.text_en);
    }
    return t().questions8;
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
            <h2>${t().regTitle}</h2>
            <p>${t().regP}</p>
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
                <h3>${t().subtitle}</h3>
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
            state.currentStep = 2; // Move to results
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
    
    // Highlight current label
    let target = event.target;
    while (target && !target.classList.contains('option-label')) {
        target = target.parentElement;
    }
    if (target) target.classList.add('selected');
    
    saveState();
};

window.prevStep = () => { state.currentStep--; saveState(); render(); };

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
    return { grade: 'D', label: 'Emerging', desc: 'Not your natural way.' };
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
            test_type: getTotalQuestions().toString(),
            all_responses: allResponses,
            tab_switches: state.tabSwitches
        });
        state.vHash = res.v_hash;
        saveState();
    }

    const verifyUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '/verify.php')}?v=${state.vHash}`;

    el.innerHTML = `
        <div class="result-view">
            <h2>Analysis Complete</h2>
            <div style="text-align: center; margin-bottom: 30px;">
                <span class="student-badge">${state.user.student_id}</span>
            </div>
            <div class="chart-container"><canvas id="scoreChart"></canvas></div>
            
            <div class="result-qr-section">
                <h4>✓ Authentic Result</h4>
                <div id="result-qr" style="display:inline-block; padding:15px; background:white; border-radius:12px; border:1px solid #e2e8f0;"></div>
                <p style="font-size:12px; color:#64748b; margin-top:10px;">Scan to verify this assessment on our official portal.</p>
            </div>

            <div class="grading-section">
                <div class="grading-card">
                    <h4>Overall Result: ${totalScore} / ${getTotalQuestions() * 5}</h4>
                    <p><strong>Classification:</strong> ${totalResult.grade}</p>
                    <p><small>${totalResult.interpretation}</small></p>
                    <p style="color: #ef4444; font-size: 11px;">(Tab Switches Detected: ${state.tabSwitches})</p>
                </div>
            </div>
            <div class="result-actions">
                <button id="download-btn" class="btn-primary">Download PDF</button>
                <button onclick="window.resetAssessment()" class="btn-secondary">Start New</button>
            </div>
        </div>
    `;

    new QRCode(document.getElementById("result-qr"), {
        text: verifyUrl,
        width: 128,
        height: 128,
        colorDark : "#e11d48",
        colorLight : "#ffffff"
    });

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
        certContainer.style.left = '0';
        certContainer.style.top = '0';
        certContainer.style.width = '1100px';
        certContainer.style.backgroundColor = '#ffffff';
        certContainer.style.zIndex = '-999';
        document.body.appendChild(certContainer);

        certContainer.innerHTML = `
            <div id="certificate-content" style="background:#fff !important; color:#000 !important; padding:0; font-family:serif;">
                <div style="background:#000 !important; padding:15px;">
                    <div style="background:#fff !important; border:6px double #be123c; padding:30px 50px;">
                        <div style="text-align:center; margin-bottom:15px;">
                            <img src="gurukul_ias.jpeg" alt="Logo" style="width:70px; height:70px; border-radius:10px;">
                            <div style="font-size:38px; font-weight:900; color:#e11d48 !important; margin-top:5px;">GURUKUL IAS</div>
                            <div style="font-size:12px; color:#475569 !important;">Center for Excellence & Intelligence Mapping</div>
                        </div>

                        <div style="text-align:center; font-size:28px; font-weight:bold; color:#000 !important; margin-bottom:15px; font-style:italic;">Learning Profile Certificate</div>
                        
                        <div style="text-align:center; font-size:14px; color:#475569 !important;">This is to certify that</div>
                        <div style="text-align:center; font-size:32px; font-weight:900; color:#000 !important; border-bottom:1px solid #e2e8f0; margin:5px 0 15px;">${state.user.name}</div>
                        
                        <div style="display:table; width:100%; margin-bottom:15px; background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0; font-size:12px; color:#000 !important;">
                            <div style="display:table-cell; width:50%; padding:2px 10px;"><strong>Student ID:</strong> ${state.user.student_id}</div>
                            <div style="display:table-cell; width:50%; padding:2px 10px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                            <div style="display:table-cell; width:50%; padding:2px 10px; display:block;"><strong>Mobile:</strong> ${state.user.mobile}</div>
                            <div style="display:table-cell; width:50%; padding:2px 10px; display:block;"><strong>Email:</strong> ${state.user.email}</div>
                        </div>

                        <div style="display:table; width:100%; background:#fef2f2; padding:15px; border-radius:10px; margin-bottom:15px; text-align:center;">
                            <div style="display:table-cell; width:50%;">
                                <div style="font-size:11px; color:#9f1239 !important; font-weight:bold;">TOTAL MARKS</div>
                                <div style="font-size:22px; font-weight:900; color:#000 !important;">${totalScore} / ${maxPossible}</div>
                            </div>
                            <div style="display:table-cell; width:50%;">
                                <div style="font-size:11px; color:#9f1239 !important; font-weight:bold;">LEARNING PROFILE</div>
                                <div style="font-size:18px; font-weight:900; color:#000 !important;">${totalResult.grade}</div>
                            </div>
                        </div>

                        <div style="display:table; width:100%; border-spacing: 20px 0;">
                            <div style="display:table-cell; width:350px; vertical-align:middle;">
                                <div style="width:350px; height:350px;"><canvas id="certChart"></canvas></div>
                            </div>
                            <div style="display:table-cell; vertical-align:top;">
                                <table style="width:100%; border-collapse:collapse; font-size:10px; font-family:sans-serif;">
                                    <thead>
                                        <tr style="background:#f1f5f9;">
                                            <th style="padding:6px; border:1px solid #e2e8f0; color:#000 !important; text-align:left;">Category</th>
                                            <th style="padding:6px; border:1px solid #e2e8f0; color:#000 !important; text-align:center;">Marks</th>
                                            <th style="padding:6px; border:1px solid #e2e8f0; color:#000 !important; text-align:center;">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${scoreLabels.map((label, i) => {
                                            const cg = getCategoryGrade(scores[i]);
                                            return `
                                                <tr>
                                                    <td style="padding:4px 8px; border:1px solid #e2e8f0; color:#000 !important;"><strong>${label}</strong></td>
                                                    <td style="padding:4px; border:1px solid #e2e8f0; color:#000 !important; text-align:center;">${scores[i]}</td>
                                                    <td style="padding:4px; border:1px solid #e2e8f0; text-align:center;"><span style="padding:1px 5px; background:#fee2e2; color:#9f1239 !important; border-radius:3px; font-weight:bold;">${cg.grade}</span></td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                                <div style="margin-top:10px; font-size:9px; color:#475569 !important; line-height:1.3;">
                                    <strong>Interpretation:</strong> ${totalResult.interpretation}
                                </div>
                            </div>
                        </div>

                        <div style="margin-top:20px; display:table; width:100%;">
                            <div style="display:table-cell; text-align:left; vertical-align:bottom;">
                                <div id="cert-qr-container" style="display:inline-block; padding:5px; background:#fff; border:1px solid #e2e8f0;">
                                    <div id="cert-qr-target"></div>
                                </div>
                                <div style="font-size:9px; color:#64748b !important; margin-top:3px;">Scan to Verify Authentic Record</div>
                            </div>
                            <div style="display:table-cell; text-align:right; vertical-align:bottom;">
                                <div style="display:inline-block; text-align:center; width:180px;">
                                    <div style="border-bottom:1px solid #000; margin-bottom:5px;"></div>
                                    <div style="font-size:11px; font-weight:bold; color:#000 !important;">Authorized Signatory</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        new QRCode(document.getElementById("cert-qr-target"), { 
            text: verifyUrl, 
            width: 75, 
            height: 75,
            correctLevel: QRCode.CorrectLevel.H
        });
        const ctx = document.getElementById('certChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: { labels: scoreLabels, datasets: [{ data: scores, backgroundColor: 'rgba(225, 29, 72, 0.2)', borderColor: '#e11d48', borderWidth: 2 }] },
            options: { animation: false, responsive: false, scales: { r: { beginAtZero: true, max: getMaxScorePerCat(), ticks: { display: false } } }, plugins: { legend: { display: false } } }
        });

        await new Promise(r => setTimeout(r, 2200));

        const element = document.getElementById('certificate-content');
        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${state.user.student_id}_Certificate.pdf`);

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

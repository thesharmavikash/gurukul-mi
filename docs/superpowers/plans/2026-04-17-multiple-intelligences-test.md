# Multiple Intelligences Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone client-side web app for 100-question Multiple Intelligences test with PDF certificate download.

**Architecture:** Single Page Application (SPA) driven by a central `state` object. Views are switched by manipulating the DOM based on `state.currentStep`. `sessionStorage` provides persistence.

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+), Chart.js (CDN), jsPDF & html2canvas (CDN).

---

### Task 1: Project Structure & Data

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `script.js`
- Create: `questions.js`

- [ ] **Step 1: Create `questions.js` with the 100 questions array**
```javascript
const questions = [
  "I pride myself on having a large vocabulary.",
  "Using numbers and numerical symbols is easy for me.",
  "Music is very important to me in daily life.",
  "I always know where I am in relation to my home.",
  "I consider myself an athlete.",
  "I feel like people of all ages like me.",
  "I often look for weaknesses in myself that I see in others.",
  "The world of plants and animals is important to me.",
  "I enjoy learning new words and do so easily.",
  "I often develop equations to describe relationships and/or to explain my observations.",
  "I have wide and varied musical interests including both classical and contemporary.",
  "I do not get lost easily and can orient myself with either maps or landmarks.",
  "I feel really good about being physically fit.",
  "I like to be with all different types of people.",
  "I often think about the influence I have on others.",
  "I enjoy my pets.",
  "I love to read and do so daily.",
  "I often see mathematical ratios in the world around me.",
  "I have a very good sense of pitch, tempo, and rhythm.",
  "Knowing directions is easy for me.",
  "I have good balance and eye-hand coordination and enjoy sports which use a ball.",
  "I respond to all people enthusiastically, free of bias or prejudice.",
  "I believe that I am responsible for my actions and who I am.",
  "I like learning about nature.",
  "I enjoy hearing challenging lectures.",
  "Math has always been one of my favorite classes.",
  "My music education began when I was younger and still continues today.",
  "I have the ability to represent what I see by drawing or painting.",
  "My outstanding coordination and balance let me excel in high-speed activities.",
  "I enjoy new or unique social situations.",
  "I try not to waste my time on trivial pursuits.",
  "I enjoy caring for my house plants.",
  "I like to keep a daily journal of my daily experiences.",
  "I like to think about numerical issues and examine statistics.",
  "I am good at playing an instrument and singing.",
  "My ability to draw is recognized and complimented by others.",
  "I like being outdoors, enjoy the change in seasons, and look forward to different physical activities each season.",
  "I enjoy complimenting others when they have done well.",
  "I often think about the problems in my community, state, and/or world and what I can do to help rectify any of them.",
  "I enjoy hunting and fishing.",
  "I read and enjoy poetry and occasionally write my own.",
  "I seem to understand things around me through a mathematical sense.",
  "I can remember the tune of a song when asked.",
  "I can easily duplicate color, form, shading, and texture in my work.",
  "I like the excitement of personal and team competition.",
  "I am quick to sense in others dishonesty and desire to control me.",
  "I am always totally honest with myself.",
  "I enjoy hiking in natural places.",
  "I talk a lot and enjoy telling stories.",
  "I enjoy doing puzzles.",
  "I take pride in my musical accomplishments.",
  "Seeing things in three dimensions is easy for me, and I like to make things in three dimensions.",
  "I like to move around a lot.",
  "I feel safe when I am with strangers.",
  "I enjoy being alone and thinking about my life and myself.",
  "I look forward to visiting the zoo.",
  "I am a private person and I like my private inner world.",
  "I like to move, tap or fidget when sitting.",
  "I work best in an organized work area.",
  "I have a collection (e.g. shells, mugs, rocks, hockey cards).",
  "I work best through interaction with people.",
  "I like puns and other wordplay.",
  "I play music in my head.",
  "I understand colour combinations and what colours work well together.",
  "I feel comfortable and get positive reinforcement when dealing with language and words.",
  "I enjoy solving jigsaw, maze and/or other visual puzzles.",
  "I notice similarities and differences in trees, flowers and other things in nature. ",
  "I make up a rhyme to remember something.",
  "I have a few close friends.",
  "I enjoy team sports rather than individual sports.",
  "I enjoy math and/or science.",
  "I participate in extreme sports (e.g. sea kayaking, snowboarding, mountain biking).",
  "I enjoy completing crosswords and other word games like Scrabble.",
  "Being around people energizes me.",
  "It is easy for me to follow the beat of music.",
  "I keep a \"things to do\" list.",
  "I have strong opinions about controversial issues.",
  "I am actively involved in protecting the environment.",
  "I read charts and maps easily.",
  "I am curious as to how things feel and I tend to touch objects and examine the texture.",
  "I enjoy playing brainteasers and games that involve logical thinking such as Jeopardy and Clue.",
  "I am well coordinated.",
  "I work best when the activity is self-paced.",
  "I remember things exactly as they are said to me.",
  "I like setting songs and poems to music.",
  "I enjoy digging for and discovering artifacts and unusual items.",
  "I prefer group activities rather than ones I do alone.",
  "I have a good sense of direction.",
  "I like to take part in debates and/or discussions.",
  "I keep time when music is playing.",
  "I like to watch the scenes and activities in movies.",
  "I like to ask \"why\" questions and seek clarification of issues and concerns.",
  "I like working with my hands.",
  "I enjoy learning about different cultures.",
  "I am not easily influenced by other people.",
  "I prefer to be outdoors rather than indoors.",
  "I am good at estimating.",
  "I work best in a co-operative group where I can discuss issues with others.",
  "I understand that I am responsible for my own behavior.",
  "I remember things best by seeing them."
];
export default questions;
```

- [ ] **Step 2: Initialize `index.html` with basic structure and CDNs**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multiple Intelligences Assessment</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
    <div id="app" class="container">
        <!-- Views will be rendered here -->
    </div>
    <script type="module" src="script.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `style.css` with basic resets and layout**
```css
:root {
    --primary: #2563eb;
    --bg: #f8fafc;
    --card: #ffffff;
    --text: #1e293b;
}
body { font-family: sans-serif; background: var(--bg); color: var(--text); display: flex; justify-content: center; padding: 20px; }
.container { width: 100%; max-width: 800px; background: var(--card); padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
```

- [ ] **Step 4: Create `script.js` with initial state and `render()` function**
```javascript
import questions from './questions.js';

const state = {
    user: JSON.parse(sessionStorage.getItem('mi_user')) || { name: '', age: '', mobile: '', email: '' },
    currentStep: parseInt(sessionStorage.getItem('mi_step')) || 0,
    answers: JSON.parse(sessionStorage.getItem('mi_answers')) || Array(100).fill(null)
};

function saveState() {
    sessionStorage.setItem('mi_user', JSON.stringify(state.user));
    sessionStorage.setItem('mi_step', state.currentStep.toString());
    sessionStorage.setItem('mi_answers', JSON.stringify(state.answers));
}

function render() {
    const app = document.getElementById('app');
    if (state.currentStep === 0) renderRegistration(app);
    else if (state.currentStep <= 10) renderTest(app);
    else renderResult(app);
}

// Stubs for render functions
function renderRegistration(el) { el.innerHTML = '<h1>Register</h1>'; }
function renderTest(el) { el.innerHTML = '<h1>Test</h1>'; }
function renderResult(el) { el.innerHTML = '<h1>Result</h1>'; }

render();
```

---

### Task 2: Registration View

**Files:**
- Modify: `script.js`
- Modify: `style.css`

- [ ] **Step 1: Implement `renderRegistration` in `script.js`**
```javascript
function renderRegistration(el) {
    el.innerHTML = `
        <div class="registration-form">
            <h2>Welcome to Multiple Intelligences Assessment</h2>
            <p>Please enter your details to begin.</p>
            <form id="reg-form">
                <input type="text" id="name" placeholder="Full Name" required value="${state.user.name}">
                <input type="number" id="age" placeholder="Age" required value="${state.user.age}">
                <input type="tel" id="mobile" placeholder="Mobile Number" required value="${state.user.mobile}">
                <input type="email" id="email" placeholder="Email ID" required value="${state.user.email}">
                <button type="submit">Start Assessment</button>
            </form>
        </div>
    `;
    document.getElementById('reg-form').onsubmit = (e) => {
        e.preventDefault();
        state.user = {
            name: document.getElementById('name').value,
            age: document.getElementById('age').value,
            mobile: document.getElementById('mobile').value,
            email: document.getElementById('email').value
        };
        state.currentStep = 1;
        saveState();
        render();
    };
}
```

- [ ] **Step 2: Add styles for form elements in `style.css`**
```css
form { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 16px; }
button { padding: 14px; background: var(--primary); color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
button:hover { background: #1d4ed8; }
```

---

### Task 3: Assessment View

**Files:**
- Modify: `script.js`
- Modify: `style.css`

- [ ] **Step 1: Implement `renderTest` in `script.js` with 10 questions per page**
```javascript
function renderTest(el) {
    const startIndex = (state.currentStep - 1) * 10;
    const currentQuestions = questions.slice(startIndex, startIndex + 10);
    
    let questionsHtml = currentQuestions.map((q, i) => {
        const qIndex = startIndex + i;
        return `
            <div class="question-card">
                <p class="question-text">${qIndex + 1}. ${q}</p>
                <div class="options">
                    ${[1, 2, 3, 4, 5].map(val => `
                        <label>
                            <input type="radio" name="q${qIndex}" value="${val}" ${state.answers[qIndex] == val ? 'checked' : ''} required>
                            <span>${val}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    el.innerHTML = `
        <div class="test-header">
            <h3>Step ${state.currentStep} of 10</h3>
            <div class="progress-bar"><div class="progress" style="width: ${state.currentStep * 10}%"></div></div>
        </div>
        <form id="test-form">
            ${questionsHtml}
            <div class="form-actions">
                ${state.currentStep > 1 ? '<button type="button" id="prev-btn">Previous</button>' : ''}
                <button type="submit">${state.currentStep === 10 ? 'Finish' : 'Next'}</button>
            </div>
        </form>
    `;

    document.getElementById('test-form').onsubmit = (e) => {
        e.preventDefault();
        currentQuestions.forEach((_, i) => {
            const qIndex = startIndex + i;
            const selected = document.querySelector(`input[name="q${qIndex}"]:checked`);
            state.answers[qIndex] = parseInt(selected.value);
        });
        state.currentStep++;
        saveState();
        render();
    };

    if (state.currentStep > 1) {
        document.getElementById('prev-btn').onclick = () => {
            state.currentStep--;
            saveState();
            render();
        };
    }
}
```

- [ ] **Step 2: Add styles for test UI in `style.css`**
```css
.question-card { border-bottom: 1px solid #e2e8f0; padding: 20px 0; }
.question-text { font-weight: 500; margin-bottom: 10px; }
.options { display: flex; gap: 20px; }
.options label { cursor: pointer; display: flex; align-items: center; gap: 5px; }
.progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin: 10px 0 30px; }
.progress { height: 100%; background: var(--primary); transition: width 0.3s; }
.form-actions { display: flex; gap: 10px; margin-top: 30px; }
#prev-btn { background: #64748b; }
```

---

### Task 4: Scoring & Results

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Implement scoring logic and `renderResult`**
```javascript
function calculateScores() {
    const categories = {
        linguistic: 0, logical: 0, musical: 0, spatial: 0,
        bodily: 0, interpersonal: 0, intrapersonal: 0, naturalist: 0
    };
    const catKeys = Object.keys(categories);
    state.answers.forEach((val, i) => {
        const catIndex = i % 8;
        categories[catKeys[catIndex]] += val;
    });
    return categories;
}

function renderResult(el) {
    const scores = calculateScores();
    el.innerHTML = `
        <div class="result-view">
            <h2>Your Intelligence Profile</h2>
            <canvas id="scoreChart"></canvas>
            <div id="certificate-preview" style="display:none">
                <!-- Certificate content for PDF -->
            </div>
            <button id="download-btn">Download Certificate (PDF)</button>
            <button id="restart-btn" style="background:#64748b; margin-top: 10px;">Restart Test</button>
        </div>
    `;

    const ctx = document.getElementById('scoreChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Linguistic', 'Logical', 'Musical', 'Spatial', 'Bodily', 'Interpersonal', 'Intrapersonal', 'Naturalist'],
            datasets: [{
                label: 'Score',
                data: Object.values(scores),
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgb(37, 99, 235)',
                pointBackgroundColor: 'rgb(37, 99, 235)',
            }]
        },
        options: { scales: { r: { beginAtZero: true, max: 65 } } }
    });

    document.getElementById('download-btn').onclick = generatePDF;
    document.getElementById('restart-btn').onclick = () => {
        sessionStorage.clear();
        location.reload();
    };
}
```

---

### Task 5: PDF Certificate Generation

**Files:**
- Modify: `script.js`
- Modify: `style.css`

- [ ] **Step 1: Add certificate styles to `style.css`**
```css
#certificate-content {
    width: 800px; padding: 50px; background: white; border: 15px solid var(--primary);
    text-align: center; color: var(--text);
}
.cert-header { color: var(--primary); font-size: 32px; margin-bottom: 20px; }
.cert-name { font-size: 40px; font-weight: bold; border-bottom: 2px solid #333; display: inline-block; padding: 0 20px; }
```

- [ ] **Step 2: Implement `generatePDF` in `script.js`**
```javascript
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const scores = calculateScores();
    const certEl = document.createElement('div');
    certEl.id = 'certificate-content';
    certEl.innerHTML = `
        <div class="cert-header">CERTIFICATE OF COMPLETION</div>
        <p>This is to certify that</p>
        <div class="cert-name">${state.user.name}</div>
        <p>has successfully completed the Multiple Intelligences Assessment.</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <div style="width: 400px; height: 400px; margin: 0 auto;">
            <canvas id="certChart"></canvas>
        </div>
    `;
    document.body.appendChild(certEl);

    const ctx = document.getElementById('certChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Linguistic', 'Logical', 'Musical', 'Spatial', 'Bodily', 'Interpersonal', 'Intrapersonal', 'Naturalist'],
            datasets: [{
                label: 'Score',
                data: Object.values(scores),
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgb(37, 99, 235)',
            }]
        },
        options: { animation: false, scales: { r: { beginAtZero: true, max: 65 } } }
    });

    // Wait for chart render
    await new Promise(r => setTimeout(r, 500));

    const canvas = await html2canvas(certEl);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${state.user.name}_MI_Certificate.pdf`);
    document.body.removeChild(certEl);
}
```

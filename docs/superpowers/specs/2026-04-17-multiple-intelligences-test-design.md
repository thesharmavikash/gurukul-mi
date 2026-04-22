# Spec: Multiple Intelligences Online Assessment

## 1. Project Overview
A standalone, client-side web application that allows users to take a 100-question Multiple Intelligences (MI) test. The app collects user data, processes the assessment step-by-step, calculates scores across 8 intelligence categories, and provides a downloadable PDF certificate.

## 2. Requirements
- **No Backend**: All logic, data storage (session), and PDF generation must happen in the browser.
- **User Registration**: Collect Name, Age, Mobile Number, and Email ID.
- **Assessment**: 100 questions, 10 questions per page (10 steps).
- **Scoring**: 5-point Likert scale (1 to 5).
- **Visualization**: Radar chart showing the balance of intelligences.
- **PDF Certificate**: Generated locally with user details, date, score chart, and a professional layout.

## 3. Tech Stack
- **HTML5**: Semantic structure.
- **CSS3**: Vanilla CSS for modern, responsive UI.
- **JavaScript**: Vanilla ES6+ for application logic and state management.
- **Chart.js (CDN)**: For the radar chart visualization.
- **jsPDF & html2canvas (CDN)**: For PDF generation.

## 4. Data & Logic
### 4.1 Intelligence Categories & Mapping
Questions follow a rotating pattern of 8 categories (Question index mod 8):
1.  **Linguistic**: 1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97
2.  **Logical-Mathematical**: 2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98
3.  **Musical**: 3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99
4.  **Spatial**: 4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100
5.  **Bodily-Kinesthetic**: 5, 13, 21, 29, 37, 45, 53, 61, 69, 77, 85, 93
6.  **Interpersonal**: 6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94
7.  **Intrapersonal**: 7, 15, 23, 31, 39, 47, 55, 63, 71, 79, 87, 95
8.  **Naturalist**: 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96

### 4.2 Application State
```javascript
const state = {
  user: { name: '', age: '', mobile: '', email: '' },
  currentStep: 0, // 0: Reg, 1-10: Test, 11: Result
  answers: Array(100).fill(null),
  scores: {
    linguistic: 0,
    logical: 0,
    musical: 0,
    spatial: 0,
    kinesthetic: 0,
    interpersonal: 0,
    intrapersonal: 0,
    naturalist: 0
  }
};
```

## 5. UI Components
- **Step Container**: Animates between registration, questions, and results.
- **Progress Bar**: Visual indicator of completion percentage.
- **Question Card**: Displays question text and 5 radio buttons.
- **Certificate Template**: A hidden HTML element styled as a certificate for the PDF generator.

## 6. Success Criteria
- User can refresh the page and resume where they left off (via `sessionStorage`).
- All 100 questions must be answered before showing results.
- PDF must include the user's name and the radar chart.

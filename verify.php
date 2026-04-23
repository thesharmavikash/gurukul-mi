<?php
// GURUKUL IAS Result Verification Page
$host = 'localhost'; $db = 'gurukul_mi'; $user = 'root'; $pass = 'root';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) { die("System Error"); }

$hash = $_GET['v'] ?? '';
$result = null;

if ($hash) {
    $stmt = $pdo->prepare("SELECT r.*, s.name, s.student_id FROM assessment_results r JOIN students s ON r.student_id = s.id WHERE r.verification_hash = ? OR s.student_id = ?");
    $stmt->execute([$hash, $hash]);
    $result = $stmt->fetch();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verify MI Result - GURUKUL IAS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        .verify-card { max-width: 600px; margin: 80px auto; background: var(--card); padding: 60px; border-radius: 40px; border: 3px solid var(--border); box-shadow: 0 30px 60px rgba(0,0,0,0.5); text-align: center; }
        .status-badge { padding: 12px 25px; border-radius: 40px; font-weight: 900 !important; font-size: 14px; text-transform: uppercase; margin-bottom: 40px; display: inline-block; }
        .valid { background: #065f46; color: #34d399; border: 2px solid #34d399; }
        .invalid { background: #7f1d1d; color: #f87171; border: 2px solid #f87171; }
        .data-row { display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 2px solid var(--border); }
        .data-row:last-child { border: none; }
        .data-label { color: #444; font-size: 13px; text-transform: uppercase; }
        .data-val { color: #fff; font-size: 18px; }
    </style>
</head>
<body data-theme="dark">
    <header class="site-header">
        <div class="header-container">
            <a href="index.html" class="brand">
                <img src="gurukul_ias.jpeg" alt="Logo" class="logo-icon">
                <div class="brand-text">
                    <h1>GURUKUL IAS</h1>
                    <p>Verification System</p>
                </div>
            </a>
        </div>
    </header>

    <main class="verify-card">
        <?php if ($result): ?>
            <div class="status-badge valid">✓ VERIFIED AUTHENTIC</div>
            <h2 style="font-size: 2rem; margin-bottom: 40px; text-transform: uppercase;">ASSESSMENT <span style="color: var(--primary)">VERIFIED</span></h2>
            
            <div style="background: #000; padding: 30px; border-radius: 24px; border: 2px solid var(--primary); text-align: left;">
                <div class="data-row"><span class="data-label">Full Name</span><span class="data-val"><?= strtoupper(htmlspecialchars($result['name'])) ?></span></div>
                <div class="data-row"><span class="data-label">Student ID</span><span class="data-val"><?= $result['student_id'] ?></span></div>
                <div class="data-row"><span class="data-label">Score</span><span class="data-val" style="color: var(--primary); font-size: 24px;"><?= $result['total_score'] ?></span></div>
                <div class="data-row"><span class="data-label">Learning Type</span><span class="data-val"><?= $result['grade'] ?></span></div>
                <div class="data-row"><span class="data-label">Date Issued</span><span class="data-val"><?= date('d M, Y', strtotime($result['created_at'])) ?></span></div>
            </div>
            
            <p style="margin-top: 40px; color: #444; font-size: 13px;">THIS IS A DIGITALLY VERIFIED DOCUMENT FROM GURUKUL IAS RECORDS.</p>
        <?php else: ?>
            <div class="status-badge invalid">⚠ RECORD NOT FOUND</div>
            <h2 style="font-size: 2rem; margin-bottom: 30px; text-transform: uppercase;">INVALID <span style="color: var(--primary)">CREDENTIALS</span></h2>
            <p style="color: var(--secondary-text); font-size: 1.2rem; line-height: 1.6;">THE PROVIDED HASH OR STUDENT ID DOES NOT MATCH ANY COMPLETED ASSESSMENT IN OUR SECURE DATABASE.</p>
        <?php endif; ?>

        <button class="btn-primary" onclick="location.href='index.html'" style="margin-top: 50px; width: 100%;">BACK TO PORTAL</button>
    </main>

    <footer class="site-footer">
        <div class="footer-container">
            <div class="footer-bottom">© 2026 GURUKUL IAS. ALL RIGHTS RESERVED.</div>
        </div>
    </footer>
</body>
</html>

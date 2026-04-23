<?php
/**
 * GURUKUL IAS Result Verification Page
 * Optimized for ID and Hash lookups
 */

$host = 'localhost'; $db = 'gurukul_mi'; $user = 'root'; $pass = 'root';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Exception $e) { die("System Error: Maintenance in progress."); }

$v = trim($_GET['v'] ?? '');
$result = null;

if ($v) {
    // 1. Try to find assessment by hash OR student ID
    $stmt = $pdo->prepare("
        SELECT r.*, s.name as student_name, s.student_id as display_id 
        FROM assessment_results r 
        JOIN students s ON r.student_id = s.id 
        WHERE r.verification_hash = ? 
           OR s.student_id = ? 
        ORDER BY r.created_at DESC 
        LIMIT 1
    ");
    $stmt->execute([$v, $v]);
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
                <div class="data-row"><span class="data-label">Full Name</span><span class="data-val"><?= strtoupper(htmlspecialchars($result['student_name'])) ?></span></div>
                <div class="data-row"><span class="data-label">Student ID</span><span class="data-val"><?= $result['display_id'] ?></span></div>
                <div class="data-row"><span class="data-label">Score</span><span class="data-val" style="color: var(--primary); font-size: 24px;"><?= $result['total_score'] ?></span></div>
                <div class="data-row"><span class="data-label">Learning Type</span><span class="data-val"><?= $result['grade'] ?></span></div>
                <div class="data-row"><span class="data-label">Date Issued</span><span class="data-val"><?= date('d M, Y', strtotime($result['created_at'])) ?></span></div>
            </div>
            
            <p style="margin-top: 40px; color: #444; font-size: 13px;">THIS IS A DIGITALLY VERIFIED DOCUMENT FROM GURUKUL IAS RECORDS.</p>
        <?php else: ?>
            <div class="status-badge invalid">⚠ RECORD NOT FOUND</div>
            <h2 style="font-size: 2rem; margin-bottom: 30px; text-transform: uppercase;">INVALID <span style="color: var(--primary)">CREDENTIALS</span></h2>
            <p style="color: var(--secondary-text); font-size: 1.2rem; line-height: 1.6;">THE PROVIDED HASH OR STUDENT ID DOES NOT MATCH ANY COMPLETED ASSESSMENT IN OUR SECURE DATABASE.</p>
            <?php if ($v): ?>
                <p style="font-size: 10px; color: #222;">Debug: Searched for "<?= htmlspecialchars($v) ?>"</p>
            <?php endif; ?>
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

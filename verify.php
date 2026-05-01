<?php
// GURUKUL IAS Result Verification Page
require_once 'config.php';
$pdo = getPDO();

$v = trim($_GET['v'] ?? '');

// Robustness: If user pastes a full URL, extract the 'v' parameter
if (strpos($v, 'verify.php?v=') !== false) {
    $parsed_url = parse_url($v);
    if (isset($parsed_url['query'])) {
        parse_str($parsed_url['query'], $query_params);
        if (isset($query_params['v'])) $v = $query_params['v'];
    }
}

$result = null;

if ($v !== '') {
    // Try verification by hash first, then by student display ID (case-insensitive)
    $stmt = $pdo->prepare("SELECT r.*, s.name as student_name, s.student_id as display_id FROM assessment_results r JOIN students s ON r.student_id = s.id WHERE (r.verification_hash = ? OR UPPER(s.student_id) = UPPER(?)) AND ? != '' ORDER BY r.created_at DESC LIMIT 1");
    $stmt->execute([$v, $v, $v]);
    $result = $stmt->fetch();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify MI Result - GURUKUL IAS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .portal-container { max-width: 1100px; margin: 50px auto; padding: 0 20px; text-align: center; }
        .portal-header { margin-bottom: 50px; }
        .portal-header img { width: 120px; border-radius: 20px; margin-bottom: 25px; border: 4px solid var(--primary); }
        .portal-header h1 { font-size: 3.5rem; font-weight: 900 !important; letter-spacing: -2px; text-transform: uppercase; }
        
        .verify-card { max-width: 650px; margin: 0 auto 60px; background: var(--card); padding: 60px; border-radius: 40px; border: 3px solid var(--border); box-shadow: 0 30px 60px rgba(0,0,0,0.5); text-align: center; position: relative; overflow: hidden; }
        .status-badge { padding: 12px 25px; border-radius: 40px; font-weight: 900 !important; font-size: 14px; text-transform: uppercase; margin-bottom: 40px; display: inline-block; }
        .valid { background: #065f46; color: #34d399; border: 2px solid #34d399; }
        .invalid { background: #7f1d1d; color: #f87171; border: 2px solid #f87171; }
        
        .data-row { display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 2px solid var(--border); }
        .data-row:last-child { border: none; }
        .data-label { color: #555; font-size: 13px; text-transform: uppercase; font-weight: 900 !important; }
        .data-val { color: #fff; font-size: 18px; font-weight: 900 !important; }
        
        .verified-seal { position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; transform: rotate(15deg); font-weight: 900 !important; font-size: 12px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
    </style>
</head>
<body data-theme="dark">
    <main class="portal-container">
        <header class="portal-header">
            <a href="index.html" style="text-decoration: none; color: inherit;">
                <img src="assets/images/gurukul_ias.jpeg" alt="GURUKUL IAS">
                <h1>GURUKUL <span style="color: var(--primary)">IAS</span></h1>
            </a>
            <p style="color: var(--secondary-text); font-weight: 800 !important; text-transform: uppercase; letter-spacing: 2px;">Credential Verification System</p>
        </header>

        <section class="verify-card">
            <?php if ($result): ?>
                <div class="verified-seal">AUTHENTIC</div>
                <div class="status-badge valid">✓ VERIFIED RECORD FOUND</div>
                <h2 style="font-size: 2.2rem; margin-bottom: 40px; text-transform: uppercase; font-weight: 900 !important;">ASSESSMENT <span style="color: var(--primary)">AUTHENTICATED</span></h2>
                
                <div style="background: #000; padding: 40px; border-radius: 32px; border: 2px solid var(--primary); text-align: left; box-shadow: inset 0 10px 20px rgba(0,0,0,0.5);">
                    <div class="data-row"><span class="data-label">Candidate Name</span><span class="data-val"><?= strtoupper(htmlspecialchars($result['student_name'])) ?></span></div>
                    <div class="data-row"><span class="data-label">Registration ID</span><span class="data-val"><?= $result['display_id'] ?></span></div>
                    <div class="data-row"><span class="data-label">Assessment Type</span><span class="data-val"><?= strtoupper($result['test_type']) ?></span></div>
                    <div class="data-row"><span class="data-label">Learning Archetype</span><span class="data-val" style="color: var(--primary);"><?= strtoupper($result['grade']) ?></span></div>
                    <div class="data-row"><span class="data-label">Performance Score</span><span class="data-val" style="color: var(--primary); font-size: 24px;"><?= $result['total_score'] ?></span></div>
                    <div class="data-row"><span class="data-label">Completion Date</span><span class="data-val"><?= date('d M, Y', strtotime($result['created_at'])) ?></span></div>
                </div>
                
                <p style="margin-top: 40px; color: #444; font-size: 12px; font-weight: 900 !important; line-height: 1.6; text-transform: uppercase;">THIS RECORD IS SECURED BY GURUKUL IAS COGNITIVE ANALYSIS INFRASTRUCTURE. ANY MODIFICATION TO THIS DATA VOIDS THE CERTIFICATION.</p>
                
                <?php if ($result['pdf_path']): ?>
                    <button class="btn-primary" onclick="window.open('<?= $result['pdf_path'] ?>')" style="margin-top: 40px; width: 100%; background: #111; color: #fff; border: 2px solid #222;">VIEW ORIGINAL PDF</button>
                <?php endif; ?>

            <?php else: ?>
                <div class="status-badge invalid">⚠ VERIFICATION FAILED</div>
                <h2 style="font-size: 2.2rem; margin-bottom: 30px; text-transform: uppercase; font-weight: 900 !important;">RECORD <span style="color: var(--primary)">NOT FOUND</span></h2>
                <p style="color: var(--secondary-text); font-size: 1.2rem; line-height: 1.6; font-weight: 800 !important;">THE PROVIDED HASH OR STUDENT ID DOES NOT MATCH ANY COMPLETED ASSESSMENT IN OUR SECURE REPOSITORY. PLEASE CHECK THE CREDENTIALS AND TRY AGAIN.</p>
                
                <div style="margin-top: 40px; padding: 30px; background: rgba(239, 68, 68, 0.05); border: 2px dashed #7f1d1d; border-radius: 24px;">
                    <p style="color: #f87171; font-size: 13px; font-weight: 900 !important; margin: 0;">SECURITY NOTICE: UNAUTHORIZED ATTEMPTS TO FORGE CERTIFICATES ARE LOGGED.</p>
                </div>
            <?php endif; ?>

            <button class="btn-primary" onclick="location.href='index.html'" style="margin-top: 40px; width: 100%; font-size: 18px; padding: 20px;">BACK TO PORTAL</button>
        </section>
    </main>

    <footer class="site-footer">
        <div class="footer-container">
            <div class="footer-bottom">© 2026 GURUKUL IAS. ALL RIGHTS RESERVED.</div>
        </div>
    </footer>
</body>
</html>
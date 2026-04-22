<?php
// GURUKUL IAS Result Verification Page
$host = 'localhost'; $db = 'gurukul_mi'; $user = 'root'; $pass = 'root';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) { die("System Error"); }

$hash = $_GET['v'] ?? '';
$result = null;

if ($hash) {
    $stmt = $pdo->prepare("SELECT r.*, s.name, s.student_id FROM assessment_results r JOIN students s ON r.student_id = s.id WHERE r.verification_hash = ?");
    $stmt->execute([$hash]);
    $result = $stmt->fetch();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verify MI Result - GURUKUL IAS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #e11d48; --bg: #f8fafc; --card: #fff; --text: #0f172a; --border: #e2e8f0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { background: var(--card); padding: 40px; border-radius: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 500px; width: 100%; border: 1px solid var(--border); text-align: center; }
        .logo { width: 80px; margin-bottom: 20px; border-radius: 12px; border: 2px solid var(--primary); }
        h1 { font-size: 24px; font-weight: 900; margin: 0 0 10px; color: var(--primary); }
        .status { padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 30px; }
        .valid { background: #d1fae5; color: #065f46; }
        .invalid { background: #fee2e2; color: #991b1b; }
        .info-grid { text-align: left; background: #f1f5f9; padding: 20px; border-radius: 20px; margin-bottom: 30px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border: none; }
        .label { color: #64748b; font-size: 13px; font-weight: bold; text-transform: uppercase; }
        .val { font-weight: 700; }
    </style>
</head>
<body>
    <div class="card">
        <img src="gurukul_ias.jpeg" alt="Logo" class="logo">
        <h1>Result Verification</h1>
        
        <?php if ($result): ?>
            <div class="status valid">✓ VERIFIED AUTHENTIC</div>
            <div class="info-grid">
                <div class="info-row"><span class="label">Student Name</span><span class="val"><?= htmlspecialchars($result['name']) ?></span></div>
                <div class="info-row"><span class="label">Student ID</span><span class="val"><?= $result['student_id'] ?></span></div>
                <div class="info-row"><span class="label">Score</span><span class="val"><?= $result['total_score'] ?></span></div>
                <div class="info-row"><span class="label">Learning Profile</span><span class="val"><?= $result['grade'] ?></span></div>
                <div class="info-row"><span class="label">Issue Date</span><span class="val"><?= date('d F, Y', strtotime($result['created_at'])) ?></span></div>
            </div>
            <p style="font-size:12px; color:#64748b">This record matches our official database.</p>
        <?php else: ?>
            <div class="status invalid">⚠ INVALID RECORD</div>
            <p>We could not find an official record matching this verification code.</p>
        <?php endif; ?>
        
        <a href="index.html" style="color:var(--primary); text-decoration:none; font-weight:bold; font-size:14px;">Back to GURUKUL IAS</a>
    </div>
</body>
</html>

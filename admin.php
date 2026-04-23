<?php
session_start();
/**
 * GURUKUL IAS Senior Admin Dashboard v3.7
 * ENFORCED BOLD UI | UNIFIED HEADER/FOOTER SETTINGS | BATCH ANALYTICS
 */

$host = 'localhost'; $db = 'gurukul_mi'; $user = 'root'; $pass = 'root';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Exception $e) { die("System Maintenance: Database Connection Offline"); }

// AUTHENTICATION
if (isset($_POST['login'])) {
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
    $stmt->execute([$_POST['username']]);
    $admin = $stmt->fetch();
    if ($admin && ($_POST['password'] === $admin['password'] || password_verify($_POST['password'], $admin['password']))) {
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_user'] = $admin['username'];
        header("Location: admin.php"); exit;
    } else { $error = "Invalid Credentials"; }
}
if (isset($_GET['logout'])) { session_destroy(); header("Location: admin.php"); exit; }
if (!isset($_SESSION['admin_id'])) {
    ?>
    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Admin Portal | GIAS</title>
    <style>
        body { background: #000; color: #fff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        * { font-weight: 900 !important; }
        .login-card { background: #0a0a0a; padding: 50px; border-radius: 40px; border: 3px solid #262626; width: 360px; text-align: center; }
        .logo { width: 80px; border-radius: 12px; margin-bottom: 20px; border: 3px solid #e11d48; }
        h2 { font-size: 28px; letter-spacing: -1px; margin-bottom: 30px; text-transform: uppercase; }
        input { width: 100%; padding: 18px; margin: 10px 0; background: #111; border: 2px solid #333; color: #fff; border-radius: 16px; box-sizing: border-box; font-size: 16px; }
        button { width: 100%; padding: 18px; background: #e11d48; color: #fff; border: none; border-radius: 16px; cursor: pointer; font-size: 18px; margin-top: 20px; text-transform: uppercase; }
    </style>
    </head><body>
    <form class="login-card" method="POST">
        <img src="gurukul_ias.jpeg" class="logo">
        <h2>GIAS <span style="color:#e11d48">ADMIN</span></h2>
        <?php if(isset($error)) echo "<p style='color:#ef4444;font-size:12px'>$error</p>"; ?>
        <input type="text" name="username" placeholder="USERNAME" required>
        <input type="password" name="password" placeholder="PASSWORD" required>
        <button type="submit" name="login">LOGIN</button>
    </form>
    </body></html>
    <?php exit;
}

// ACTION HANDLERS
if (isset($_GET['delete_assessment'])) {
    $pdo->prepare("DELETE FROM question_responses WHERE assessment_id = ?")->execute([$_GET['delete_assessment']]);
    $pdo->prepare("DELETE FROM assessment_results WHERE id = ?")->execute([$_GET['delete_assessment']]);
    header("Location: admin.php?p=assessments&msg=Assessment Deleted"); exit;
}
if (isset($_GET['delete_student'])) {
    $pdo->prepare("DELETE FROM question_responses WHERE student_id = ?")->execute([$_GET['delete_student']]);
    $pdo->prepare("DELETE FROM assessment_results WHERE student_id = ?")->execute([$_GET['delete_student']]);
    $pdo->prepare("DELETE FROM students WHERE id = ?")->execute([$_GET['delete_student']]);
    header("Location: admin.php?p=students&msg=Student Deleted"); exit;
}
if (isset($_POST['update_settings'])) {
    foreach ($_POST['settings'] as $key => $value) {
        $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?")->execute([$key, $value, $value]);
    }
    $msg = "Settings Updated";
}

$page = $_GET['p'] ?? 'dashboard';
$search = $_GET['q'] ?? '';

// EXPORT
if (isset($_GET['export'])) {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="GIAS_Data.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['ID', 'Name', 'Mobile', 'Score', 'Grade', 'Test', 'Switches', 'Duration', 'Suspicious', 'Date']);
    $data = $pdo->query("SELECT s.student_id, s.name, s.mobile, r.total_score, r.grade, r.test_type, r.tab_switches, r.duration, r.is_suspicious, r.created_at FROM assessment_results r JOIN students s ON r.student_id = s.id");
    while($row = $data->fetch()) fputcsv($output, $row);
    fclose($output); exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>GIAS Admin v3.7</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #e11d48; --bg: #000; --card: #0d0d0d; --sidebar: #050505; --text: #fff; --border: #1a1a1a; }
        * { font-weight: 900 !important; letter-spacing: -0.01em; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; height: 100vh; overflow: hidden; }
        .sidebar { width: 260px; background: var(--sidebar); border-right: 2px solid var(--border); display: flex; flex-direction: column; padding: 30px 20px; }
        .nav-link { display: flex; align-items: center; gap: 12px; padding: 15px; color: #555; text-decoration: none; border-radius: 12px; margin-bottom: 5px; font-size: 15px; text-transform: uppercase; transition: 0.2s; }
        .nav-link:hover, .nav-link.active { background: rgba(225, 29, 72, 0.15); color: var(--primary); border: 1px solid var(--primary); }
        .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        .top-bar { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); background: var(--card); }
        .content { padding: 40px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .widget { background: var(--card); padding: 25px; border-radius: 24px; border: 2px solid var(--border); }
        .widget h3 { margin: 0; font-size: 11px; color: #444; text-transform: uppercase; }
        .widget .val { font-size: 32px; margin-top: 5px; color: var(--primary); }
        .table-container { background: var(--card); border-radius: 24px; border: 2px solid var(--border); overflow: hidden; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #080808; padding: 18px 20px; text-align: left; font-size: 11px; color: #444; text-transform: uppercase; border-bottom: 2px solid var(--border); }
        td { padding: 18px 20px; border-bottom: 1px solid var(--border); font-size: 15px; }
        .badge { padding: 5px 12px; border-radius: 8px; font-size: 11px; background: #111; color: #888; border: 1px solid #222; text-transform: uppercase; }
        .btn { padding: 12px 20px; border-radius: 12px; cursor: pointer; border: none; font-size: 14px; text-transform: uppercase; transition: 0.2s; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { transform: scale(1.02); background: #be123c; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-content { background: #0a0a0a; padding: 40px; border-radius: 40px; border: 3px solid var(--primary); max-width: 600px; width: 90%; }
        input, select, textarea { width: 100%; padding: 18px; background: #111; border: 2px solid #222; color: #fff; border-radius: 16px; box-sizing: border-box; font-size: 16px; margin-top: 5px; font-weight: 900 !important; }
        label { font-size: 12px; color: #666; text-transform: uppercase; margin-top: 20px; display: block; font-weight: 900 !important; }
        .msg-banner { background: var(--primary); color: #fff; padding: 10px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div style="margin-bottom:40px; display:flex; align-items:center; gap:12px">
            <img src="gurukul_ias.jpeg" style="width:45px; border-radius:12px; border: 2px solid var(--primary)">
            <span style="font-size:18px; color:var(--primary)">CONTROL</span>
        </div>
        <a href="?p=dashboard" class="nav-link <?= $page=='dashboard'?'active':'' ?>">Analytics</a>
        <a href="?p=assessments" class="nav-link <?= $page=='assessments'?'active':'' ?>">Results</a>
        <a href="?p=tests" class="nav-link <?= $page=='tests'?'active':'' ?>">Tests</a>
        <a href="?p=questions" class="nav-link <?= $page=='questions'?'active':'' ?>">Questions</a>
        <a href="?p=batches" class="nav-link <?= $page=='batches'?'active':'' ?>">Batches</a>
        <a href="?p=cms" class="nav-link <?= $page=='cms'?'active':'' ?>">CMS</a>
        <a href="?p=settings" class="nav-link <?= $page=='settings'?'active':'' ?>">Settings</a>
        <a href="?logout=1" class="nav-link" style="margin-top:auto; color:var(--primary)">Logout</a>
    </div>

    <div class="main">
        <?php if(isset($msg)): ?><div class="msg-banner"><?= $msg ?></div><?php endif; ?>
        <div class="top-bar">
            <h2 style="margin:0; font-size:22px"><?= strtoupper($page) ?></h2>
            <div style="display:flex; gap:12px">
                <button onclick="location.href='?export=1'" class="btn" style="background:#111; color:#fff">EXPORT DATA</button>
                <button onclick="window.open('index.html')" class="btn btn-primary">GO TO PORTAL</button>
            </div>
        </div>

        <div class="content">
            <?php if($page == 'dashboard'): 
                $stats = $pdo->query("SELECT COUNT(*) as t, AVG(total_score) as a FROM assessment_results")->fetch();
            ?>
                <div class="stats-grid">
                    <div class="widget"><h3>Total Tests</h3><p class="val"><?= $stats['t'] ?></p></div>
                    <div class="widget"><h3>Enrolled</h3><p class="val"><?= $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn() ?></p></div>
                    <div class="widget"><h3>Avg Score</h3><p class="val"><?= round($stats['a'], 1) ?></p></div>
                    <div class="widget"><h3>Flagged</h3><p class="val"><?= $pdo->query("SELECT COUNT(*) FROM assessment_results WHERE is_suspicious=1")->fetchColumn() ?></p></div>
                </div>
                <div class="table-container" style="padding:40px">
                    <h3 style="margin-top:0; color:#444">BATCH INTELLIGENCE HEATMAP</h3>
                    <canvas id="avgChart" style="max-height:400px"></canvas>
                </div>
                <script>
                    const avgData = <?= json_encode(array_values($pdo->query("SELECT AVG(JSON_EXTRACT(scores_json, '$[0]')), AVG(JSON_EXTRACT(scores_json, '$[1]')), AVG(JSON_EXTRACT(scores_json, '$[2]')), AVG(JSON_EXTRACT(scores_json, '$[3]')), AVG(JSON_EXTRACT(scores_json, '$[4]')), AVG(JSON_EXTRACT(scores_json, '$[5]')), AVG(JSON_EXTRACT(scores_json, '$[6]')), AVG(JSON_EXTRACT(scores_json, '$[7]')) FROM assessment_results")->fetch())) ?>;
                    new Chart(document.getElementById('avgChart'), {
                        type: 'radar',
                        data: {
                            labels: ['Linguistic', 'Logical', 'Musical', 'Spatial', 'Bodily', 'Interpersonal', 'Intrapersonal', 'Naturalist'],
                            datasets: [{ data: avgData, backgroundColor: 'rgba(225, 29, 72, 0.2)', borderColor: '#e11d48', borderWidth: 4 }]
                        },
                        options: { scales: { r: { grid: { color: '#222' }, angleLines: { color: '#222' }, ticks: { display: false } } }, plugins: { legend: { display: false } } }
                    });
                </script>

            <?php elseif($page == 'assessments'): 
                $data = $pdo->query("SELECT r.*, s.name, s.student_id FROM assessment_results r JOIN students s ON r.student_id = s.id ORDER BY r.created_at DESC LIMIT 100")->fetchAll();
            ?>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Student Info</th><th>Total</th><th>Test Type</th><th>Duration</th><th>IP Address</th><th>Action</th></tr></thead>
                        <tbody>
                            <?php foreach($data as $r): ?>
                            <tr style="<?= $r['is_suspicious']?'background:rgba(225,29,72,0.05)':'' ?>">
                                <td><strong><?= strtoupper(htmlspecialchars($r['name'])) ?></strong><br><small style="color:#555"><?= $r['student_id'] ?></small></td>
                                <td><span class="badge" style="background:var(--primary); color:#fff; border:none"><?= $r['total_score'] ?></span></td>
                                <td><?= $r['test_type'] ?></td>
                                <td><?= floor($r['duration']/60) ?>m <?= $r['duration']%60 ?>s</td>
                                <td style="font-size:11px; color:#444"><?= $r['ip_address'] ?></td>
                                <td>
                                    <div style="display:flex; gap:8px">
                                        <button class="badge" style="background:#1d4ed8; color:#fff; border:none" onclick="window.open('verify.php?v=<?= $r['verification_hash'] ?>')">VERIFY</button>
                                        <a href="?p=assessments&delete_assessment=<?= $r['id'] ?>" style="color:#ef4444; font-size:10px" onclick="return confirm('Delete result?')">DELETE</a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <?php elseif($page == 'tests'): 
                $tests = $pdo->query("SELECT * FROM tests ORDER BY id ASC")->fetchAll();
            ?>
                <div style="display:flex; justify-content:space-between; margin-bottom:25px">
                    <h3 style="margin:0; color:#444">TEST CONFIGURATIONS</h3>
                    <button class="btn btn-primary" onclick="openTestModal()">+ NEW TEST</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>ID</th><th>Test Name</th><th>Questions</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            <?php foreach($tests as $t): ?>
                            <tr>
                                <td><span class="badge"><?= $t['id'] ?></span></td>
                                <td><strong><?= strtoupper(htmlspecialchars($t['name'])) ?></strong><br><small style="color:#444"><?= htmlspecialchars($t['description']) ?></small></td>
                                <td><span class="badge" style="color:var(--primary)"><?= $t['question_count'] ?> QS</span></td>
                                <td><button class="badge" onclick="toggleTest(<?= $t['id'] ?>)" style="cursor:pointer; color:<?= $t['is_active']?'#10b981':'#ef4444' ?>"><?= $t['is_active']?'ACTIVE':'INACTIVE' ?></button></td>
                                <td>
                                    <div style="display:flex; gap:8px">
                                        <button class="badge" style="color:var(--primary)" onclick='openTestModal(<?= json_encode($t) ?>)'>EDIT</button>
                                        <button class="badge" style="color:#ef4444" onclick="deleteTest(<?= $t['id'] ?>)">DEL</button>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div id="testModal" class="modal">
                    <div class="modal-content">
                        <h2 id="tTitle" style="margin-top:0; color:var(--primary)">CREATE NEW TEST</h2>
                        <form onsubmit="saveTest(event)">
                            <input type="hidden" id="tId">
                            <label>TEST NAME</label>
                            <input type="text" id="tName" placeholder="E.G. SEMESTER EVALUATION" required>
                            <label>DESCRIPTION</label>
                            <textarea id="tDesc" placeholder="ENTER TEST DETAILS..." required></textarea>
                            <label>QUESTION COUNT (DIVISIBLE BY 8)</label>
                            <select id="tCount">
                                <?php for($i=8; $i<=96; $i+=8): ?><option value="<?= $i ?>"><?= $i ?> QUESTIONS</option><?php endfor; ?>
                                <option value="100">100 QUESTIONS</option>
                            </select>
                            <button type="submit" class="btn btn-primary" style="margin-top:30px; width:100%">SAVE TEST CONFIG</button>
                            <button type="button" class="btn" style="margin-top:10px; width:100%; background:#111; color:#fff" onclick="document.getElementById('testModal').style.display='none'">CANCEL</button>
                        </form>
                    </div>
                </div>

                <script>
                    function openTestModal(data = null) {
                        const modal = document.getElementById('testModal');
                        if (data) {
                            document.getElementById('tTitle').innerText = "EDIT TEST";
                            document.getElementById('tId').value = data.id;
                            document.getElementById('tName').value = data.name;
                            document.getElementById('tDesc').value = data.description;
                            document.getElementById('tCount').value = data.question_count;
                        } else {
                            document.getElementById('tTitle').innerText = "CREATE NEW TEST";
                            document.getElementById('tId').value = "";
                            document.getElementById('tName').value = "";
                            document.getElementById('tDesc').value = "";
                        }
                        modal.style.display='flex';
                    }
                    async function saveTest(e) {
                        e.preventDefault();
                        const id = document.getElementById('tId').value;
                        const data = { type: id ? 'admin_update_test' : 'admin_add_test', id, name: document.getElementById('tName').value, description: document.getElementById('tDesc').value, question_count: document.getElementById('tCount').value };
                        const res = await fetch('api.php', { method: 'POST', body: JSON.stringify(data) });
                        location.reload();
                    }
                    async function toggleTest(id) {
                        await fetch('api.php', { method: 'POST', body: JSON.stringify({ type: 'admin_toggle_test', id: id }) });
                        location.reload();
                    }
                    async function deleteTest(id) {
                        if (confirm('Delete test?')) {
                            await fetch('api.php', { method: 'POST', body: JSON.stringify({ type: 'admin_delete_test', id: id }) });
                            location.reload();
                        }
                    }
                </script>

            <?php elseif($page == 'questions'): 
                $data = $pdo->query("SELECT * FROM questions ORDER BY id DESC")->fetchAll();
            ?>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px">
                    <h3 style="margin:0; color:#444">MASTER QUESTION POOL (<?= count($data) ?>)</h3>
                    <button class="btn btn-primary" onclick="openQuestionModal()">+ ADD QUESTION</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>#</th><th>Category</th><th>Question Text</th><th>Action</th></tr></thead>
                        <tbody>
                            <?php $cats = ['Linguistic', 'Logical', 'Musical', 'Spatial', 'Bodily', 'Interpersonal', 'Intrapersonal', 'Naturalist'];
                            foreach($data as $q): ?>
                            <tr>
                                <td><span class="badge"><?= $q['id'] ?></span></td>
                                <td><span class="badge" style="color:#fff; border-color:var(--primary)"><?= strtoupper($cats[$q['category_index']]) ?></span></td>
                                <td style="font-size:13px"><strong>EN:</strong> <?= htmlspecialchars($q['text_en']) ?><br><strong>HI:</strong> <?= htmlspecialchars($q['text_hi']) ?></td>
                                <td>
                                    <div style="display:flex; gap:10px">
                                        <button class="badge" style="color:var(--primary); cursor:pointer" onclick='openQuestionModal(<?= json_encode($q) ?>)'>EDIT</button>
                                        <button class="badge" style="color:#ef4444; cursor:pointer" onclick="deleteQuestion(<?= $q['id'] ?>)">DEL</button>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div id="qModal" class="modal">
                    <div class="modal-content" style="max-width:700px">
                        <h2 id="qTitle">ADD QUESTION</h2>
                        <form onsubmit="saveQuestion(event)">
                            <input type="hidden" id="qId">
                            <label>CATEGORY</label>
                            <select id="qCat"><?php foreach($cats as $i=>$c): ?><option value="<?= $i ?>"><?= $c ?></option><?php endforeach; ?></select>
                            <label>ENGLISH TEXT</label><textarea id="qEn" required style="height:80px"></textarea>
                            <label>HINDI TEXT</label><textarea id="qHi" required style="height:80px"></textarea>
                            <button type="submit" class="btn btn-primary" style="margin-top:30px; width:100%">SAVE QUESTION</button>
                            <button type="button" class="btn" style="margin-top:10px; width:100%; background:#111; color:#fff" onclick="document.getElementById('qModal').style.display='none'">CANCEL</button>
                        </form>
                    </div>
                </div>

                <script>
                    function openQuestionModal(data = null) {
                        const modal = document.getElementById('qModal');
                        if (data) {
                            document.getElementById('qTitle').innerText = "EDIT QUESTION";
                            document.getElementById('qId').value = data.id;
                            document.getElementById('qCat').value = data.category_index;
                            document.getElementById('qEn').value = data.text_en;
                            document.getElementById('qHi').value = data.text_hi;
                        } else {
                            document.getElementById('qTitle').innerText = "ADD QUESTION";
                            document.getElementById('qId').value = "";
                            document.getElementById('qEn').value = "";
                            document.getElementById('qHi').value = "";
                        }
                        modal.style.display = 'flex';
                    }
                    async function saveQuestion(e) {
                        e.preventDefault();
                        const id = document.getElementById('qId').value;
                        const data = { type: id ? 'admin_update_question' : 'admin_add_question', id, category_index: document.getElementById('qCat').value, text_en: document.getElementById('qEn').value, text_hi: document.getElementById('qHi').value };
                        const res = await fetch('api.php', { method: 'POST', body: JSON.stringify(data) });
                        location.reload();
                    }
                    async function deleteQuestion(id) {
                        if (confirm('Delete question?')) {
                            await fetch('api.php', { method: 'POST', body: JSON.stringify({ type: 'admin_delete_question', id: id }) });
                            location.reload();
                        }
                    }
                </script>

            <?php elseif($page == 'batches'): 
                $batches = $pdo->query("SELECT * FROM batches ORDER BY id DESC")->fetchAll();
            ?>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px">
                    <h3 style="margin:0; color:#444">BATCH MANAGEMENT</h3>
                    <button class="btn btn-primary" onclick="openBatchModal()">+ CREATE BATCH</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Batch Name</th><th>Access Code</th><th>Enrollment</th><th>Analytics</th></tr></thead>
                        <tbody>
                            <?php foreach($batches as $b): 
                                $count = $pdo->query("SELECT COUNT(*) FROM students WHERE batch_id = ".$b['id'])->fetchColumn();
                            ?>
                            <tr>
                                <td><strong><?= strtoupper(htmlspecialchars($b['name'])) ?></strong></td>
                                <td><span class="badge" style="color:var(--primary); font-family:monospace; font-size:14px"><?= $b['access_code'] ?: '—' ?></span></td>
                                <td><span class="badge"><?= $count ?> STUDENTS</span></td>
                                <td><button class="badge" style="background:var(--primary); color:#fff; border:none; cursor:pointer" onclick="viewBatchAnalytics(<?= $b['id'] ?>, '<?= $b['name'] ?>')">VIEW RADAR</button></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div id="batchModal" class="modal">
                    <div class="modal-content">
                        <h2 style="margin-top:0; color:var(--primary)">CREATE NEW BATCH</h2>
                        <form onsubmit="saveBatch(event)">
                            <label>BATCH NAME (E.G. CLASS 10-A)</label>
                            <input type="text" id="bName" placeholder="ENTER BATCH NAME" required>
                            <label>ACCESS CODE (E.G. CLASS10)</label>
                            <input type="text" id="bCode" placeholder="ENTER UNIQUE CODE" required>
                            <button type="submit" class="btn btn-primary" style="margin-top:30px; width:100%">GENERATE BATCH</button>
                            <button type="button" class="btn" style="margin-top:10px; width:100%; background:#111; color:#fff" onclick="document.getElementById('batchModal').style.display='none'">CANCEL</button>
                        </form>
                    </div>
                </div>

                <div id="aModal" class="modal">
                    <div class="modal-content" style="max-width:500px">
                        <h3 id="aTitle" style="text-align:center">BATCH ANALYSIS</h3>
                        <canvas id="bChart"></canvas>
                        <button class="btn" style="margin-top:30px; width:100%; background:#111; color:#fff" onclick="document.getElementById('aModal').style.display='none'">CLOSE</button>
                    </div>
                </div>

                <script>
                    function openBatchModal() { document.getElementById('batchModal').style.display='flex'; }
                    async function saveBatch(e) {
                        e.preventDefault();
                        const data = { type: 'admin_create_batch', name: document.getElementById('bName').value, access_code: document.getElementById('bCode').value };
                        const res = await fetch('api.php', { method: 'POST', body: JSON.stringify(data) });
                        location.reload();
                    }
                    let bChart = null;
                    async function viewBatchAnalytics(id, name) {
                        const res = await fetch('api.php', { method: 'POST', body: JSON.stringify({ type: 'admin_batch_analytics', batch_id: id }) });
                        const data = await res.json();
                        document.getElementById('aTitle').innerText = name.toUpperCase() + " HEATMAP";
                        document.getElementById('aModal').style.display='flex';
                        const ctx = document.getElementById('bChart').getContext('2d');
                        if (bChart) bChart.destroy();
                        bChart = new Chart(ctx, {
                            type: 'radar',
                            data: {
                                labels: ['Linguistic', 'Logical', 'Musical', 'Spatial', 'Bodily', 'Interpersonal', 'Intrapersonal', 'Naturalist'],
                                datasets: [{ data: data.avg, backgroundColor: 'rgba(225, 29, 72, 0.2)', borderColor: '#e11d48', borderWidth: 4 }]
                            },
                            options: { plugins: { legend: { display: false } } }
                        });
                    }
                </script>

            <?php elseif($page == 'cms'): 
                $cms = $pdo->query("SELECT * FROM cms_content")->fetchAll();
            ?>
                <?php foreach($cms as $item): ?>
                    <div class="table-container" style="padding:30px; margin-bottom:20px">
                        <h3 style="margin-top:0; color:var(--primary)"><?= strtoupper($item['section_key']) ?></h3>
                        <label>SECTION TITLE</label>
                        <input type="text" id="t-<?= $item['id'] ?>" value="<?= htmlspecialchars($item['title']) ?>">
                        <label>SECTION BODY</label>
                        <textarea id="b-<?= $item['id'] ?>" style="height:120px"><?= htmlspecialchars($item['body']) ?></textarea>
                        <button class="btn btn-primary" style="margin-top:20px" onclick="saveCMS(<?= $item['id'] ?>, '<?= $item['section_key'] ?>')">SAVE CHANGES</button>
                    </div>
                <?php endforeach; ?>
                <script>
                    async function saveCMS(id, key) {
                        const data = { type: 'admin_update_cms', section_key: key, title: document.getElementById('t-'+id).value, body: document.getElementById('b-'+id).value };
                        const res = await fetch('api.php', { method: 'POST', body: JSON.stringify(data) });
                        if ((await res.json()).status === 'success') alert('UPDATED');
                    }
                </script>

            <?php elseif($page == 'settings'): 
                $settings = $pdo->query("SELECT * FROM system_settings")->fetchAll(PDO::FETCH_KEY_PAIR);
            ?>
                <div class="table-container" style="padding:40px; max-width:600px">
                    <h3 style="margin-top:0; color:var(--primary)">SYSTEM CONFIGURATION</h3>
                    <form method="POST">
                        <?php foreach($settings as $k=>$v): ?>
                            <div style="margin-bottom:20px">
                                <label><?= strtoupper(str_replace('_',' ',$k)) ?></label>
                                <input type="text" name="settings[<?= $k ?>]" value="<?= htmlspecialchars($v) ?>">
                            </div>
                        <?php endforeach; ?>
                        <button type="submit" name="update_settings" class="btn btn-primary" style="width:100%; margin-top:20px">UPDATE PLATFORM SETTINGS</button>
                    </form>

                    <h3 style="margin-top:50px; color:var(--primary)">DATA MAINTENANCE</h3>
                    <p style="font-size:13px; color:#444; margin-bottom:20px">DOWNLOAD A FULL SQL DATA DUMP FOR BACKUP PURPOSES.</p>
                    <button onclick="location.href='api.php?type=admin_backup_db'" class="btn" style="width:100%; background:#111; color:#fff; border:1px solid #333">DOWNLOAD SQL BACKUP</button>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>

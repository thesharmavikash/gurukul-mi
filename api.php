<?php
/**
 * GURUKUL IAS MI Assessment API
 * Handles user registration and result storage
 */

header('Content-Type: application/json');

// Database Configuration
$host = 'localhost';
$db   = 'gurukul_mi';
$user = 'root';
$pass = 'root';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     die(json_encode(['error' => 'Connection failed']));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$type = $input['type'] ?? ($_GET['type'] ?? '');

// --- PUBLIC ENDPOINTS ---

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $type === 'active_tests') {
    $stmt = $pdo->query("SELECT * FROM tests WHERE is_active = 1 ORDER BY id ASC");
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $type === 'homepage_cms') {
    $stmt = $pdo->query("SELECT section_key, title, body FROM cms_content");
    $data = [];
    while($row = $stmt->fetch()) { $data[$row['section_key']] = $row; }
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $type === 'recent_completions') {
    $stmt = $pdo->query("SELECT s.name, r.test_type, r.created_at FROM assessment_results r JOIN students s ON r.student_id = s.id ORDER BY r.created_at DESC LIMIT 5");
    $data = $stmt->fetchAll();
    foreach ($data as &$row) {
        $parts = explode(' ', $row['name']);
        $row['name'] = $parts[0] . (isset($parts[1]) ? ' ' . substr($parts[1], 0, 1) . '.' : '');
    }
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $type === 'verify_certificate') {
    $hash = $_GET['v'] ?? '';
    $stmt = $pdo->prepare("SELECT r.*, s.name, s.student_id FROM assessment_results r JOIN students s ON r.student_id = s.id WHERE r.verification_hash = ? OR s.student_id = ?");
    $stmt->execute([$hash, $hash]);
    echo json_encode($stmt->fetch());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $type === 'questions') {
    $testId = $_GET['test_id'] ?? ($_GET['test_type'] ?? '2'); 
    $stmtTest = $pdo->prepare("SELECT * FROM tests WHERE id = ? OR name = ?");
    $stmtTest->execute([$testId, $testId]);
    $test = $stmtTest->fetch();

    if ($test) {
        if ($test['id'] <= 3) {
            $types = ['1' => '8', '2' => '56', '3' => '100'];
            $tType = $types[$test['id']] ?? $test['id'];
            $stmt = $pdo->prepare("SELECT id, category_index as cat, text_en, text_hi FROM questions WHERE test_type = ? ORDER BY sort_order ASC");
            $stmt->execute([$tType]);
            echo json_encode($stmt->fetchAll());
        } else {
            $perCat = max(1, floor($test['question_count'] / 8));
            $allQs = [];
            for ($i=0; $i<8; $i++) {
                $stmt = $pdo->prepare("SELECT id, category_index as cat, text_en, text_hi FROM questions WHERE test_type = '100' AND category_index = ? ORDER BY RAND() LIMIT ?");
                $stmt->execute([$i, $perCat]);
                $allQs = array_merge($allQs, $stmt->fetchAll());
            }
            echo json_encode($allQs);
        }
    } else {
        $stmt = $pdo->prepare("SELECT id, category_index as cat, text_en, text_hi FROM questions WHERE test_type = ? ORDER BY sort_order ASC");
        $stmt->execute([$testId]);
        echo json_encode($stmt->fetchAll());
    }
    exit;
}

// --- AUTH & SHARED ENDPOINTS ---

if ($type === 'student_login') {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE email = ? OR mobile = ?");
    $stmt->execute([$input['login'], $input['login']]);
    $user = $stmt->fetch();
    if ($user && password_verify($input['password'], $user['password_hash'])) {
        session_start();
        $_SESSION['student_id'] = $user['id'];
        echo json_encode(['status' => 'success', 'user' => $user]);
    } else {
        echo json_encode(['error' => 'Invalid credentials']);
    }
    exit;
}

if ($type === 'student_register') {
    $password = password_hash($input['password'], PASSWORD_DEFAULT);
    $studentID = 'GIAS-' . date('Y') . '-' . strtoupper(substr(uniqid(), -4));
    $stmt = $pdo->prepare("INSERT INTO students (student_id, name, age, mobile, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)");
    try {
        $stmt->execute([$studentID, $input['name'], $input['age'], $input['mobile'], $input['email'], $password]);
        echo json_encode(['status' => 'success', 'student_id' => $studentID]);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Registration failed']);
    }
    exit;
}

if ($type === 'registration') {
    $batchId = null;
    if (!empty($input['batch_code'])) {
        $stmtBatch = $pdo->prepare("SELECT id FROM batches WHERE access_code = ?");
        $stmtBatch->execute([$input['batch_code']]);
        $batchId = $stmtBatch->fetchColumn() ?: null;
    }

    $stmt = $pdo->prepare("SELECT id, student_id FROM students WHERE mobile = ?");
    $stmt->execute([$input['mobile']]);
    $student = $stmt->fetch();
    if (!$student) {
        $studentID = 'GIAS-' . date('Y') . '-' . strtoupper(substr(uniqid(), -4));
        $stmt = $pdo->prepare("INSERT INTO students (student_id, name, age, mobile, email, batch_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$studentID, $input['name'], $input['age'], $input['mobile'], $input['email'], $batchId]);
        $id = $pdo->lastInsertId();
    } else {
        $id = $student['id'];
        $studentID = $student['student_id'];
        if ($batchId) {
            $pdo->prepare("UPDATE students SET batch_id = ? WHERE id = ? AND (batch_id IS NULL OR batch_id = 0)")->execute([$batchId, $id]);
        }
    }
    echo json_encode(['status' => 'success', 'id' => $id, 'student_id' => $studentID]);
    exit;
}

if ($type === 'result') {
    $stmt = $pdo->prepare("SELECT id FROM students WHERE mobile = ?");
    $stmt->execute([$input['user']['mobile']]);
    $studentId = $stmt->fetchColumn();
    $verificationHash = bin2hex(random_bytes(16));
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $isSuspicious = $input['is_suspicious'] ?? 0;
    if (($input['duration'] ?? 100) < (count($input['all_responses'] ?? []) * 1)) { $isSuspicious = 1; }

    $stmt = $pdo->prepare("INSERT INTO assessment_results (student_id, total_score, grade, scores_json, test_type, tab_switches, duration, is_suspicious, verification_hash, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$studentId, $input['total'], $input['grade'], json_encode($input['scores']), $input['test_type'], $input['tab_switches'] ?? 0, $input['duration'] ?? 0, $isSuspicious, $verificationHash, $ip, $ua]);
    $assessmentId = $pdo->lastInsertId();

    if (!empty($input['all_responses']) && is_array($input['all_responses'])) {
        $stmtQR = $pdo->prepare("INSERT INTO question_responses (student_id, assessment_id, question_index, original_category_index, answer_value, test_type) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($input['all_responses'] as $resp) {
            $stmtQR->execute([$studentId, $assessmentId, $resp['qIndex'], $resp['catIndex'], $resp['value'], $input['test_type'] ?? '']);
        }
    }
    echo json_encode(['status' => 'success', 'v_hash' => $verificationHash]);
    exit;
}

if ($type === 'student_history') {
    session_start();
    $sId = $_SESSION['student_id'] ?? $input['student_db_id'] ?? null;
    if (!$sId) die(json_encode(['error' => 'Unauthorized']));
    $stmt = $pdo->prepare("SELECT * FROM assessment_results WHERE student_id = ? ORDER BY created_at DESC");
    $stmt->execute([$sId]);
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($type === 'save_pdf') {
    $vHash = $input['v_hash'] ?? '';
    if ($vHash && $input['pdf_base64']) {
        $dir = 'storage/certificates/';
        if (!file_exists($dir)) mkdir($dir, 0777, true);
        $path = $dir . $vHash . '.pdf';
        file_put_contents($path, base64_decode(preg_replace('#^data:application/pdf;base64,#i', '', $input['pdf_base64'])));
        $stmt = $pdo->prepare("UPDATE assessment_results SET pdf_path = ? WHERE verification_hash = ?");
        $stmt->execute([$path, $vHash]);
        echo json_encode(['status' => 'success', 'path' => $path]);
    } else {
        echo json_encode(['error' => 'Invalid data']);
    }
    exit;
}

// --- ADMIN ENDPOINTS (Restricted) ---

if (strpos($type, 'admin_') === 0) {
    session_start();
    if (!isset($_SESSION['admin_id'])) die(json_encode(['error' => 'Unauthorized']));

    if ($type === 'admin_backup_db') {
        $filename = "backup_" . date("Y-m-d_H-i-s") . ".sql";
        header('Content-Type: application/octet-stream');
        header("Content-Disposition: attachment; filename=\"$filename\"");
        $tables = ['students', 'assessment_results', 'question_responses', 'tests', 'questions', 'batches', 'cms_content', 'system_settings'];
        foreach ($tables as $table) {
            $stmt = $pdo->query("SELECT * FROM $table");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $keys = array_keys($row);
                $vals = array_values($row);
                echo "INSERT INTO $table (" . implode(',', $keys) . ") VALUES (" . implode(',', array_map(function($v) use ($pdo) { return $pdo->quote($v); }, $vals)) . ");\n";
            }
        }
        exit;
    }
    elseif ($type === 'admin_update_cms') {
        $stmt = $pdo->prepare("INSERT INTO cms_content (section_key, title, body) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body)");
        $stmt->execute([$input['section_key'], $input['title'], $input['body']]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($type === 'admin_update_batch') {
        $stmt = $pdo->prepare("UPDATE batches SET access_code = ? WHERE id = ?");
        $stmt->execute([$input['access_code'], $input['id']]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($type === 'admin_batch_analytics') {
        $stmt = $pdo->prepare("SELECT scores_json FROM assessment_results r JOIN students s ON r.student_id = s.id WHERE s.batch_id = ?");
        $stmt->execute([$input['batch_id']]);
        $allScores = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $avg = array_fill(0, 8, 0);
        $count = count($allScores);
        if ($count > 0) {
            foreach ($allScores as $sJson) {
                $s = json_decode($sJson, true);
                for ($i=0; $i<8; $i++) $avg[$i] += $s[$i] ?? 0;
            }
            for ($i=0; $i<8; $i++) $avg[$i] = round($avg[$i] / $count, 1);
        }
        echo json_encode(['status' => 'success', 'avg' => $avg, 'count' => $count]);
    }
    elseif ($type === 'admin_add_question') {
        $stmt = $pdo->prepare("INSERT INTO questions (test_type, category_index, text_en, text_hi, sort_order) VALUES (?, ?, ?, ?, (SELECT IFNULL(MAX(sort_order)+1, 0) FROM questions q2 WHERE test_type = ?))");
        $stmt->execute([$input['test_type'], $input['category_index'], $input['text_en'], $input['text_hi'], $input['test_type']]);
        echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId()]);
    }
    elseif ($type === 'admin_update_question') {
        $stmt = $pdo->prepare("UPDATE questions SET category_index = ?, text_en = ?, text_hi = ? WHERE id = ?");
        $stmt->execute([$input['category_index'], $input['text_en'], $input['text_hi'], $input['id']]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($type === 'admin_delete_question') {
        $stmt = $pdo->prepare("DELETE FROM questions WHERE id = ?");
        $stmt->execute([$input['id']]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($type === 'admin_add_test') {
        $stmt = $pdo->prepare("INSERT INTO tests (name, description, question_count) VALUES (?, ?, ?)");
        $stmt->execute([$input['name'], $input['description'], $input['question_count']]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($type === 'admin_toggle_test') {
        $stmt = $pdo->prepare("UPDATE tests SET is_active = NOT is_active WHERE id = ?");
        $stmt->execute([$input['id']]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($type === 'admin_delete_test') {
        if ($input['id'] <= 3) die(json_encode(['error' => 'Cannot delete system tests']));
        $stmt = $pdo->prepare("DELETE FROM tests WHERE id = ?");
        $stmt->execute([$input['id']]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($type === 'admin_bulk_upload') {
        $pdo->prepare("INSERT INTO batches (name) VALUES (?)")->execute([$input['batch_name'] ?? 'New Batch']);
        $rows = explode("\n", $input['csv']);
        $count = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0 || empty(trim($row))) continue;
            $data = str_getcsv($row);
            if (count($data) < 4) continue;
            $studentID = 'GIAS-' . date('Y') . '-' . strtoupper(substr(uniqid(), -4));
            $stmt = $pdo->prepare("INSERT INTO students (student_id, name, age, mobile, email) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$studentID, $data[0], $data[1], $data[2], $data[3]]);
            $count++;
        }
        echo json_encode(['status' => 'success', 'count' => $count]);
    }
    exit;
}

echo json_encode(['error' => 'Invalid Request']);
?>

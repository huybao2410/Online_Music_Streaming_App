<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Database connection
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "music_app";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get all active subscription plans
    $stmt = $conn->prepare("
        SELECT 
            id,
            name,
            description,
            price,
            currency,
            duration_days,
            ad_free,
            audio_quality,
            is_renewable,
            trial_period_days,
            renewal_discount,
            created_at
        FROM subscription_plans
        ORDER BY duration_days ASC
    ");
    
    $stmt->execute();
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert numeric values to proper types
    foreach ($plans as &$plan) {
        $plan['id'] = (int)$plan['id'];
        $plan['price'] = (float)$plan['price'];
        $plan['duration_days'] = (int)$plan['duration_days'];
        $plan['ad_free'] = (bool)$plan['ad_free'];
        $plan['is_renewable'] = (bool)$plan['is_renewable'];
        $plan['trial_period_days'] = (int)$plan['trial_period_days'];
        $plan['renewal_discount'] = (float)$plan['renewal_discount'];
    }
    
    echo json_encode([
        'success' => true,
        'plans' => $plans,
        'count' => count($plans)
    ], JSON_UNESCAPED_UNICODE);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

$conn = null;
?>

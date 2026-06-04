<?php
require_once __DIR__ . '/../vendor/autoload.php';

try {
    $mongoClient = new MongoDB\Client("mongodb://localhost:27017");
    //$mongoClient = new MongoDB\Client("mongodb+srv://banhang_db:acenyak123@cluster0.r276n7c.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true");
    $db = $mongoClient->lotte_mart;
    $conn = $db; // alias to match $conn variable name used in many places
} catch (Exception $e) {
    die("Kết nối database MongoDB Atlas thất bại: " . $e->getMessage());
}

// Helper: Lấy next numeric_id cho collection (thay thế auto-increment)
function getNextId($db, $collectionName) {
    $counter = $db->counters->findOneAndUpdate(
        ['_id' => $collectionName],
        ['$inc' => ['seq' => 1]],
        ['upsert' => true, 'returnDocument' => MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER]
    );
    return $counter['seq'];
}

// Helper: Định dạng hiển thị ngày tháng từ MongoDB UTCDateTime
function formatDate($mongoDate, $format = 'Y-m-d H:i:s') {
    if ($mongoDate instanceof MongoDB\BSON\UTCDateTime) {
        return $mongoDate->toDateTime()->setTimezone(new DateTimeZone('Asia/Ho_Chi_Minh'))->format($format);
    }
    return $mongoDate;
}
?>
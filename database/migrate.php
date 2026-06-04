<?php
require_once __DIR__ . '/../vendor/autoload.php';

$mongoClient = new MongoDB\Client("mongodb+srv://banhang_db:acenyak123@cluster0.r276n7c.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true");
$db = $mongoClient->lotte_mart;

echo "Bắt đầu chuyển đổi cơ sở dữ liệu...\n";

// Xóa database cũ để bắt đầu sạch
echo "Đang xóa database lotte_mart cũ (nếu có)...\n";
$db->drop();

$sqlFile = __DIR__ . '/../lotte_mart.sql';
if (!file_exists($sqlFile)) {
    die("LỖI: Không tìm thấy file lotte_mart.sql\n");
}

$sqlContent = file_get_contents($sqlFile);

// Hàm parse các giá trị trong một dòng VALUES của SQL
function parseSqlValues($valuesStr) {
    $values = [];
    $len = strlen($valuesStr);
    $i = 0;
    while ($i < $len) {
        // Bỏ qua khoảng trắng và dấu phẩy ngăn cách
        while ($i < $len && (in_array($valuesStr[$i], [" ", "\t", "\n", "\r", ","]))) {
            $i++;
        }
        if ($i >= $len) break;
        
        if ($valuesStr[$i] === "'") {
            // Đọc chuỗi ký tự (string)
            $str = "";
            $i++; // Bỏ qua dấu nháy đơn mở đầu
            while ($i < $len) {
                if ($valuesStr[$i] === "'") {
                    // Kiểm tra xem có phải dấu nháy đơn bị escape bằng dấu gạch chéo ngược (\') không
                    $backslashes = 0;
                    $k = $i - 1;
                    while ($k >= 0 && $valuesStr[$k] === '\\') {
                        $backslashes++;
                        $k--;
                    }
                    if ($backslashes % 2 === 0) {
                        // Không bị escape, đây là kết thúc chuỗi
                        $i++; // Bỏ qua dấu nháy đơn kết thúc
                        break;
                    }
                }
                $str .= $valuesStr[$i];
                $i++;
            }
            // Gỡ bỏ các ký tự escape
            $str = str_replace(["\\'", '\\"', '\\\\', '\\n', '\\r', '\\t'], ["'", '"', '\\', "\n", "\r", "\t"], $str);
            $values[] = $str;
        } else {
            // Đọc số hoặc NULL
            $val = "";
            while ($i < $len && !in_array($valuesStr[$i], [" ", "\t", "\n", "\r", ",", ")"])) {
                $val .= $valuesStr[$i];
                $i++;
            }
            if (strtoupper($val) === 'NULL') {
                $values[] = null;
            } elseif (is_numeric($val)) {
                $values[] = strpos($val, '.') !== false ? (float)$val : (int)$val;
            } else {
                $values[] = $val;
            }
        }
    }
    return $values;
}

// Tìm toàn bộ các lệnh INSERT INTO trong file SQL
// Định dạng: INSERT INTO `table_name` (`col1`, `col2`, ...) VALUES ...
preg_match_all('/INSERT INTO `(\w+)` \(([^)]+)\) VALUES\s*(.*?);/s', $sqlContent, $matches, PREG_SET_ORDER);

$insertedCounts = [];
$maxIds = [];

foreach ($matches as $match) {
    $tableName = $match[1];
    $columnsRaw = $match[2];
    $valuesBlock = $match[3];
    
    // Tách danh sách cột
    preg_match_all('/`(\w+)`/', $columnsRaw, $colMatches);
    $columns = $colMatches[1];
    
    // Tách từng dòng dữ liệu (các cặp ngoặc tròn bên trong VALUES block)
    // Ví dụ: (1, 3, '2026-03-21'), (2, 4, '2026-03-21')
    $rows = [];
    $len = strlen($valuesBlock);
    $inString = false;
    $currentRow = "";
    $parenthesesCount = 0;
    
    for ($i = 0; $i < $len; $i++) {
        $char = $valuesBlock[$i];
        
        // Quản lý trạng thái chuỗi nháy đơn để tránh nhầm ngoặc tròn trong chuỗi
        if ($char === "'") {
            $backslashes = 0;
            $k = $i - 1;
            while ($k >= 0 && $valuesBlock[$k] === '\\') {
                $backslashes++;
                $k--;
            }
            if ($backslashes % 2 === 0) {
                $inString = !$inString;
            }
        }
        
        if (!$inString) {
            if ($char === '(') {
                if ($parenthesesCount === 0) {
                    $currentRow = "";
                } else {
                    $currentRow .= $char;
                }
                $parenthesesCount++;
                continue;
            }
            if ($char === ')') {
                $parenthesesCount--;
                if ($parenthesesCount === 0) {
                    $rows[] = $currentRow;
                } else {
                    $currentRow .= $char;
                }
                continue;
            }
        }
        
        if ($parenthesesCount > 0) {
            $currentRow .= $char;
        }
    }
    
    $documents = [];
    $maxId = 0;
    
    foreach ($rows as $row) {
        $parsedValues = parseSqlValues($row);
        
        if (count($parsedValues) !== count($columns)) {
            echo "CẢNH BÁO: Số lượng cột và giá trị không khớp ở bảng $tableName. Cột: " . count($columns) . ", Giá trị: " . count($parsedValues) . "\n";
            continue;
        }
        
        $doc = [];
        foreach ($columns as $idx => $col) {
            $val = $parsedValues[$idx];
            
            // Xử lý kiểu dữ liệu phù hợp với MongoDB
            if ($col === 'id') {
                $val = (int)$val;
                if ($val > $maxId) {
                    $maxId = $val;
                }
                // Đồng bộ cả numeric_id và id (để tương thích ngược với code cũ)
                $doc['numeric_id'] = $val;
                $doc['id'] = $val;
            } elseif (strpos($col, '_id') !== false && is_numeric($val)) {
                $val = (int)$val;
            } elseif ($col === 'status' && is_numeric($val)) {
                $val = (int)$val;
            } elseif ($col === 'quantity' || $col === 'stock_quantity' || $col === 'rating') {
                $val = (int)$val;
            } elseif ($col === 'price' || $col === 'subtotal' || $col === 'shipping_fee' || $col === 'total_amount' || $col === 'amount') {
                $val = (float)$val;
            } elseif ($col === 'created_at' || $col === 'updated_at' || $col === 'paid_at') {
                if ($val !== null && $val !== '0000-00-00 00:00:00') {
                    // Chuyển chuỗi datetime sang MongoDB UTCDateTime
                    $dt = new DateTime($val, new DateTimeZone('Asia/Ho_Chi_Minh'));
                    $val = new MongoDB\BSON\UTCDateTime($dt->getTimestamp() * 1000);
                } else {
                    $val = null;
                }
            }
            
            $doc[$col] = $val;
        }
        
        $documents[] = $doc;
    }
    
    if (!empty($documents)) {
        $collection = $db->$tableName;
        $result = $collection->insertMany($documents);
        $insertedCounts[$tableName] = count($result->getInsertedIds());
        $maxIds[$tableName] = $maxId;
    }
}

// Khởi tạo bảng counters cho auto-increment của các collection
echo "Đang cấu hình các bộ đếm auto-increment...\n";
$countersCollection = $db->counters;
foreach ($maxIds as $colName => $maxId) {
    $countersCollection->insertOne([
        '_id' => $colName,
        'seq' => $maxId
    ]);
}

echo "\nKết quả chuyển đổi thành công:\n";
foreach ($insertedCounts as $table => $count) {
    echo "- Collection '$table': Đã import $count documents (ID lớn nhất hiện tại: " . ($maxIds[$table] ?? 0) . ")\n";
}

echo "\nHoàn thành chuyển dữ liệu sang MongoDB!\n";
?>

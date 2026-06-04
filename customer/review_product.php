<?php
require_once "../middleware/auth.php";
$allowed_roles = ['customer'];
require_once "../middleware/role.php";
require_once "../database/db.php";

$user_id = (int)$_SESSION['user_id'];
$order_id = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
$product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;

if ($order_id <= 0 || $product_id <= 0) {
    header("Location: /customer/orders.php?error=" . urlencode("Dữ liệu không hợp lệ"));
    exit();
}

/*
|----------------------------------------------------------
| Kiểm tra đơn hàng có thuộc user hiện tại không
| Và trạng thái có được phép đánh giá không
|----------------------------------------------------------
*/
$order = $db->orders->findOne(['id' => $order_id, 'user_id' => $user_id]);

if (!$order) {
    header("Location: /customer/orders.php?error=" . urlencode("Không tìm thấy đơn hàng"));
    exit();
}

$allowed_review_status = ['Đã giao', 'Đã hoàn thành'];
if (!in_array($order['order_status'], $allowed_review_status)) {
    header("Location: /customer/order_detail.php?id=" . $order_id . "&error=" . urlencode("Chỉ được đánh giá khi đơn hàng đã giao hoặc hoàn thành"));
    exit();
}

/*
|----------------------------------------------------------
| Kiểm tra sản phẩm có thuộc đơn hàng này không
|----------------------------------------------------------
*/
$product = $db->order_items->findOne(['order_id' => $order_id, 'product_id' => $product_id]);

if (!$product) {
    header("Location: /customer/order_detail.php?id=" . $order_id . "&error=" . urlencode("Sản phẩm không thuộc đơn hàng này"));
    exit();
}

/*
|----------------------------------------------------------
| Kiểm tra đã đánh giá chưa
|----------------------------------------------------------
*/
$existing_review = $db->reviews->findOne([
    'user_id' => $user_id,
    'order_id' => $order_id,
    'product_id' => $product_id
]);
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Đánh giá sản phẩm</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f7f7f7;
            margin: 20px;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #ddd;
            padding: 20px;
        }
        h2 {
            margin-top: 0;
        }
        .btn {
            display: inline-block;
            padding: 8px 12px;
            background: #007bff;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            border: none;
            cursor: pointer;
        }
        .btn-secondary {
            background: #6c757d;
        }
        .form-group {
            margin-bottom: 18px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
        }
        textarea {
            width: 100%;
            padding: 10px;
            box-sizing: border-box;
            resize: vertical;
        }
        .message {
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .success {
            background: #d4edda;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
        }

        /* Rating sao */
        .star-rating {
            display: inline-flex;
            flex-direction: row;
            gap: 8px;
            font-size: 38px;
            line-height: 1;
            cursor: pointer;
            user-select: none;
        }

        .star-rating span {
            color: #ccc;
            transition: transform 0.15s ease, color 0.15s ease;
        }

        .star-rating span.active {
            color: #ffc107;
        }

        .star-rating span:hover {
            transform: scale(1.15);
        }

        .star-rating span:active {
            transform: scale(1.3);
        }

        #ratingText {
            margin-top: 8px;
            color: #666;
            font-size: 15px;
            min-height: 20px;
        }

        .review-display-stars {
            font-size: 28px;
            color: #ffc107;
            margin-bottom: 8px;
        }

        .review-comment-box {
            padding: 12px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>Đánh giá sản phẩm</h2>

    <p>
        <a class="btn btn-secondary" href="/customer/order_detail.php?id=<?php echo (int)$order_id; ?>">← Quay lại chi tiết đơn hàng</a>
    </p>

    <?php if (isset($_GET['success'])): ?>
        <div class="message success"><?php echo htmlspecialchars($_GET['success']); ?></div>
    <?php endif; ?>

    <?php if (isset($_GET['error'])): ?>
        <div class="message error"><?php echo htmlspecialchars($_GET['error']); ?></div>
    <?php endif; ?>

    <p><strong>Mã đơn:</strong> <?php echo htmlspecialchars($order['order_code']); ?></p>
    <p><strong>Sản phẩm:</strong> <?php echo htmlspecialchars($product['product_name']); ?></p>
    <p><strong>Trạng thái đơn:</strong> <?php echo htmlspecialchars($order['order_status']); ?></p>

    <?php if ($existing_review): ?>
        <div class="message success">
            Bạn đã đánh giá sản phẩm này rồi.
        </div>

        <div class="form-group">
            <label>Số sao đã đánh giá:</label>
            <div class="review-display-stars">
                <?php
                $rating = (int)$existing_review['rating'];
                for ($i = 1; $i <= 5; $i++) {
                    echo ($i <= $rating) ? '★' : '☆';
                }
                ?>
            </div>
            <p><?php echo $rating; ?>/5</p>
        </div>

        <div class="form-group">
            <label>Nội dung đánh giá:</label>
            <div class="review-comment-box"><?php echo htmlspecialchars($existing_review['comment']); ?></div>
        </div>
    <?php else: ?>
        <form method="POST" action="submit_review.php" id="reviewForm">
            <input type="hidden" name="order_id" value="<?php echo (int)$order_id; ?>">
            <input type="hidden" name="product_id" value="<?php echo (int)$product_id; ?>">

            <div class="form-group">
                <label>Đánh giá sao</label>
                <input type="hidden" name="rating" id="rating" required>

                <div class="star-rating" id="starRating">
                    <span data-value="1">★</span>
                    <span data-value="2">★</span>
                    <span data-value="3">★</span>
                    <span data-value="4">★</span>
                    <span data-value="5">★</span>
                </div>

                <div id="ratingText"></div>
            </div>

            <div class="form-group">
                <label for="comment">Nội dung đánh giá</label>
                <textarea name="comment" id="comment" rows="5" placeholder="Nhập cảm nhận của bạn về sản phẩm..." required></textarea>
            </div>

            <button class="btn" type="submit">Gửi đánh giá</button>
        </form>
    <?php endif; ?>
</div>

<?php if (!$existing_review): ?>
<script>
    const stars = document.querySelectorAll('#starRating span');
    const ratingInput = document.getElementById('rating');
    const ratingText = document.getElementById('ratingText');
    const reviewForm = document.getElementById('reviewForm');

    let currentRating = 0;

    const texts = {
        1: "Rất tệ 😡",
        2: "Không hài lòng 😞",
        3: "Bình thường 😐",
        4: "Tốt 🙂",
        5: "Rất tốt 😍"
    };

    function highlightStars(value) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    stars.forEach(star => {
        star.addEventListener('mouseover', function () {
            const value = parseInt(this.getAttribute('data-value'));
            highlightStars(value);
        });

        star.addEventListener('mouseout', function () {
            highlightStars(currentRating);
        });

        star.addEventListener('click', function () {
            currentRating = parseInt(this.getAttribute('data-value'));
            ratingInput.value = currentRating;
            highlightStars(currentRating);
            ratingText.innerText = texts[currentRating] || '';
        });
    });

    reviewForm.addEventListener('submit', function (e) {
        if (!ratingInput.value) {
            e.preventDefault();
            alert('Vui lòng chọn số sao đánh giá.');
        }
    });
</script>
<?php endif; ?>

</body>
</html>
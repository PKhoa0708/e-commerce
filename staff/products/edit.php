<?php
require_once "../../middleware/auth.php";
$allowed_roles = ['staff'];
require_once "../../middleware/role.php";
require_once "../../database/db.php";
require_once "../../includes/header.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header("Location: /staff/products/index.php?error=ID không hợp lệ");
    exit();
}

$id = (int)$_GET['id'];

$product = $db->products->findOne(['id' => $id]);

if (!$product) {
    header("Location: /staff/products/index.php?error=Không tìm thấy sản phẩm");
    exit();
}

$categories = $db->categories->find(['status' => 1], ['sort' => ['id' => -1]]);
?>

<h2>Sửa sản phẩm</h2>

<?php if (isset($_GET['error'])): ?>
    <p style="color:red;"><?php echo htmlspecialchars($_GET['error']); ?></p>
<?php endif; ?>

<form action="/staff/products/update.php" method="POST" enctype="multipart/form-data">
    <input type="hidden" name="id" value="<?php echo $product['id']; ?>">
    <input type="hidden" name="old_thumbnail" value="<?php echo htmlspecialchars($product['thumbnail'] ?? ''); ?>">

    <div style="margin-bottom:10px;">
        <label>Tên sản phẩm</label><br>
        <input type="text" name="name" required value="<?php echo htmlspecialchars($product['name']); ?>" style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Danh mục</label><br>
        <select name="category_id" required style="width:400px; padding:8px;">
            <?php foreach ($categories as $cat): ?>
                <option value="<?php echo $cat['id']; ?>" <?php echo ($cat['id'] == $product['category_id']) ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($cat['name']); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>

    <div style="margin-bottom:10px;">
        <label>SKU</label><br>
        <input type="text" name="sku" value="<?php echo htmlspecialchars($product['sku']); ?>" style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Mô tả</label><br>
        <textarea name="description" rows="5" style="width:400px; padding:8px;"><?php echo htmlspecialchars($product['description']); ?></textarea>
    </div>

    <div style="margin-bottom:10px;">
        <label>Giá</label><br>
        <input type="number" name="price" min="0" required value="<?php echo $product['price']; ?>" style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
        <label>Số lượng tồn kho</label><br>
        <input type="number" name="stock_quantity" min="0" required value="<?php echo $product['stock_quantity']; ?>" style="width:400px; padding:8px;">
    </div>

    <div style="margin-bottom:10px;">
    <label>Ảnh hiện tại</label><br>

    <input type="hidden" name="delete_current_image" id="delete_current_image" value="0">

    <div id="image-preview-wrapper" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
        <?php if (!empty($product['thumbnail'])): ?>
            <div id="current-image-box" style="border:1px solid #ccc; padding:8px; text-align:center;">
                <img
                    id="current-image"
                    src="/<?php echo htmlspecialchars($product['thumbnail']); ?>"
                    width="120"
                    height="120"
                    style="object-fit:cover; display:block;"
                >
                <p style="margin-top:5px; font-size:13px;">Ảnh hiện tại</p>
            </div>
        <?php else: ?>
            <div id="no-image-text" style="padding:8px; color:#666;">
                Chưa có ảnh hiện tại
            </div>
        <?php endif; ?>
    </div>

    <div style="display:flex; align-items:center; gap:10px;">
        <button
            type="button"
            onclick="deleteCurrentImage()"
            style="padding:6px 12px; background:red; color:white; border:none; cursor:pointer;"
        >
            Xóa
        </button>

        <input
            type="file"
            name="thumbnail_files[]"
            id="thumbnail_files"
            accept="image/*"
            multiple
            onchange="previewSelectedImages(event)"
        >
    </div>

    <small style="display:block; margin-top:8px; color:#555;">
        Nếu không bấm Xóa, ảnh hiện tại sẽ được giữ nguyên. Ảnh mới chọn sẽ được thêm nối tiếp phía sau.
    </small>
</div>

<script>
function deleteCurrentImage() {
    const currentBox = document.getElementById('current-image-box');
    const deleteInput = document.getElementById('delete_current_image');
    const noImageText = document.getElementById('no-image-text');

    if (currentBox) {
        currentBox.remove();
    }

    if (!noImageText) {
        const wrapper = document.getElementById('image-preview-wrapper');
        const text = document.createElement('div');
        text.id = 'no-image-text';
        text.style.padding = '8px';
        text.style.color = '#666';
        text.innerText = 'Đã đánh dấu xóa ảnh hiện tại';
        wrapper.prepend(text);
    }

    deleteInput.value = '1';
}

function previewSelectedImages(event) {
    const files = event.target.files;
    const wrapper = document.getElementById('image-preview-wrapper');

    // Xóa các preview mới cũ trước khi render lại
    const oldNewPreviews = document.querySelectorAll('.new-preview-item');
    oldNewPreviews.forEach(item => item.remove());

    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        reader.onload = function(e) {
            const box = document.createElement('div');
            box.className = 'new-preview-item';
            box.style.border = '1px solid #ccc';
            box.style.padding = '8px';
            box.style.textAlign = 'center';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.width = 120;
            img.height = 120;
            img.style.objectFit = 'cover';
            img.style.display = 'block';

            const text = document.createElement('p');
            text.style.marginTop = '5px';
            text.style.fontSize = '13px';

            const deleteInput = document.getElementById('delete_current_image').value;

            if (deleteInput === '1') {
                text.innerText = (i === 0) ? 'Ảnh chính mới' : 'Ảnh phụ mới';
            } else {
                text.innerText = 'Ảnh thêm mới';
            }

            box.appendChild(img);
            box.appendChild(text);
            wrapper.appendChild(box);
        };
        reader.readAsDataURL(file);
    }
}
</script>

<script>
function deleteCurrentImage() {
    const currentBox = document.getElementById('current-image-box');
    const deleteInput = document.getElementById('delete_current_image');

    if (currentBox) {
        currentBox.remove();
    }

    deleteInput.value = '1';
}

function previewSelectedImages(event) {
    const files = event.target.files;
    const wrapper = document.getElementById('image-preview-wrapper');

    // Xóa preview cũ của file mới chọn, nhưng giữ ảnh hiện tại nếu chưa xóa
    const oldNewPreviews = document.querySelectorAll('.new-preview-item');
    oldNewPreviews.forEach(item => item.remove());

    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        reader.onload = function(e) {
            const box = document.createElement('div');
            box.className = 'new-preview-item';
            box.style.border = '1px solid #ccc';
            box.style.padding = '8px';
            box.style.textAlign = 'center';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.width = 120;
            img.height = 120;
            img.style.objectFit = 'cover';
            img.style.display = 'block';

            const text = document.createElement('p');
            text.style.marginTop = '5px';
            text.style.fontSize = '13px';
            text.innerText = (i === 0) ? 'Ảnh chính mới' : 'Ảnh phụ mới';

            box.appendChild(img);
            box.appendChild(text);
            wrapper.appendChild(box);
        };
        reader.readAsDataURL(file);
    }
}
</script>

    <div style="margin-bottom:10px;">
        <label>Trạng thái</label><br>
        <select name="status" required style="width:400px; padding:8px;">
            <option value="active" <?php echo ($product['status'] == 'active') ? 'selected' : ''; ?>>Hiển thị</option>
            <option value="inactive" <?php echo ($product['status'] == 'inactive') ? 'selected' : ''; ?>>Ẩn</option>
        </select>
    </div>

    <button type="submit" style="padding:10px 15px;">Cập nhật</button>
    <a href="/staff/products/index.php">Quay lại</a>
</form>

<?php require_once "../../includes/footer.php"; ?>
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'lotte_mart';

async function run() {
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        console.log('Đã kết nối thành công đến MongoDB:', mongoUri);
        const db = client.db(dbName);

        console.log(`Đang xóa database "${dbName}" cũ để bắt đầu làm sạch...`);
        await db.dropDatabase();

        const sqlFilePath = path.join(__dirname, '../lotte_mart.sql');
        if (!fs.existsSync(sqlFilePath)) {
            console.error('LỖI: Không tìm thấy file lotte_mart.sql tại:', sqlFilePath);
            process.exit(1);
        }

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('Đang phân tích cú pháp và import dữ liệu từ file SQL...');


        const insertRegex = /INSERT INTO `(\w+)` \(([^)]+)\) VALUES\s*([\s\S]*?);/g;
        let match;
        const insertedCounts = {};
        const maxIds = {};

        function parseSqlValues(valuesStr) {
            const values = [];
            const len = valuesStr.length;
            let i = 0;
            while (i < len) {

                while (i < len && ([' ', '\t', '\n', '\r', ','].includes(valuesStr[i]))) {
                    i++;
                }
                if (i >= len) break;

                if (valuesStr[i] === "'") {

                    let str = "";
                    i++;
                    while (i < len) {
                        if (valuesStr[i] === "'") {

                            let backslashes = 0;
                            let k = i - 1;
                            while (k >= 0 && valuesStr[k] === '\\') {
                                backslashes++;
                                k--;
                            }
                            if (backslashes % 2 === 0) {
                                i++;
                                break;
                            }
                        }
                        str += valuesStr[i];
                        i++;
                    }
                    // Unescape ký tự
                    str = str.replace(/\\'/g, "'")
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\')
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '\r')
                        .replace(/\\t/g, '\t');
                    values.push(str);
                } else {
                    // Đọc số hoặc NULL
                    let val = "";
                    while (i < len && ![' ', '\t', '\n', '\r', ',', ')'].includes(valuesStr[i])) {
                        val += valuesStr[i];
                        i++;
                    }
                    if (val.toUpperCase() === 'NULL') {
                        values.push(null);
                    } else if (!isNaN(val) && val.trim() !== "") {
                        values.push(val.includes('.') ? parseFloat(val) : parseInt(val, 10));
                    } else {
                        values.push(val);
                    }
                }
            }
            return values;
        }

        while ((match = insertRegex.exec(sqlContent)) !== null) {
            const tableName = match[1];
            const columnsRaw = match[2];
            const valuesBlock = match[3];

            // Tách tên cột
            const columns = [...columnsRaw.matchAll(/`(\w+)`/g)].map(m => m[1]);

            // Tách từng dòng dữ liệu (trong ngoặc tròn)
            const rows = [];
            let inString = false;
            let currentRow = "";
            let parenthesesCount = 0;
            const blockLen = valuesBlock.length;

            for (let i = 0; i < blockLen; i++) {
                const char = valuesBlock[i];
                if (char === "'") {
                    let backslashes = 0;
                    let k = i - 1;
                    while (k >= 0 && valuesBlock[k] === '\\') {
                        backslashes++;
                        k--;
                    }
                    if (backslashes % 2 === 0) {
                        inString = !inString;
                    }
                }

                if (!inString) {
                    if (char === '(') {
                        if (parenthesesCount === 0) {
                            currentRow = "";
                        } else {
                            currentRow += char;
                        }
                        parenthesesCount++;
                        continue;
                    }
                    if (char === ')') {
                        parenthesesCount--;
                        if (parenthesesCount === 0) {
                            rows.push(currentRow);
                        } else {
                            currentRow += char;
                        }
                        continue;
                    }
                }

                if (parenthesesCount > 0) {
                    currentRow += char;
                }
            }

            const documents = [];
            let maxId = 0;

            for (const row of rows) {
                const parsedValues = parseSqlValues(row);
                if (parsedValues.length !== columns.length) {
                    console.warn(`CẢNH BÁO: Số lượng cột và giá trị không khớp ở bảng ${tableName}. Cột: ${columns.length}, Giá trị: ${parsedValues.length}`);
                    continue;
                }

                const doc = {};
                columns.forEach((col, idx) => {
                    let val = parsedValues[idx];

                    // Định dạng kiểu dữ liệu cho MongoDB
                    if (col === 'id') {
                        val = parseInt(val, 10);
                        if (val > maxId) maxId = val;
                        doc['numeric_id'] = val;
                        doc['id'] = val;
                    } else if (col.includes('_id') && typeof val === 'number') {
                        val = parseInt(val, 10);
                    } else if (col === 'status' && typeof val === 'number') {
                        val = parseInt(val, 10);
                    } else if (['quantity', 'stock_quantity', 'rating'].includes(col)) {
                        val = parseInt(val, 10);
                    } else if (['price', 'subtotal', 'shipping_fee', 'total_amount', 'amount'].includes(col)) {
                        val = parseFloat(val);
                    } else if (['created_at', 'updated_at', 'paid_at'].includes(col)) {
                        if (val !== null && val !== '0000-00-00 00:00:00') {
                            val = new Date(val + ' GMT+0700'); // Mặc định giờ Việt Nam
                        } else {
                            val = null;
                        }
                    }
                    doc[col] = val;
                });
                documents.push(doc);
            }

            if (documents.length > 0) {
                await db.collection(tableName).insertMany(documents);
                insertedCounts[tableName] = documents.length;
                maxIds[tableName] = maxId;
            }
        }

        // Cấu hình counters cho auto-increment
        console.log('Đang cấu hình các bộ đếm auto-increment trong bảng "counters"...');
        const countersCollection = db.collection('counters');
        for (const [colName, maxId] of Object.entries(maxIds)) {
            await countersCollection.insertOne({
                _id: colName,
                seq: maxId
            });
        }

        console.log('\nKết quả chuyển đổi thành công:');
        for (const [table, count] of Object.entries(insertedCounts)) {
            console.log(`- Collection '${table}': Đã import ${count} documents (ID lớn nhất: ${maxIds[table] || 0})`);
        }
        console.log('\nHoàn thành chuyển dữ liệu sang MongoDB!');

    } catch (err) {
        console.error('Lỗi trong quá trình di chuyển cơ sở dữ liệu:', err);
    } finally {
        await client.close();
    }
}

run();

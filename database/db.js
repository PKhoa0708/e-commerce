const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'lotte_mart';

let client;
let db;

async function connectDB() {
    if (db) return db;
    try {
        client = new MongoClient(url);
        await client.connect();
        console.log('Kết nối thành công đến MongoDB:', url);
        db = client.db(dbName);
        return db;
    } catch (err) {
        console.error('Kết nối database MongoDB thất bại:', err);
        throw err;
    }
}

async function getNextId(collectionName) {
    const database = await connectDB();
    const result = await database.collection('counters').findOneAndUpdate(
        { _id: collectionName },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    // result might be the document directly in newer drivers or { value: doc } in older
    if (!result) return 1;
    const seq = result.seq !== undefined ? result.seq : (result.value ? result.value.seq : 1);
    return seq;
}

function formatDate(date, format = 'Y-m-d H:i:s') {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    // Convert to Vietnam timezone (GMT+7)
    // Date object internally holds UTC. Let's format it in Asia/Ho_Chi_Minh timezone.
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(d);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });

    // map fields: year, month, day, hour, minute, second
    const year = map.year;
    const month = map.month;
    const day = map.day;
    const hour = map.hour === '24' ? '00' : map.hour;
    const minute = map.minute;
    const second = map.second;

    return format
        .replace('Y', year)
        .replace('m', month)
        .replace('d', day)
        .replace('H', hour)
        .replace('i', minute)
        .replace('s', second);
}

module.exports = {
    connectDB,
    getDb: () => db,
    getNextId,
    formatDate
};

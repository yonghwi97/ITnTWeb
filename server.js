const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // 추가
require('dotenv').config(); // 환경변수 읽기

const app = express();
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // SSL 연결 (Neon은 SSL 필요)
  },
});

// POST 요청 처리
app.post('/submit', async (req, res) => {
    const { employeeId, name, suggestedName, reason } = req.body;
    try {
        await pool.query(
            'INSERT INTO submissions (employee_id, name, suggested_name, reason) VALUES ($1, $2, $3, $4)',
            [employeeId, name, suggestedName, reason]
        );
        res.send('제출 완료!');
    } catch (err) {
        console.error('DB 저장 오류:', err);
        res.status(500).send('서버 오류');
    }
});

// 기본 루트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`서버 실행 중! 포트: ${port}`);
});

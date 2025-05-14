const express = require('express');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// 폼 데이터 읽기 미들웨어 추가
app.use(express.urlencoded({ extended: true }));
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

app.get('/names', async (req, res) => {
    try {
        const result = await pool.query('SELECT suggested_name FROM submissions');
        const names = result.rows.map(row => row.suggested_name);
        res.json(names);
    } catch (err) {
        console.error('DB 이름 조회 오류:', err);
        res.status(500).send('서버 오류');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`서버 실행 중! 포트: ${port}`);
});


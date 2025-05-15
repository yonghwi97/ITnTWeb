const express = require('express');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 이름 + 투표수 가져오기
app.get('/names', async (req, res) => {
    try {
        const result = await pool.query('SELECT suggested_name, vote_count FROM submissions');
        res.json(result.rows);
    } catch (err) {
        console.error('DB 이름 조회 오류:', err);
        res.status(500).send('서버 오류');
    }
});

// 새로운 이름 제출
app.post('/submit', async (req, res) => {
    const { name, suggestedName, reason } = req.body;
    try {
        await pool.query(
            'INSERT INTO submissions (name, suggested_name, reason, vote_count) VALUES ($1, $2, $3, 0)',
            [name, suggestedName, reason]
        );
        res.send('제출 완료!');
    } catch (err) {
        console.error('DB 저장 오류:', err);
        res.status(500).send('서버 오류');
    }
});

// 투표하기
app.post('/vote', async (req, res) => {
    const { userName, suggestedName } = req.body;  // employeeId 삭제

    try {
        // 1. 이름으로 등록 여부 확인
        const checkEmployee = await pool.query(
            'SELECT * FROM employees WHERE name = $1',
            [userName]
        );

        if (checkEmployee.rows.length === 0) {
            return res.status(400).send('등록되지 않은 사원입니다.');
        }

        const employee = checkEmployee.rows[0];

        // 2. 이미 투표했는지 확인
        if (employee.has_voted) {
            return res.status(400).send('이미 투표하셨습니다.');
        }

        // 3. 투표수 +1
        await pool.query(
            'UPDATE submissions SET vote_count = vote_count + 1 WHERE suggested_name = $1',
            [suggestedName]
        );

        // 4. 투표 완료 처리
        await pool.query(
            'UPDATE employees SET has_voted = TRUE WHERE name = $1',
            [userName]
        );

        res.send('투표 완료!');
    } catch (err) {
        console.error('투표 처리 오류:', err);
        res.status(500).send('서버 오류');
    }
});



// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`서버 실행 중! 포트: ${port}`);
});

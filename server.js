const express = require('express');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // public 폴더 기준 정적 파일 제공

// PostgreSQL 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 제출 API
app.post('/submit', async (req, res) => {
  const { name, suggestedName, reason } = req.body;
  try {
    const existing = await pool.query(
      'SELECT * FROM submissions WHERE suggested_name = $1',
      [suggestedName]
    );
    if (existing.rows.length > 0) {
      return res.status(400).send('이미 등록된 SW 이름입니다.');
    }

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

// SW 이름 목록 조회 API
app.get('/names', async (req, res) => {
  try {
    const result = await pool.query('SELECT suggested_name, vote_count, reason FROM submissions');
    res.json(result.rows);
  } catch (err) {
    console.error('DB 이름 조회 오류:', err);
    res.status(500).send('서버 오류');
  }
});

// 투표 API
app.post('/vote', async (req, res) => {
  const { name, suggestedName } = req.body;
  try {
    // 이름 확인
    const user = await pool.query('SELECT * FROM employees WHERE name = $1', [name]);
    if (user.rows.length === 0) {
      return res.status(404).send('등록되지 않은 이름입니다.');
    }

    const votedCount = user.rows[0].has_voted || 0;
    if (votedCount >= 10) {
      return res.status(400).send('더 이상 투표할 수 없습니다.');
    }

    // 본인이 제출한 SW 이름인지 확인
    const submission = await pool.query('SELECT * FROM submissions WHERE suggested_name = $1', [suggestedName]);
    if (submission.rows.length > 0 && submission.rows[0].name === name) {
      return res.status(400).send('본인이 제출한 SW 이름에는 투표할 수 없습니다.');
    }

    // 투표 집계
    await pool.query(
      'UPDATE submissions SET vote_count = vote_count + 1 WHERE suggested_name = $1',
      [suggestedName]
    );

    // 사용자 투표 횟수 +1
    await pool.query(
      'UPDATE employees SET has_voted = has_voted + 1 WHERE name = $1',
      [name]
    );

    res.send('투표 완료!');
  } catch (err) {
    console.error('투표 오류:', err);
    res.status(500).send('서버 오류');
  }
});



// 이름 유효성 체크 API
app.post('/check-name', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE name = $1', [name]);
    if (result.rows.length > 0) {
      res.send({ exists: true });
    } else {
      res.send({ exists: false });
    }
  } catch (err) {
    console.error('이름 확인 오류:', err);
    res.status(500).send('서버 오류');
  }
});

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`서버 실행 중! 포트: ${port}`);
});


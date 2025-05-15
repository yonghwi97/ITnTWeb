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
    const user = await pool.query('SELECT * FROM submissions WHERE suggested_name = $1', [suggestedName]);
    if (user.rows.length === 0) {
      return res.status(404).send('해당 이름이 존재하지 않습니다.');
    }

    await pool.query(
      'UPDATE submissions SET vote_count = vote_count + 1 WHERE suggested_name = $1',
      [suggestedName]
    );
    res.send('투표 완료!');
  } catch (err) {
    console.error('투표 오류:', err);
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

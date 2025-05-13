const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public')); // public 폴더에 HTML, CSS 넣기

// 데이터 받는 API
app.post('/submit', (req, res) => {
    const { employeeId, name, suggestedName, reason } = req.body;
    console.log('받은 데이터:', { employeeId, name, suggestedName, reason });
    // TODO: DB 저장 로직 추가
    res.send('제출 완료!');
});

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});

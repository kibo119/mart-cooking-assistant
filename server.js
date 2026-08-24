// server.js
// Express 백엔드: 프론트엔드 요청을 받아 Anthropic Claude API를 대신 호출합니다.
// API 키가 브라우저에 노출되지 않도록 반드시 서버에서만 사용합니다.

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// base64 이미지가 포함된 요청도 받을 수 있도록 용량 제한을 넉넉하게 설정
app.use(express.json({ limit: '20mb' }));

// public 폴더(프론트엔드 정적 파일)를 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 시스템 프롬프트(마트 요리 추천 AI 지침)를 파일에서 읽어옴
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'systemPrompt.txt'),
  'utf-8'
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// 비전(이미지 인식)을 지원하는 최신 Claude 모델
const MODEL = 'claude-sonnet-5';

// 프론트엔드가 대화(messages)를 통째로 보내면, 서버가 Claude API에 전달하고 응답을 돌려줌
app.post('/api/chat', async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY가 설정되어 있지 않습니다. .env 파일을 확인해주세요.',
      });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 배열이 필요합니다.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API 오류:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Claude API 호출 중 오류가 발생했습니다.',
      });
    }

    // 응답에서 텍스트 블록만 추출해서 프론트엔드로 전달
    const textBlock = (data.content || []).find((block) => block.type === 'text');

    res.json({ reply: textBlock ? textBlock.text : '' });
  } catch (err) {
    console.error('서버 오류:', err);
    res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  if (!ANTHROPIC_API_KEY) {
    console.warn('⚠️  .env 파일에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.');
  }
});

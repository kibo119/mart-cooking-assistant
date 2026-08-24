// server.js
// Express 백엔드: 프론트엔드 요청을 받아 Google Gemini API를 대신 호출합니다.
// API 키가 브라우저에 노출되지 않도록 반드시 서버에서만 사용합니다.

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'systemPrompt.txt'),
  'utf-8'
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const
const MODEL = 'gemini-3.6-flash'; // 무료 티어에서 사용 가능한 모델


// 프론트엔드가 보낸 messages(Claude 형식)를 Gemini 형식으로 변환
function convertToGeminiContents(messages) {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: msg.content.map((block) => {
      if (block.type === 'image') {
        return {
          inline_data: {
            mime_type: block.source.media_type,
            data: block.source.data,
          },
        };
      }
      return { text: block.text };
    }),
  }));
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY가 설정되어 있지 않습니다. .env 파일을 확인해주세요.',
      });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 배열이 필요합니다.' });
    }

    const contents = convertToGeminiContents(messages);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API 오류:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.',
      });
    }

    const replyText =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

    res.json({ reply: replyText });
  } catch (err) {
    console.error('서버 오류:', err);
    res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  .env 파일에 GEMINI_API_KEY가 설정되어 있지 않습니다.');
  }
});

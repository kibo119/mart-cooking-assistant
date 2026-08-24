# 🛒 오늘 뭐 해먹지? — 마트 요리 추천 도우미

마트에서 카메라로 식재료를 비추거나 재료 이름을 입력하면,
초보자도 실패 없이 만들 수 있는 요리를 추천해주는 웹앱입니다.

- 프론트엔드: HTML / CSS / JavaScript (바닐라)
- 백엔드: Node.js + Express
- AI: Anthropic Claude API (이미지 인식 + 요리 추천)

## 1. 설치

```bash
npm install
```

## 2. API 키 설정

1. https://console.anthropic.com 에서 API 키를 발급받으세요.
2. `.env.example` 파일을 복사해서 `.env` 파일을 만드세요.

```bash
cp .env.example .env
```

3. `.env` 파일을 열어 발급받은 키를 넣어주세요.

```
ANTHROPIC_API_KEY=sk-ant-실제_발급받은_키
PORT=3000
```

`.env` 파일은 `.gitignore`에 포함되어 있어 GitHub에는 절대 올라가지 않습니다.

## 3. 실행

```bash
npm start
```

브라우저에서 http://localhost:3000 접속

## 4. 사용 방법

1. "카메라 켜기" 버튼을 눌러 후면 카메라를 켭니다 (모바일 브라우저 권장).
2. 마트에서 식재료를 비추고 "촬영해서 물어보기"를 누릅니다.
   - 또는 "사진 업로드"로 이미 찍어둔 사진을 사용할 수 있습니다.
   - 또는 텍스트 입력창에 재료 이름을 직접 입력해도 됩니다.
3. AI가 재료를 인식하고, 초보자도 쉽게 만들 수 있는 요리 3가지를 추천합니다.
4. 마음에 드는 요리를 채팅으로 선택하면 상세 레시피(재료 손질, 조리 순서, 실패 방지 팁,
   남은 재료 보관법 등)를 안내합니다.

## 5. GitHub에 올리기

```bash
git init
git add .
git commit -m "마트 요리 추천 웹앱 초기 커밋"
git branch -M main
git remote add origin <본인의_깃허브_저장소_URL>
git push -u origin main
```

`.env` 파일(실제 API 키)은 절대 커밋되지 않으니, 저장소를 공유받은 사람은
`.env.example`을 참고해서 본인의 키를 직접 넣어야 합니다.

## 6. 배포 참고

- 카메라(`getUserMedia`)는 보안상 **HTTPS 환경 또는 localhost**에서만 동작합니다.
  Vercel, Render, Railway 등에 배포하면 기본적으로 HTTPS가 적용됩니다.
- 배포 플랫폼의 환경변수 설정 화면에 `ANTHROPIC_API_KEY`를 등록해주세요.

## 폴더 구조

```
mart-cooking-assistant/
├── server.js            # Express 백엔드 (Claude API 호출)
├── systemPrompt.txt      # AI 요리 추천 시스템 프롬프트
├── package.json
├── .env.example
├── .gitignore
└── public/
    ├── index.html         # 카메라 + 채팅 UI
    ├── style.css
    └── script.js          # 카메라 제어 + API 호출 로직
```

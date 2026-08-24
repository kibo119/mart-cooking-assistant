// script.js
// 카메라 촬영/사진 업로드 + 채팅 UI + 백엔드(/api/chat) 호출을 담당합니다.

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const fileInput = document.getElementById('fileInput');
const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

// Anthropic API 형식에 맞춘 대화 기록 (서버로 그대로 전달됨)
// 예: [{ role: 'user', content: [...] }, { role: 'assistant', content: [...] }]
let conversationHistory = [];

// 현재 촬영/업로드된 이미지의 base64 데이터 (전송 대기 중인 이미지)
let pendingImageBase64 = null;
let pendingImageMediaType = null;

// ---------- 카메라 제어 ----------

startCameraBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // 후면 카메라 우선 (마트에서 재료를 비출 때 편함)
    });
    video.srcObject = stream;
    startCameraBtn.hidden = true;
    captureBtn.hidden = false;
  } catch (err) {
    alert('카메라를 사용할 수 없어요. 브라우저 권한을 확인해주세요.');
    console.error(err);
  }
});

captureBtn.addEventListener('click', () => {
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  setPendingImage(dataUrl, 'image/jpeg');
});

// ---------- 사진 업로드 (카메라 대신) ----------

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    setPendingImage(reader.result, file.type);
  };
  reader.readAsDataURL(file);
});

function setPendingImage(dataUrl, mediaType) {
  // "data:image/jpeg;base64,AAAA..." 형태에서 base64 부분만 추출
  const base64Data = dataUrl.split(',')[1];
  pendingImageBase64 = base64Data;
  pendingImageMediaType = mediaType;

  preview.src = dataUrl;
  preview.hidden = false;
}

// ---------- 채팅 ----------

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = chatInput.value.trim();

  // 텍스트도 없고 이미지도 없으면 아무것도 하지 않음
  if (!text && !pendingImageBase64) return;

  // 사용자 메시지의 content 블록 구성 (이미지 + 텍스트 순서)
  const userContent = [];

  if (pendingImageBase64) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: pendingImageMediaType,
        data: pendingImageBase64,
      },
    });
  }

  userContent.push({
    type: 'text',
    text: text || '이 재료들로 뭘 만들 수 있을까요?',
  });

  // 화면에 사용자 메시지 표시
  renderUserMessage(text, pendingImageBase64 ? preview.src : null);

  conversationHistory.push({ role: 'user', content: userContent });

  // 입력창 및 대기 중인 이미지 초기화
  chatInput.value = '';
  clearPendingImage();

  const loadingEl = renderLoadingMessage();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    const data = await response.json();

    loadingEl.remove();

    if (!response.ok) {
      renderAssistantMessage(`⚠️ 오류가 발생했어요: ${data.error || '알 수 없는 오류'}`);
      return;
    }

    renderAssistantMessage(data.reply);
    conversationHistory.push({
      role: 'assistant',
      content: [{ type: 'text', text: data.reply }],
    });
  } catch (err) {
    loadingEl.remove();
    renderAssistantMessage('⚠️ 서버에 연결할 수 없어요. 서버가 실행 중인지 확인해주세요.');
    console.error(err);
  }
});

function clearPendingImage() {
  pendingImageBase64 = null;
  pendingImageMediaType = null;
  preview.hidden = true;
  preview.src = '';
  fileInput.value = '';
}

// ---------- 화면 렌더링 ----------

function renderUserMessage(text, imageSrc) {
  const el = document.createElement('div');
  el.className = 'message user';

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    el.appendChild(img);
  }

  if (text) {
    const textNode = document.createElement('div');
    textNode.textContent = text;
    el.appendChild(textNode);
  }

  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderAssistantMessage(text) {
  const el = document.createElement('div');
  el.className = 'message assistant';
  el.textContent = text;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderLoadingMessage() {
  const el = document.createElement('div');
  el.className = 'message assistant loading';
  el.textContent = '재료를 살펴보는 중이에요...';
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return el;
}

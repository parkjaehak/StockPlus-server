# StockPlus Backend Server

한국투자 Open API를 프록시하는 백엔드 서버입니다. Chrome 확장 프로그램에서 API 키를 공유하여 사용할 수 있도록 합니다.

## 🚀 주요 기능

- **API 키 중앙 관리**: 서버에서 한국투자 Open API 키를 안전하게 관리
- **토큰 캐싱**: 액세스 토큰과 승인키를 효율적으로 캐싱
- **요청 제한**: IP별 요청 제한으로 API 남용 방지
- **CORS 지원**: Chrome 확장 프로그램에서 안전하게 접근 가능
- **에러 처리**: 상세한 에러 메시지와 로깅

## 📋 API 엔드포인트

### 기본 정보

- **Base URL**: `http://localhost:3000/api`
- **헬스체크**: `GET /health`

### 주식 관련 API

- `GET /api/search-conditions` - 조건검색식 목록 조회
- `GET /api/search-result?seq={seq}` - 조건검색 결과 조회
- `GET /api/stock-price?stockCode={code}` - 단일 종목 시세 조회
- `POST /api/stock-prices` - 다중 종목 시세 조회
- `GET /api/approval-key` - 실시간 접속키 조회
- `GET /api/token-status` - 토큰 상태 확인

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
cd server
npm install
```

### 2. 환경변수 설정

```bash
cp env.example .env
```

`.env` 파일을 편집하여 다음 정보를 입력하세요:

```env
# 한국투자 Open API 설정
APP_KEY=your_app_key_here
APP_SECRET=your_app_secret_here
HTS_USER_ID=your_hts_user_id_here

# 서버 설정
PORT=3000
NODE_ENV=development

# CORS 설정 (Chrome Extension ID)
ALLOWED_ORIGINS=chrome-extension://your_extension_id_here

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. 서버 실행

```bash
npm install
npm run dev # 또는 npm start
```

## 🔧 설정 옵션

### 환경변수

- `APP_KEY`: 한국투자 Open API 앱 키
- `APP_SECRET`: 한국투자 Open API 앱 시크릿
- `HTS_USER_ID`: HTS 사용자 ID
- `PORT`: 서버 포트 (기본값: 3000)
- `NODE_ENV`: 실행 환경 (development/production)
- `ALLOWED_ORIGINS`: 허용된 CORS 오리진 (쉼표로 구분)
- `RATE_LIMIT_WINDOW_MS`: 요청 제한 윈도우 (밀리초)
- `RATE_LIMIT_MAX_REQUESTS`: 최대 요청 수

## 📊 모니터링

### 헬스체크

```bash
curl http://localhost:3000/health
```

### 토큰 상태 확인

```bash
curl http://localhost:3000/api/token-status
```

## 🔒 보안 고려사항

1. **API 키 보안**: `.env` 파일을 절대 Git에 커밋하지 마세요
2. **CORS 설정**: 프로덕션에서는 특정 확장 프로그램 ID만 허용하세요
3. **Rate Limiting**: API 남용을 방지하기 위해 요청 제한을 설정하세요
4. **HTTPS**: 프로덕션에서는 반드시 HTTPS를 사용하세요

## 🚀 배포

### Heroku 배포

```bash
# Heroku CLI 설치 후
heroku create your-app-name
heroku config:set APP_KEY=your_app_key
heroku config:set APP_SECRET=your_app_secret
heroku config:set HTS_USER_ID=your_hts_user_id
git push heroku main
```

### Vercel 배포

```bash
# Vercel CLI 설치 후
vercel
# 환경변수는 Vercel 대시보드에서 설정
```

## 📝 로그

서버는 다음 정보를 로깅합니다:

- 토큰 발급/갱신
- API 요청/응답
- 에러 발생
- 요청 제한 초과

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 📦 폴더 구조

```
stock-view-server/
├── src/
│   ├── middleware/
│   │   └── rateLimiter.js
│   ├── services/
│   │   ├── apiProxy.js
│   │   └── tokenManager.js
│   ├── config.js
│   ├── env.js         ← gitignore
│   └── server.js
├── .gitignore
├── env.example.js
├── package.json
├── package-lock.json
├── README.md
├── start.bat
├── start.sh
```

- `src/env.js`는 민감 정보가 들어가며, `.gitignore`에 등록되어 있습니다.
- `env.example.js`를 참고해서 `src/env.js`를 만들어 사용하세요.

## 🚀 실행 방법

```bash
npm install
npm run dev # 또는 npm start
```

- 메인 서버 파일: `src/server.js`
- 환경 변수/민감 정보: `src/env.js` (gitignore)

## ✨ 기타

- test.js 파일은 삭제되었습니다.
- 자세한 사용법 및 API 문서는 추후 추가 예정입니다.

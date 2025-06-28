const express = require("express");
const cors = require("cors");
const config = require("./config");
const apiProxy = require("./services/apiProxy");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();
const PORT = config.PORT;

// CORS 설정
const allowedOrigins = config.ALLOWED_ORIGINS
  ? config.ALLOWED_ORIGINS.split(",")
  : ["chrome-extension://*"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Chrome Extension의 경우 origin이 null일 수 있음
      if (
        !origin ||
        allowedOrigins.includes("chrome-extension://*") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS 정책에 의해 차단됨"));
      }
    },
    credentials: true,
  })
);

// 미들웨어
app.use(express.json());
app.use(rateLimiter);

// 헬스체크 엔드포인트
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API 프록시 엔드포인트
app.use("/api", apiProxy);

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error("서버 에러:", err);
  res.status(500).json({
    error: "서버 내부 오류",
    message:
      config.NODE_ENV === "development"
        ? err.message
        : "알 수 없는 오류가 발생했습니다.",
  });
});

// 404 핸들링
app.use("*", (req, res) => {
  res.status(404).json({ error: "엔드포인트를 찾을 수 없습니다." });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 StockPlus 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 환경: ${config.NODE_ENV}`);
  console.log(`🔗 헬스체크: http://localhost:${PORT}/health`);
});

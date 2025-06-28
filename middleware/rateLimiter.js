const NodeCache = require("node-cache");
const config = require("../config");

// IP별 요청 제한을 위한 캐시
const requestCache = new NodeCache({ stdTTL: 60 }); // 1분 TTL

// Rate Limiting 설정
const WINDOW_MS = config.RATE_LIMIT_WINDOW_MS; // 1분
const MAX_REQUESTS = config.RATE_LIMIT_MAX_REQUESTS; // 최대 100개 요청

function rateLimiter(req, res, next) {
  // IP 주소 가져오기 (프록시 환경 고려)
  const clientIP =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    "unknown";

  const cacheKey = `rate_limit:${clientIP}`;
  const now = Date.now();

  // 현재 IP의 요청 기록 가져오기
  let requests = requestCache.get(cacheKey) || [];

  // 윈도우 시간 범위 내의 요청만 유지
  requests = requests.filter((timestamp) => now - timestamp < WINDOW_MS);

  // 현재 요청 추가
  requests.push(now);

  // 캐시에 저장
  requestCache.set(cacheKey, requests, Math.ceil(WINDOW_MS / 1000));

  // 요청 수 확인
  if (requests.length > MAX_REQUESTS) {
    const retryAfter = Math.ceil(WINDOW_MS / 1000);

    res.set({
      "Retry-After": retryAfter,
      "X-RateLimit-Limit": MAX_REQUESTS,
      "X-RateLimit-Remaining": 0,
      "X-RateLimit-Reset": new Date(now + WINDOW_MS).toISOString(),
    });

    return res.status(429).json({
      error: "요청 한도를 초과했습니다.",
      message: `분당 최대 ${MAX_REQUESTS}개 요청을 초과했습니다. ${retryAfter}초 후에 다시 시도해주세요.`,
      retryAfter: retryAfter,
    });
  }

  // 응답 헤더에 제한 정보 추가
  res.set({
    "X-RateLimit-Limit": MAX_REQUESTS,
    "X-RateLimit-Remaining": Math.max(0, MAX_REQUESTS - requests.length),
    "X-RateLimit-Reset": new Date(now + WINDOW_MS).toISOString(),
  });

  next();
}

module.exports = rateLimiter;

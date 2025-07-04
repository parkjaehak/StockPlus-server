const config = {
  // 한국투자 Open API 설정
  APP_KEY: process.env.APP_KEY,
  APP_SECRET: process.env.APP_SECRET,
  HTS_USER_ID: process.env.HTS_USER_ID,

  // 서버 설정
  PORT: 3000,
  NODE_ENV: "development",

  // CORS 설정 (Chrome Extension ID)
  ALLOWED_ORIGINS: "*",

  // API Rate Limiting
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
};

module.exports = config;

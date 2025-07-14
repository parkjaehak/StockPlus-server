const axios = require("axios");
const NodeCache = require("node-cache");
const config = require("../config");

class TokenManager {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1시간 캐시
    this.baseUrl = "https://openapi.koreainvestment.com:9443";
    this.appKey = config.APP_KEY;
    this.appSecret = config.APP_SECRET;
    this.isInitialized = false;
    this.autoRefreshInterval = null;
  }

  // 백그라운드 자동 갱신 시작
  startAutoRefresh() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // 서버 시작 시 즉시 토큰 발급
    this.refreshTokens();

    // Access Token: 23시간 55분마다 갱신 (24시간 - 5분)
    const accessTokenInterval = (24 * 60 * 60 - 300) * 1000; // 23시간 55분
    setInterval(() => {
      this.getAccessToken().catch(error => {
        // 에러 발생 시 조용히 처리
      });
    }, accessTokenInterval);

    // Approval Key: 23시간 55분마다 갱신 (24시간 - 5분)
    const approvalKeyInterval = (24 * 60 * 60 - 300) * 1000; // 23시간 55분
    setInterval(() => {
      this.getApprovalKey().catch(error => {
        // 에러 발생 시 조용히 처리
      });
    }, approvalKeyInterval);
  }

  // 초기 토큰 발급
  async refreshTokens() {
    try {
      await Promise.all([
        this.getAccessToken(),
        this.getApprovalKey()
      ]);
    } catch (error) {
      // 에러 발생 시 조용히 처리
    }
  }

  async getAccessToken() {
    const cacheKey = "access_token";
    let token = this.cache.get(cacheKey);

    if (token) {
      return token;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth2/tokenP`,
        {
          grant_type: "client_credentials",
          appkey: this.appKey,
          appsecret: this.appSecret,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10초 타임아웃
        }
      );

      if (response.data.access_token) {
        token = response.data.access_token;
        const expiresIn = response.data.expires_in - 300; // 5분 여유
        this.cache.set(cacheKey, token, expiresIn);
        return token;
      } else {
        throw new Error("토큰 응답에 access_token이 없습니다.");
      }
    } catch (error) {
      throw new Error(
        `토큰 발급 실패: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  async getApprovalKey() {
    const cacheKey = "approval_key";
    let approvalKey = this.cache.get(cacheKey);

    if (approvalKey) {
      return approvalKey;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth2/Approval`,
        {
          grant_type: "client_credentials",
          appkey: this.appKey,
          secretkey: this.appSecret,
        },
        {
          headers: {
            "Content-Type": "application/json; utf-8",
          },
          timeout: 10000, // 10초 타임아웃
        }
      );

      if (response.data.approval_key) {
        approvalKey = response.data.approval_key;
        const expiresIn = (24 * 60 * 60) - 300; // 23시간 55분
        this.cache.set(cacheKey, approvalKey, expiresIn);
        return approvalKey;
      } else {
        throw new Error("승인키 응답에 approval_key가 없습니다.");
      }
    } catch (error) {
      throw new Error(
        `승인키 발급 실패: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  // 캐시 상태 확인
  getCacheStatus() {
    const accessToken = this.cache.get("access_token") ? "valid" : "expired";
    const approvalKey = this.cache.get("approval_key") ? "valid" : "expired";
    const accessTokenTTL = this.cache.getTtl("access_token");
    const approvalKeyTTL = this.cache.getTtl("approval_key");
    
    return {
      accessToken,
      approvalKey,
      cacheSize: this.cache.keys().length,
      accessTokenExpiresAt: accessTokenTTL ? new Date(accessTokenTTL).toISOString() : null,
      approvalKeyExpiresAt: approvalKeyTTL ? new Date(approvalKeyTTL).toISOString() : null,
      autoRefreshEnabled: this.isInitialized,
    };
  }

  // 캐시 초기화 (테스트용)
  clearCache() {
    this.cache.flushAll();
  }

  // 자동 갱신 중지
  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
    this.isInitialized = false;
  }
}

// 싱글톤 인스턴스 생성
const tokenManager = new TokenManager();

module.exports = { tokenManager };

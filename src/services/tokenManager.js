const axios = require("axios");
const NodeCache = require("node-cache");
const config = require("../config");

class TokenManager {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1시간 캐시
    this.baseUrl = "https://openapi.koreainvestment.com:9443";
    this.appKey = config.APP_KEY;
    this.appSecret = config.APP_SECRET;
  }

  async getAccessToken() {
    const cacheKey = "access_token";
    let token = this.cache.get(cacheKey);

    if (token) {
      console.log(`[TokenManager] Access Token 캐시 HIT`);
      return token;
    } else {
      console.log(`[TokenManager] Access Token 캐시 MISS, 새로 발급 시도`);
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
        }
      );

      if (response.data.access_token) {
        token = response.data.access_token;
        const expiresIn = response.data.expires_in - 300;
        this.cache.set(cacheKey, token, expiresIn);
        console.log(`[TokenManager] 새로운 Access Token 발급 및 캐싱 (${expiresIn}초)`);
        return token;
      } else {
        console.error(`[TokenManager] 토큰 응답에 access_token이 없습니다. 응답:`, response.data);
        throw new Error("토큰 응답에 access_token이 없습니다.");
      }
    } catch (error) {
      console.error(`[TokenManager] Access Token 발급 실패:`, error.response?.data || error.message);
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
      console.log(`[TokenManager] Approval Key 캐시 HIT`);
      return approvalKey;
    } else {
      console.log(`[TokenManager] Approval Key 캐시 MISS, 새로 발급 시도`);
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
        }
      );

      if (response.data.approval_key) {
        approvalKey = response.data.approval_key;
        this.cache.set(cacheKey, approvalKey, (24 * 60 * 60) - 300); // 23시간 55분
        console.log(`[TokenManager] 새로운 Approval Key 발급 및 캐싱 (${(24 * 60 * 60) - 300}초)`);
        return approvalKey;
      } else {
        console.error(`[TokenManager] 승인키 응답에 approval_key가 없습니다. 응답:`, response.data);
        throw new Error("승인키 응답에 approval_key가 없습니다.");
      }
    } catch (error) {
      console.error(`[TokenManager] Approval Key 발급 실패:`, error.response?.data || error.message);
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
    console.log(`[TokenManager] 캐시 상태 - accessToken: ${accessToken}, approvalKey: ${approvalKey}`);
    return {
      accessToken,
      approvalKey,
      cacheSize: this.cache.keys().length,
    };
  }

  // 캐시 초기화 (테스트용)
  clearCache() {
    this.cache.flushAll();
    console.log("[TokenManager] 🗑️ 토큰 캐시 초기화 완료");
  }
}

// 싱글톤 인스턴스 생성
const tokenManager = new TokenManager();

module.exports = { tokenManager };

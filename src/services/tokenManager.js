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
        }
      );

      if (response.data.access_token) {
        token = response.data.access_token;
        // Access Token 만료 5분 전에 캐시 만료
        const expiresIn = response.data.expires_in - 300;
        this.cache.set(cacheKey, token, expiresIn);

        console.log("새로운 액세스 토큰 발급 완료");
        return token;
      } else {
        throw new Error("토큰 응답에 access_token이 없습니다.");
      }
    } catch (error) {
      console.error("토큰 발급 실패:", error.response?.data || error.message);
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
        }
      );

      if (response.data.approval_key) {
        approvalKey = response.data.approval_key;
        // 승인키도 만료 5분 전에 캐시 만료 (24시간 - 5분)
        this.cache.set(cacheKey, approvalKey, (24 * 60 * 60) - 300); // 23시간 55분

        console.log("새로운 승인키 발급 완료");
        return approvalKey;
      } else {
        throw new Error("승인키 응답에 approval_key가 없습니다.");
      }
    } catch (error) {
      console.error("승인키 발급 실패:", error.response?.data || error.message);
      throw new Error(
        `승인키 발급 실패: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  // 캐시 상태 확인
  getCacheStatus() {
    return {
      accessToken: this.cache.get("access_token") ? "valid" : "expired",
      approvalKey: this.cache.get("approval_key") ? "valid" : "expired",
      cacheSize: this.cache.keys().length,
    };
  }

  // 캐시 초기화 (테스트용)
  clearCache() {
    this.cache.flushAll();
    console.log("🗑️ 토큰 캐시 초기화 완료");
  }
}

// 싱글톤 인스턴스 생성
const tokenManager = new TokenManager();

module.exports = { tokenManager };

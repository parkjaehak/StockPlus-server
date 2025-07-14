const express = require("express");
const axios = require("axios");
const { tokenManager } = require("./tokenManager");
const config = require("../config");

const router = express.Router();
const baseUrl = "https://openapi.koreainvestment.com:9443";
const htsUserId = config.HTS_USER_ID;

// 한국투자증권 API 기본 설정
const apiConfig = {
  appkey: config.APP_KEY,
  appsecret: config.APP_SECRET,
  tr_id: "FHKST01010100", // 주식기본정보
};

// 공통 헤더 생성
function buildHeaders(token, trId) {
  return {
    "Content-Type": "application/json",
    authorization: `Bearer ${token}`,
    appkey: config.APP_KEY,
    appsecret: config.APP_SECRET,
    tr_id: trId,
    custtype: "P", // 개인 투자자
  };
}

// API 응답 처리
function handleApiResponse(response) {
  if (response.data.rt_cd !== "0") {
    throw new Error(
      `API 오류: ${response.data.msg1} (응답코드: ${response.data.msg_cd})`
    );
  }
  return response.data;
}

// 조건검색식 목록 조회
router.get("/search-conditions", async (req, res) => {
  try {
    const token = await tokenManager.getAccessToken();
    const params = new URLSearchParams({
      user_id: htsUserId,
    });

    const response = await axios.get(
      `${baseUrl}/uapi/domestic-stock/v1/quotations/psearch-title?${params}`,
      {
        headers: buildHeaders(token, "HHKST03900300"),
      }
    );

    const data = handleApiResponse(response);
    res.json(data);
  } catch (error) {
    console.error("조건검색식 목록 조회 실패:", error.message);
    res.status(500).json({
      error: "조건검색식 목록 조회 실패",
      message: error.message,
    });
  }
});

// 조건검색 결과 조회
router.get("/search-result", async (req, res) => {
  try {
    const { seq } = req.query;
    if (!seq) {
      return res.status(400).json({ error: "seq 파라미터가 필요합니다." });
    }

    const token = await tokenManager.getAccessToken();
    const params = new URLSearchParams({
      user_id: htsUserId,
      seq: seq,
    });

    const response = await axios.get(
      `${baseUrl}/uapi/domestic-stock/v1/quotations/psearch-result?${params}`,
      {
        headers: buildHeaders(token, "HHKST03900400"),
      }
    );

    const data = handleApiResponse(response);
    res.json(data);
  } catch (error) {
    console.error("조건검색 결과 조회 실패:", error.message);
    res.status(500).json({
      error: "조건검색 결과 조회 실패",
      message: error.message,
    });
  }
});

// 주식 시세 조회 (단일 종목)
router.get("/stock-price", async (req, res) => {
  try {
    const { stockCode } = req.query;
    if (!stockCode) {
      return res
        .status(400)
        .json({ error: "stockCode 파라미터가 필요합니다." });
    }

    const token = await tokenManager.getAccessToken();
    const params = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: stockCode,
    });

    const response = await axios.get(
      `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?${params}`,
      {
        headers: buildHeaders(token, "FHKST01010100"),
      }
    );

    const data = handleApiResponse(response);
    res.json(data);
  } catch (error) {
    console.error("주식 시세 조회 실패:", error.message);
    res.status(500).json({
      error: "주식 시세 조회 실패",
      message: error.message,
    });
  }
});

// 주식 시세 조회 (다중 종목)
router.post("/stock-prices", async (req, res) => {
  try {
    const { stockCodes } = req.body;
    if (!stockCodes || !Array.isArray(stockCodes)) {
      return res.status(400).json({ error: "stockCodes 배열이 필요합니다." });
    }

    const token = await tokenManager.getAccessToken();
    const results = [];

    for (const code of stockCodes) {
      try {
        const params = new URLSearchParams({
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: code,
        });

        const response = await axios.get(
          `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?${params}`,
          {
            headers: buildHeaders(token, "FHKST01010100"),
          }
        );

        const data = handleApiResponse(response);
        if (data.output) {
          results.push(data.output);
        }

        // API Rate limit 준수
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`종목 ${code} 조회 실패:`, error.message);
        results.push({ error: error.message, stockCode: code });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error("다중 주식 시세 조회 실패:", error.message);
    res.status(500).json({
      error: "다중 주식 시세 조회 실패",
      message: error.message,
    });
  }
});

// 실시간 접속키 조회
router.get("/approval-key", async (req, res) => {
  try {
    const approvalKey = await tokenManager.getApprovalKey();
    res.json({ approval_key: approvalKey });
  } catch (error) {
    console.error("승인키 조회 실패:", error.message);
    res.status(500).json({
      error: "승인키 조회 실패",
      message: error.message,
    });
  }
});

// 토큰 상태 확인
router.get("/token-status", async (req, res) => {
  try {
    const status = tokenManager.getCacheStatus();
    res.json({
      ...status,
      message: "토큰 상태 확인 완료",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("토큰 상태 확인 실패:", error.message);
    res.status(500).json({
      error: "토큰 상태 확인 실패",
      message: error.message,
    });
  }
});

// 수동 토큰 갱신 (관리자용)
router.post("/refresh-tokens", async (req, res) => {
  try {
    // 기존 캐시 초기화
    tokenManager.clearCache();
    
    // 새로운 토큰 발급
    const [accessToken, approvalKey] = await Promise.all([
      tokenManager.getAccessToken(),
      tokenManager.getApprovalKey()
    ]);
    
    res.json({
      message: "토큰 수동 갱신 완료",
      accessToken: accessToken ? "발급됨" : "실패",
      approvalKey: approvalKey ? "발급됨" : "실패",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("수동 토큰 갱신 실패:", error.message);
    res.status(500).json({
      error: "수동 토큰 갱신 실패",
      message: error.message,
    });
  }
});

module.exports = router;

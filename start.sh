#!/bin/bash

echo "StockPlus 서버를 시작합니다..."
echo

# Node.js가 설치되어 있는지 확인
if ! command -v node &> /dev/null; then
    echo "Node.js가 설치되어 있지 않습니다."
    echo "https://nodejs.org 에서 Node.js를 다운로드하여 설치해주세요."
    exit 1
fi

# .env 파일이 있는지 확인
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다."
    echo "env.example 파일을 .env로 복사하고 API 키를 설정해주세요."
    cp env.example .env
    echo
    echo ".env 파일을 편집하여 다음 정보를 입력하세요:"
    echo "- APP_KEY: 한국투자 Open API 앱 키"
    echo "- APP_SECRET: 한국투자 Open API 앱 시크릿"
    echo "- HTS_USER_ID: HTS 사용자 ID"
    echo
    exit 1
fi

# 의존성 설치 (node_modules가 없으면)
if [ ! -d "node_modules" ]; then
    echo "의존성을 설치합니다..."
    npm install
    if [ $? -ne 0 ]; then
        echo "의존성 설치에 실패했습니다."
        exit 1
    fi
fi

echo "서버를 시작합니다..."
echo "서버 URL: http://localhost:3000"
echo "헬스체크: http://localhost:3000/health"
echo
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo

npm start 
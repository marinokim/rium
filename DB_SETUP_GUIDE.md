# Rium SCM 데이터베이스 셋팅 가이드

Rium SCM을 Arontec과 완전히 분리하여 운영하기 위한 데이터베이스(DB) 생성 및 연결 방법입니다.

## 1. 새 데이터베이스 생성
가장 간편한 방법으로 **Supabase** (PostgreSQL 무료/유료 호스팅)를 추천합니다. AWS RDS 등 다른 Postgres를 사용하셔도 무방합니다.

1. [Supabase](https://supabase.com/) 회원가입 및 로그인.
2. **New Project** 클릭.
3. **Name**: `rium-scm` (원하는 이름)
4. **Database Password**: 강력한 비밀번호 설정 (꼭 기억해두세요!)
5. **Region**: Korea (Seoul) 선택 권장.
6. **Create new project** 클릭 및 생성 완료 대기.

## 2. 접속 주소(Connection String) 확보
1. Project Dashboard -> **Settings** (톱니바퀴) -> **Database**.
2. **Connection parameters** 섹션의 **Connection String** 탭 클릭.
3. **Node.js** 선택 -> **Mode: Transaction Pooler (권장)** 또는 Direct.
4. 주소 복사.
   - 예: `postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
5. 주소 안의 `[password]` 부분을 1번에서 설정한 **실제 비밀번호**로 변경합니다. (대괄호 없이)

## 3. 환경 변수 설정 (.env)
1. `rium-backend/backend/.env` 파일을 엽니다. (VS Code 등 에디터 사용)
2. `DATABASE_URL` 항목을 위에서 복사한 주소로 **교체**합니다.
   ```env
   # 예시
   DATABASE_URL="postgresql://postgres.abcd...:MyPassword123@..."
   PORT=5003
   ```
3. 저장합니다.

## 4. 테이블 생성 (초기화)
새 DB는 비어 있으므로 테이블을 만들어야 합니다.

1. `rium-backend/database/schema.sql` 파일을 엽니다.
2. 파일의 **모든 내용(SQL 쿼리)**을 복사합니다.
3. Supabase Dashboard -> **SQL Editor** (좌측 메뉴) 이동.
4. **New Query** 클릭 -> 복사한 내용을 붙여넣기 -> **Run** 클릭.
5. 우측 하단에 `Success` 메시지가 뜨면 완료입니다.

## 5. 서버 실행
터미널에서 서버를 재시작합니다.

```bash
cd rium-backend/backend
npm start
```

이제 "Connected to Database" 메시지가 뜨면 성공입니다!
프론트엔드(웹)는 이미 `localhost:5003`을 바라보도록 설정되어 있으므로, 바로 로그인 및 사용이 가능합니다.

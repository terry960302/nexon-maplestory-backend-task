# Nexon MapleStory Event Rewards MSA

Monorepo 형태의 마이크로서비스 프로젝트로, Gateway/API, Auth-Service, Event-Service, 공통 Contracts 라이브러리로 구성되어 있습니다.

## 목차

0. [고민한 부분](#고민한-부분)
1. [프로젝트 구조](#프로젝트-구조)
2. [사전 준비](#사전-준비)
3. [환경 변수 설정](#환경-변수-설정)
4. [로컬 개발 실행](#로컬-개발-실행)
5. [도커 컴포즈로 실행](#도커-컴포즈로-실행)
6. [테스트 실행](#테스트-실행)
7. [빌드 및 배포](#빌드-및-배포)

---

## 고민한 부분

### 1. Gateway의 역할

1. **인증·인가 처리**

   - 들어오는 요청에서 JWT 토큰을 꺼내 서명을 검증하고, 페이로드에서 사용자 정보(권한 등)를 조회합니다.
   - NestJS에서는 `@nestjs/passport`의 `JwtStrategy`와 `AuthGuard('jwt')` 조합을 사용하면 편리합니다.

2. **요청 제한(Rate Limiting)**

   - 한 IP나 한 사용자가 짧은 시간에 몰아치는 과도한 요청을 차단하여 서버 과부하를 방지합니다.
   - `@nestjs/throttler` 모듈을 전역 가드(GlobalGuard)로 설정하면 간단히 적용할 수 있습니다.

3. **마이크로서비스 호출 제어**
   - 내부 서비스 호출 중 일시적인 장애 발생 시 재시도를 수행하고, 응답 지연이 심할 때는 대체 로직(fallback)을 적용합니다.
   - `ClientProxy`의 `retryAttempts`·`retryDelay` 옵션을 설정하고, `@nestjs/terminus`를 활용한 헬스체크를 추가하면 복원력(resilience)을 강화할 수 있습니다.

**설계 이유**

- 인증·로깅·에러 처리 같은 공통 관심사는 Gateway에 집중시키고, 뒤 서비스는 비즈니스 로직에만 전념하도록 하기 위함입니다.
- 정책 변경 시 Guards나 Interceptors만 수정하면 되어 유지보수가 수월해집니다.

### 2. ‘조건 만족 → 보상 지급’ 모호성 해소

MapleStory 사례를 조사해봤고, 이를 기준으로 보면 보상 지급 패턴은 크게 세 가지입니다.

1. **개별 조건마다 즉시 지급**

   - 일일 출석 보상, 특정 퀘스트 클리어 시마다 해당 보상을 즉시 지급합니다.

2. **누적 달성도에 따른 단계별 지급**

   - PC방 접속 시간 누적, 미니게임 점수 달성 등 레벨(Threshold)마다 보상을 단계별로 지급합니다.

3. **모든 조건 달성 후 최종 보너스 지급**
   - 모든 서브 미션을 완료했을 때 추가 보너스 보상을 지급합니다.

### 3. 확장 가능한 이벤트 처리 구조

#### 3-1. `RewardRule` 추상 클래스 정의

```ts
// reward-rule.entity.ts
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';

export abstract class RewardRule {
  constructor(
    public readonly id: string,
    public readonly rewardItems: RewardItem[],
    protected readonly config: any,
  ) {}

  abstract apply(
    activity: Record<string, any>,
    state: Set<string>,
  ): RewardItem[];
}
```

#### 3-2. 룰별 구현체
PerConditionRule (조건 충족 시 1회 지급)

```ts
// per-condition.rule.ts
import { RewardRule } from '@event-microservice/domain/rewards/reward-rule.entity';
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';

export class PerConditionRule extends RewardRule {
  apply(activity: Record<string, any>, ruleIds: Set<string>): RewardItem[] {
    const { metric, perThreshold } = this.config;
    if (ruleIds.has(this.id) || activity[metric] < perThreshold) return [];
    ruleIds.add(this.id);
    return this.rewardItems;
  }
}
```

StageRule (누적 단계별 지급)

```ts
// stage.rule.ts
import { RewardRule } from "@event-microservice/domain/rewards/reward-rule.entity";
import { RewardItem } from "@event-microservice/infrastructure/schemas/reward-item.schema";

export class StageRule extends RewardRule {
  constructor(
    id: string,
    rewardItems: RewardItem[],
    config: any,
    private readonly allRules: RewardRule[]
  ) {
    super(id, rewardItems, config);
  }

  apply(activity: Record<string, any>, ruleIds: Set<string>): RewardItem[] {
    const { metric, stageThreshold } = this.config;
    if (ruleIds.has(this.id) || activity[metric] < stageThreshold) return [];

    // 모든 StageRule 중 이미 지급된 단계(threshold) 확인
    const stageRules = this.allRules.filter(
      (r) => r instanceof StageRule
    ) as StageRule[];
    const rewardedStages = stageRules
      .filter((r) => ruleIds.has(r.id))
      .map((r) => r.config.stageThreshold);

    if (!rewardedStages.includes(stageThreshold)) {
      ruleIds.add(this.id);
      return this.rewardItems;
    }
    return [];
  }
}
```

FinalRule (모든 선행 룰 완료 시 최종 지급)

```ts
// final.rule.ts
import { RewardRule } from "@event-microservice/domain/rewards/reward-rule.entity";
import { RewardItem } from "@event-microservice/infrastructure/schemas/reward-item.schema";

export class FinalRule extends RewardRule {
  apply(activity: Record<string, any>, state: Set<string>): RewardItem[] {
    const { prerequisiteRuleIds } = this.config;
    if (state.has(this.id)) return [];
    if (!prerequisiteRuleIds.every((rid) => state.has(rid))) return [];
    state.add(this.id);
    return this.rewardItems;
  }
}
```

#### 3-3. 보상 분배 엔진

> 엔진을 통해 각 조건마다 충족하면 보상을 줄수도 있고, 누적에 따라 단계적으로 줄수도 있고, 모든 조건을 만족하는 경우에만 줄수도 있습니다. 

```ts
// reward-engine.ts
import { RewardRule } from '@event-microservice/domain/rewards/reward-rule.entity';
import { RewardItem } from '@event-microservice/infrastructure/schemas/reward-item.schema';

export class RewardEngine {
  constructor(private readonly rules: RewardRule[]) {}

  run(
    activity: Record<string, any>,
    pastRuleIds: string[],
  ): { newAchievedRuleIds: string[]; rewards: RewardItem[] } {
    const state = new Set(pastRuleIds);
    const rewards: RewardItem[] = [];

    for (const rule of this.rules) {
      const items = rule.apply(activity, state);
      if (items.length) rewards.push(...items);
    }

    const newAchievedRuleIds = Array.from(state)
      .filter(id => !pastRuleIds.includes(id));

    return { newAchievedRuleIds, rewards };
  }
}

```

#### 3-4. 핵심 처리 흐름 예시

```ts
// 1) DB에서 룰 문서 로드
const docs = await rewardRuleRepo.find({ eventId });

// 2) 룰 팩토리로 인스턴스 생성
const rules = createRulesFromDocs(docs);

// 3) 엔진 실행
const engine = new RewardEngine(rules);
const { newAchievedRuleIds, rewards } = engine.run(userActivity, pastRuleIds);
```

> 이 구조를 적용하면, 새 룰이 추가되거나 지급 방식이 변경될 때마다 해당 룰 클래스만 구현·등록하면 되어 유지보수와 확장성이 크게 향상됩니다.

## 프로젝트 구조

```
├── env/
│ ├── dev/
│ │ ├── .env.common
│ │ ├── .env.gateway
│ │ ├── .env.auth
│ │ └── .env.event
│ └── test/
│ └── (테스트용 .env 파일)
├── apps/
│ ├── auth-microservice/
│ │ ├── src/
│ │ ├── test/
│ │ ├── Dockerfile
│ │ └── package.json
│ ├── event-microservice/
│ │ ├── src/
│ │ ├── test/
│ │ ├── Dockerfile
│ │ └── package.json
│ └── gateway/
│   ├── src/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
├── libs/
│     └── api-contracts/
│       ├── src/
│       └── package.json
├── docker-compose.yml
└── package.json
```

## 사전 준비

- Node.js v18 이상
- Yarn v1.22 또는 npm v8 이상
- Docker & Docker Compose

```bash
# 리포지토리 클론
git clone <repo-url>
cd nexon-maplestory-event-rewards-msa

# 프로젝트 최상단 의존성 설치 (워크스페이스 전부)
yarn install
# 또는 npm
npm install
```

## 환경 변수 설정
env/dev/ 폴더에 아래 파일들을 준비하세요.

.env.common

```env
NODE_ENV=dev

# JWT
JWT_SECRET_KEY=<시크릿키>
JWT_ACCESS_EXPIRES_IN_MINS=30  # 분
JWT_REFRESH_EXPIRES_IN_DAYS=30 # 일
```

.env.auth

```env
NODE_ENV=dev

# app
SERVICE_AUTH_PORT=8081
SERVICE_AUTH_HOST=127.0.0.1

# Database(MongoDB)
MONGODB_URI=mongodb+srv://<계정>:<비번>@<url>
MONGODB_DB_NAME=NEXON_MAPLESTORY_AUTH_DB
```

.env.event

```env
NODE_ENV=dev

# app
SERVICE_EVENT_PORT=8082
SERVICE_EVENT_HOST=127.0.0.1

# Database(MongoDB)
MONGODB_URI=mongodb+srv://<계정>:<비번>@<url>
MONGODB_DB_NAME=NEXON_MAPLESTORY_EVENT_DB
```

.env.gateway

```env
NODE_ENV=dev

# 게이트웨이
PORT=8080

# 인증/인가 서버
SERVICE_AUTH_HOST=127.0.0.1
SERVICE_AUTH_PORT=8081

# 이벤트 서버
SERVICE_EVENT_HOST=127.0.0.1
SERVICE_EVENT_PORT=8082

# Retry (RPC)
RETRY_ATTEMPS=5
RETRY_DELAY=1000 # ms

# Rate Limit (HTTP)
THROTTLE_TTL=60   # 주기(초)
THROTTLE_LIMIT=60 # 특정 주기동안 요청 횟수
```

## 로컬 개발 실행

> 각 서비스 폴더에서 개별 실행하거나, 동시에 실행하려면 터미널 3개를 열어 다음을 각각 실행하세요.

```bash
# Auth Service
cd apps/auth-microservice
yarn start:dev
```

```bash
# Event Service
cd apps/event-microservice
yarn start:dev
```

```bash
# Gateway
cd apps/gateway
yarn start:dev
```

## 도커 컴포즈로 실행
> 프로젝트 최상위에서 아래 명령으로 세 서비스와 MongoDB 를 함께 기동합니다.

```bash
docker-compose up --build
```
- Gateway : http://localhost:8080
- Auth : http://localhost:8081 (TCP)
- Event : http://localhost:8082 (TCP)


멈추려면:

```bash
docker-compose down
```

## 테스트 실행
> 유닛/통합 테스트

각 서비스별로 실행:
```bash
# Auth
cd apps/auth-microservice
yarn test

# Event
cd apps/event-microservice
yarn test

# Gateway
cd apps/gateway
yarn test
```

E2E 테스트
```bash
# Auth E2E
cd apps/auth-microservice
yarn test:e2e

# Event E2E
cd apps/event-microservice
yarn test:e2e

# Gateway E2E
cd apps/gateway
yarn test:e2e
```

## 빌드 및 배포
```bash
# 전체 워크스페이스 빌드
yarn build

# 개별 서비스 빌드
cd apps/auth-microservice && yarn build
cd apps/event-microservice && yarn build
cd apps/gateway && yarn build
```

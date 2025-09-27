# Bun ElysiaJS Cloudflare Workers 템플릿

Bun, ElysiaJS, Cloudflare Workers 조합으로 만든 프로덕션급 API 템플릿입니다. OpenAPI 문서 자동 생성과 타입 안전한 요청/응답 검증이 기본으로 들어있습니다.

## 왜 이 조합인가

- **타입 안전성**: Elysia 타입 시스템으로 컴파일 타임에 에러를 검출합니다
- **빠른 성능**: Elysia AOT 컴파일로 런타임 오버헤드가 없습니다
- **자동 문서화**: 스키마를 한 번만 정의하면 OpenAPI 스펙이 자동 생성됩니다

일반적인 Elysia는 [Cloudflare Workers에서 실행할 때 제한사항](https://elysiajs.com/integrations/cloudflare-worker.html#limitations)이 있습니다 - 특히 TypeGen(자동 타입 생성)이 Workers 환경에서 작동하지 않습니다. 이 템플릿은 빌드 시점에 OpenAPI 스펙을 생성하고 Cloudflare Workers의 [정적 에셋](https://developers.cloudflare.com/workers/static-assets/)으로 서빙하는 방식으로 이러한 문제들을 해결했습니다. 모든 문서(openapi.json, Swagger UI, Redoc, Scalar)가 정적 파일로 미리 생성되어 번들링되므로 빠른 전달과 AOT 컴파일 호환성을 보장합니다.

## 필요한 것들

- [Bun](https://bun.sh/)
- Cloudflare Workers 계정 (배포용)

## 바로 시작하기

```bash
# 의존성 설치
bun install

# OpenAPI 스펙 생성
bun run generate:openapi

# 개발 서버 실행
bun run dev
```

API는 `http://localhost:8787`에서 실행되고
문서는 `http://localhost:8787/docs`에서 확인할 수 있습니다

## 프로젝트 구조

```
src/
├── index.ts              # Cloudflare Workers 진입점 (AOT 컴파일)
├── app.ts                # 앱 팩토리
├── config/
│   └── openapi.ts        # OpenAPI 설정
└── routes/
    ├── base/
    │   ├── index.ts      # 라우트 통합
    │   ├── echo.ts       # 예시 엔드포인트
    │   └── schemas/      # 타입 정의
    │       ├── requests/
    │       ├── responses/
    │       └── headers/
    └── docs/             # 문서 라우트
```

## 설정

### OpenAPI 커스터마이징

`src/config/openapi.ts`에서 API 문서를 수정할 수 있습니다:

```typescript
export const getOpenAPIConfig = (): ElysiaSwaggerConfig => {
  return {
    documentation: {
      info: {
        title: 'API 이름',
        version: '1.0.0',
        description: 'API 설명'
      },
      servers: [
        { url: 'https://your-domain.workers.dev', description: '프로덕션' }
      ],
      tags: [
        { name: '태그명', description: '태그 설명' }
      ]
    },
    path: '/swagger',
    provider: 'scalar'
  };
};
```

### Cloudflare Workers 설정

`wrangler.toml`에서 프로젝트 정보를 수정하세요:

```toml
name = "프로젝트-이름"
main = "src/index.ts"
compatibility_date = "2025-06-01"
compatibility_flags = ["nodejs_compat"]
```

## 엔드포인트 만들기

타입을 한 번만 정의하면 검증과 문서가 자동으로 생성됩니다.

### 1. 스키마 정의

Elysia 타입 시스템으로 요청/응답 스키마를 작성합니다:

```typescript
// src/routes/example/schemas/requests/create_user.ts
import { t } from 'elysia';

export const CreateUserRequest = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: 'email' }),
  age: t.Optional(t.Number({ minimum: 0 }))
});
```

```typescript
// src/routes/example/schemas/responses/create_user.ts
import { t } from 'elysia';

export const CreateUserResponse = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  createdAt: t.String()
});
```

### 2. 엔드포인트 작성

스키마를 엔드포인트에 연결합니다:

```typescript
// src/routes/example/create_user.ts
import { Elysia } from 'elysia';
import { CreateUserRequest } from './schemas/requests/create_user';
import { CreateUserResponse } from './schemas/responses/create_user';

export const createUserRoute = new Elysia().post(
  '/users',
  ({ body }) => {
    // TypeScript가 body 타입을 알고 있습니다
    return {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString()
    };
  },
  {
    body: CreateUserRequest,
    response: CreateUserResponse,
    detail: {
      summary: '새 사용자 생성',
      description: '제공된 정보로 사용자 계정 생성',
      tags: ['Users']
    }
  }
);
```

### 3. 라우터 등록

라우트를 라우터에 추가합니다:

```typescript
// src/routes/example/index.ts
import { Elysia } from 'elysia';
import { createUserRoute } from './create_user';

export const exampleRouter = new Elysia()
  .use(createUserRoute);
```

`src/app.ts`에서 라우터를 등록합니다:

```typescript
import { exampleRouter } from './routes/example';

export const createApp = (config?: ConstructorParameters<typeof Elysia>[0]) => {
  return new Elysia(config)
    .use(baseRouter)
    .use(exampleRouter)  // 여기 추가
    .use(docsRoute);
};
```

### 4. OpenAPI 스펙 재생성

```bash
bun run generate:openapi
```

이제 엔드포인트는:
- 컴파일 타임에 타입 체크되고
- 런타임에 검증되며
- OpenAPI/Swagger로 문서화됩니다

## 동작 원리

주요 차이점은 두 가지입니다:

1. **AOT 컴파일** (`src/index.ts`):
```typescript
const app = createApp({
  adapter: CloudflareAdapter,
  aot: true  // Cloudflare용 Ahead-of-time 컴파일
});

export default app.compile();
```

2. **정적 문서 서빙** (`src/routes/docs/index.ts`):
```typescript
const getOpenAPISpec = async () => {
  const module = await import('./generated/openapi.json');
  return module.default;
};
```

OpenAPI 스펙과 모든 문서 인터페이스는 빌드 시점에 미리 생성되어 Cloudflare Workers의 [정적 에셋](https://developers.cloudflare.com/workers/static-assets/)으로 서빙됩니다. 이 방식으로 런타임 생성 오버헤드 없이 AOT 컴파일 성능과 완전한 API 문서를 모두 제공할 수 있습니다.

## 개발

```bash
# 타입 체크
bun run typecheck

# 테스트 실행
bun run test

# 코드 포맷팅
bun run format

# 린트
bun run lint

# OpenAPI 최신성 테스트
bun run test:openapi
```

최신성 테스트는 OpenAPI 스펙이 라우트와 동기화되어 있는지 확인합니다. 스펙 생성 후 라우트 파일이 수정되면 테스트가 실패합니다.

## 배포

```bash
# Cloudflare Workers에 배포
bun run deploy
```

이 명령어는:
1. 최신 OpenAPI 스펙 생성
2. 최신성 테스트 실행
3. Cloudflare Workers 배포

`wrangler.toml`에서 배포 환경을 설정할 수 있습니다:

```toml
[env.production]
name = "프로젝트-이름-production"
```

## 성능

- **콜드 스타트**: ~10ms (AOT 컴파일 덕분)
- **요청 처리**: 간단한 라우트는 1ms 이하
- **번들 크기**: 최소화됨 (Elysia가 가볍습니다)

Bun의 빠른 빌드, Elysia AOT, Cloudflare 엣지 네트워크를 결합하여 전 세계 어디서든 빠른 응답을 제공합니다.

## 라이선스

MIT
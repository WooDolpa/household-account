# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A household account (가계부) web application built with Spring Boot 4.0.6, Java 17, Thymeleaf for server-side rendering, and MariaDB for persistence.

## Commands

On Windows use `gradlew.bat`; on Unix use `./gradlew`.

```bash
# Build
gradlew build

# Run (local profile — requires MARIADB_URL, MARIADB_USERNAME, MARIADB_PASSWORD env vars)
gradlew bootRun

# Run with a specific profile (e.g. prod — requires src/main/resources/prod/application.yml)
gradlew bootRun -P profile=prod

# Clean build
gradlew clean build
```

## Architecture

Entry point: `household.account.web.Application`

**Profile / Resource Loading**
`build.gradle` adds `src/main/resources/${profile}` to the classpath sourceSets. The Gradle `profile` property defaults to `local`, so `src/main/resources/local/application.yml` is always included unless overridden with `-P profile=<name>`. Each profile directory must contain its own `application.yml`.

**DataSource**
`BeanConfig` manually declares the `DataSource` bean with `@ConfigurationProperties(prefix = "spring.datasource.hikari")`. Datasource properties must go under `spring.datasource.hikari.*`, not `spring.datasource.*`.

**JPA**
`JpaConfig` enables `@EnableJpaAuditing`. All entities extend `BaseEntity` which provides `createdDate` / `modifiedDate` via `@CreatedDate` / `@LastModifiedDate`. `ddl-auto` is `none` — schema changes must be applied manually.

**QueryDSL**
`QueryDSLConfig` exposes a `JPAQueryFactory` bean injected with `@PersistenceContext EntityManager`. Custom query logic goes in `*RepositoryImpl` (implements `*CustomRepository`). Spring Data JPA and QueryDSL share the same transaction-scoped `EntityManager` proxy, so dirty checking works across both within a `@Transactional` method.

**Thymeleaf Fragments**
Shared UI components live in `src/main/resources/templates/fragments/`. Include them with:
```html
<aside th:replace="~{fragments/sidebar :: sidebar}"></aside>
```

**Thymeleaf 3.1+ 제약**
`#request`, `#session`, `#servletContext`, `#response` 표현식 유틸 객체는 보안상 기본 비활성화됨. 템플릿에서 사용 시 `IllegalArgumentException` 런타임 에러 발생. 대신 JS에서 `window.location.pathname` 등으로 처리할 것.

**Error Handling**
Services throw `CustomException(ExceptionCode)`. `CustomExceptionHandler` (`@ControllerAdvice`) catches these and returns `ResponseEntity<String>` with `ApiResponseDto.makeResponse(e)` at the exception's `HttpStatus`. All API responses — success and error — use `{ code, message }` JSON shape (no `data` field unless explicitly added via `makeResponse(Object data)`).

**Enums**
- `DataStatus` — `Yes("Y")` / `No("N")`. Persisted as `"Y"`/`"N"` via `DataStatusConverter`. Default on new records is `DataStatus.Yes`.
- `OrderType` — `Auto("auto")` / `Manual("manual")`. Used only in service logic, not persisted.

## Package Structure

Base package: `household.account.web`

- `*.config` — `@Configuration` classes (datasource, JPA, QueryDSL)
- `*.controller.view` — Spring MVC view controllers (return template names)
- `*.controller.api` — REST API controllers (`@RestController`, return JSON via `ApiResponseDto`)
- `*.domain` — JPA entities; all extend `BaseEntity`
- `*.repository` — Spring Data `JpaRepository` + `*CustomRepository` interface + `*RepositoryImpl` (QueryDSL)
- `*.service` — business logic; class-level `@Transactional(readOnly = true)`, write methods override with `@Transactional`
- `*.dto` — request/response objects (inner static classes inside one `*Dto` file per domain)
- `*.enums` — domain enumerations
- `*.exception` — `CustomException`, `ExceptionCode`, `CustomExceptionHandler`

Static assets: `src/main/resources/static/css/` and `src/main/resources/static/js/`

## Routes

**View:**
- `GET /` — 홈 (`HomeController`)
- `GET /settings/category` — 카테고리 관리 (`SettingsController`)

**REST API — Implemented & Connected (`CategoryController`):**
- `POST /category/parent` — 대분류 등록 (body: `{ name, orderType, orderNum }`)
- `GET /category/parent/list` — 대분류 목록 조회 (응답: `{ code, message, data: [...] }`)
- `POST /category` — 소분류 등록 (body: `{ parentId, name, orderType, orderNum }`)
- `GET /category/list?parentId={parentId}` — 소분류 목록 조회 (응답: `{ code, message, data: [...] }`)

**REST API — Frontend calls exist, backend not yet implemented:**
- `PUT /api/categories/{id}` — 카테고리 수정
- `DELETE /api/categories/{id}` — 카테고리 삭제 (소분류 있으면 400)

**Not yet implemented:**
- `/account/income`, `/account/expense` — 수입/지출 입력
- `/stats/monthly`, `/stats/category` — 통계
- `/settings/account` — 계좌 관리

## Page Layout Pattern

Every page follows this structure:
```html
<header class="header">...</header>
<div class="layout">
    <aside th:replace="~{fragments/sidebar :: sidebar}"></aside>
    <main class="main">...</main>
</div>
```
Each page includes `style.css` + `sidebar.css` + a page-specific CSS file. The page-specific JS is loaded at the bottom of `<body>`.

**사이드바 토글 JS 필수 포함:** 사이드바를 사용하는 모든 페이지는 반드시 `sidebar.js`를 로드해야 한다. 누락 시 그룹 메뉴 토글이 동작하지 않는다.
```html
<script th:src="@{/js/sidebar.js}"></script>
<script th:src="@{/js/[page].js}"></script>
```

**sidebar.js 동작:**
- 그룹 제목 클릭 시 서브메뉴 열기/닫기 토글 (아코디언 방식)
- `window.location.pathname`으로 현재 URL 감지 → 일치하는 링크에 `--active` 클래스 추가
- 활성 서브메뉴 항목이 속한 그룹은 페이지 로드 시 자동으로 열림
- `sidebar.html`에는 활성 상태 마크업 없음 (Thymeleaf `#request` 제약으로 JS에서 전담)

## 카테고리 관리 페이지 (`/settings/category`)

**파일 구조**
- `templates/settings/category.html`
- `static/css/category.css`
- `static/js/category.js`

**주요 동작 방식**
- 대분류·소분류 목록은 서버사이드 렌더링 없이 **JS에서 API 호출로 렌더링** (SettingsController는 모델 데이터를 넘기지 않음)
- 대분류 전체 목록은 `allParents`, 소분류 전체 목록은 `allChildren` 변수에 캐싱
- 검색은 클라이언트 사이드 필터링 (`filterParents` / `filterChildren`) — 추가 API 호출 없음
- 대분류 클릭 시 소분류 패널 로드, 다른 대분류 선택 시 검색어·목록 초기화

**DTO 구조**
- `ParentCategoryRegDto`: `{ name, orderType, orderNum }`
- `ParentCategoryResDto`: `{ id, name, parentId, orderNum }`
- `CategoryRegDto`: `{ parentId, name, orderType, orderNum }`
- `CategoryResDto`: `{ id, name, parentId, orderNum }`

**미연동 API (백엔드 미구현)**
- `PUT /api/categories/{id}` — 수정 (`apiUpdate` 함수 존재)
- `DELETE /api/categories/{id}` — 삭제 (`apiDelete` 함수 존재)

## CSS Naming

BEM convention: `block__element--modifier` (e.g. `category-item__name`, `sidebar-menu__item--active`).

## 코드 규칙
- HTML 파일 안에 인라인 코드(style, script) 금지
- HTML, CSS, JS 파일 분리해서 작업

## 역할
- 시니어 풀스택 개발자이고 프론트엔드 부분은 수정가능, 백엔드는 직접 수정금지
- 백엔드 관련 내용이 나올 경우 나한테 가이드를 해줘

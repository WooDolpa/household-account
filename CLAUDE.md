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
- `ReceiptType` — `F("F")` 고정 / `O("O")` 일회성. Persisted as `"F"`/`"O"` via `ReceiptTypeConverter`.
- `PaymentType` — `CARD("C")` / `CASH("M")`. Persisted via `PaymentTypeConverter`. 키 미일치 시 기본값 CARD.
- `Installment` — `"001"` 일시불 ~ `"012"` 12개월 할부. Persisted via `InstallmentConverter`. 키 미일치 시 기본값 `"001"`.

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
- `GET /settings/receipt` — 사용내역 관리 (`SettingsController`)

**REST API — Implemented & Connected (`CategoryController`):**
- `POST /category/parent` — 대분류 등록 (body: `{ name, orderType, orderNum }`)
- `GET /category/parent/list` — 대분류 목록 조회 (응답: `{ code, message, data: [...] }`)
- `PUT /category/parent` — 대분류 수정 (body: `{ id, name, orderNum }`, 응답: `{ code, message }`)
- `DELETE /category/parent/{id}` — 대분류 삭제 (소분류 일괄 soft delete + 순번 재정렬)
- `POST /category` — 소분류 등록 (body: `{ parentId, name, orderType, orderNum }`)
- `GET /category/list?parentId={parentId}` — 소분류 목록 조회 (응답: `{ code, message, data: [...] }`)
- `PUT /category` — 소분류 수정 (body: `{ id, parentId, name, orderNum }`)
- `DELETE /category/{id}` — 소분류 삭제 (순번 재정렬)

**REST API — 사용내역 (`ReceiptController`):**
- `GET /receipt/list` — 목록 조회 (query: startDate, endDate, categoryId, name, page, size / 응답: `{ code, message, data: { content:[...], totalPages, totalElements, currentPage, pageSize } }`) **[백엔드 미구현 — 프론트 더미 데이터]**
- `POST /receipt` — 등록 **[구현 완료]** (body: `{ name, receiptType("F"/"O"), paymentType("C"/"M"), installment("001"~"012"), amount, usedDate(yyyyMMdd), categoryId }`)
- `PUT /receipt` — 수정 (body: `{ id, name, receiptType, paymentType, installment, amount, usedDate, categoryId }`) **[백엔드 미구현]**
- `DELETE /receipt/{id}` — 삭제 **[백엔드 미구현]**

**Not yet implemented:**
- `/account/income`, `/account/expense` — 수입/지출 입력
- `/stats/monthly`, `/stats/category` — 통계

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

## Toast 알림 시스템

**파일 구조**
- `static/css/toast.css` — 공통 토스트 스타일
- `static/js/toast.js` — 공통 토스트 유틸리티 (`showToast`)

**사용법**
```js
showToast('메시지', 'success'); // 또는 'error'
```

**동작 방식**
- 전역 함수 `showToast(message, type)` — 모든 페이지에서 재사용 가능
- 최초 호출 시 `#toast-container` div를 자동 생성해 `<body>`에 주입
- 우측 상단 고정 (`position: fixed; top: 24px; right: 24px`), `z-index: 9999`
- 1.5초 후 fade-out (0.25s transition), 300ms 후 DOM 제거
- 연한 배경색 + 좌측 4px 컬러 border (success: 초록, error: 빨강)
- 토스트를 사용하는 페이지는 반드시 `toast.css` + `toast.js`를 먼저 로드해야 한다
```html
<link rel="stylesheet" th:href="@{/css/toast.css}">
...
<script th:src="@{/js/toast.js}"></script>
<script th:src="@{/js/[page].js}"></script>
```

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
- 모달 모드: `'add-parent' | 'edit-parent' | 'add-child' | 'edit-child'`
- 모달 저장 버튼 텍스트: 등록 모드 → `저장`, 수정 모드 → `수정`
- 모달 닫기: 취소 버튼 또는 ESC 키만 가능 (오버레이 클릭 닫기 없음)
- API 성공·실패 시 `showToast()` 호출로 피드백
- 등록·수정 성공 시 `apiLoadParents()` / `apiLoadChildren()` 재호출로 목록 갱신

**DTO 구조**
- `ParentCategoryRegDto`: `{ name, orderType, orderNum }`
- `ParentCategoryUpdDto`: `{ id, name, orderNum }`
- `ParentCategoryResDto`: `{ id, name, parentId, orderNum }`
- `CategoryRegDto`: `{ parentId, name, orderType, orderNum }`
- `CategoryUpdDto`: `{ id, parentId, name, orderNum }`
- `CategoryResDto`: `{ id, name, parentId, orderNum }`

**category.js 주요 API 함수**
- `apiLoadParents()` / `apiLoadChildren(parentId)` — 목록 갱신
- `apiCreateParent(body)` / `apiCreate(body)` — 등록
- `apiUpdateParent(id, body)` — 대분류 수정 (`PUT /category/parent`)
- `apiUpdateChild(id, body)` — 소분류 수정 (`PUT /category`, `selectedParentId` 포함)
- `apiDeleteParent(id, item)` — 대분류 삭제 (`DELETE /category/parent/{id}`, 선택된 소분류 패널 초기화)
- `apiDelete(id, item)` — 소분류 삭제 (`DELETE /category/{id}`, 삭제 후 `apiLoadChildren` 재호출)

## 사용내역 관리 페이지 (`/settings/receipt`)

**파일 구조**
- `templates/settings/receipt.html`
- `static/css/receipt.css`
- `static/js/receipt.js`

**외부 라이브러리 (CDN)**
- Air Datepicker v3.6.0 — 날짜 선택 달력 라이브러리
- CSS: `https://cdn.jsdelivr.net/npm/air-datepicker@3.6.0/air-datepicker.css` → `<head>`에 로드
- JS 로드 순서 (air-datepicker는 반드시 sidebar.js 앞에):
```html
<script src="https://cdn.jsdelivr.net/npm/air-datepicker@3.6.0/air-datepicker.js"></script>
<script th:src="@{/js/sidebar.js}"></script>
<script th:src="@{/js/toast.js}"></script>
<script th:src="@{/js/receipt.js}"></script>
```
- CDN 로드 시 기본 locale이 마케도니아어로 고정되는 버그 → `receipt.js`에 `localeKo` 객체 직접 정의해 생성자에 전달
- 모달 위에 달력이 표시되려면 `.air-datepicker-global-container { z-index: 9999 }` CSS 오버라이드 필수 (`.modal-overlay`가 `z-index: 200`)
- `autoClose: true` — 날짜 선택 후 달력 자동 닫힘

**Receipt 엔티티 주요 필드**
- `id` — PK
- `name` — 사용명 (max 32)
- `receiptType` — 사용구분 (`ReceiptType.F` 고정 / `ReceiptType.O` 일회성)
- `paymentType` — 결제수단 (`PaymentType.CARD("C")` / `PaymentType.CASH("M")`)
- `installment` — 할부 (`Installment "001"` 일시불 ~ `"012"` 12개월)
- `amount` — 금액 (Integer)
- `usedDate` — 사용일 (yyyyMMdd 형식 String)
- `dataStatus` — soft delete 상태
- `category` — 소분류 Category (ManyToOne LAZY)

**주요 동작 방식**
- 목록은 JS에서 API 호출로 렌더링 (현재 더미 데이터로 UI 선구현, `GET /receipt/list` 백엔드 미구현)
- 테이블 레이아웃, 고정 높이 600px + 세로 스크롤, thead sticky
- 레이아웃 순서: 필터 패널 → 총계(`receiptSummary`) → 테이블 컨트롤 → 테이블 → 페이지네이션
- 필터 패널: 2행 레이아웃 (`.filter-divider`로 구분)
  - 1행: 기간 선택 (Air Datepicker 날짜 입력 2개) + 빠른 선택 버튼 (이번달/저번달/최근 3개월)
  - 2행: 카테고리(대분류→소분류 연동 select), 명칭 검색, 조회/초기화 버튼
- 날짜 입력: `type="text" readonly` — Air Datepicker가 값을 관리 (직접 타이핑 불가), 포맷 `yyyy.MM.dd`
- 시작일 선택 시 종료일의 `minDate`를 시작일로 제한 (`endPicker.update({minDate: date})`)
- 삭제 시 테이블 행 아래 인라인 확인 행(`.receipt-row--confirm`) 표시
- 모달 모드: `'add' | 'edit'`, 저장 버튼 텍스트: 등록 → `저장`, 수정 → `수정`
- 모달 닫기: 취소 버튼 또는 ESC 키만 가능
- 대분류 select: `SettingsController`가 `parentCategoryList` 모델로 서버사이드 렌더링 (`th:each`) — 필터·모달 모두 적용. API 호출 없음
- 소분류 select: `GET /category/list?parentId=` API 호출로 동적 로드
- 금액 입력: `type="text" inputmode="numeric"` — 입력 시 천단위 콤마 자동 포맷, 저장 시 콤마 제거 후 `Number()` 변환
- 모달 사용일: Air Datepicker (`modalDatePicker`), `selectDate(new Date(...))` / `clear()`로 제어
- 결제수단: 카드(`C`) / 현금(`M`) 라디오. 현금 선택 시 할부 그룹(`#modalInstallmentGroup`) 숨김, 전송 시 `installment: "001"` 고정
- 할부: `#modalInstallment` select, 일시불(`001`) ~ 12개월 할부(`012`)

**날짜 관련 JS 변수/함수**
- `startPicker` / `endPicker` / `modalDatePicker` — AirDatepicker 인스턴스 (전역)
- `localeKo` — 한국어 locale 객체 (CDN 버그 우회용, `receipt.js` 내 정의)
- `settingQuick` — 빠른 선택 버튼 클릭 시 `true`; `onSelect` 발화 시 `clearQuickActive()` 방지 플래그
- `initDatePickers()` — AirDatepicker 초기화 (`init()`에서 호출)
- `clearQuickActive()` — `.btn-quick--active` 클래스 전체 제거
- `setQuickDate(start, end, activeBtn)` — `selectDate()` / `update({minDate})` 로 날짜 범위 설정

**빠른 선택 버튼 (`data-quick` 값)**
- `this-month` — 이번달 1일 ~ 말일
- `last-month` — 저번달 1일 ~ 말일
- `last-3-months` — 3개월 전 1일 ~ 이번달 말일

**DTO 구조**
- 등록 body: `{ name, receiptType("F"/"O"), paymentType("C"/"M"), installment("001"~"012"), amount, usedDate(yyyyMMdd), categoryId }`
- 수정 body: `{ id, name, receiptType, paymentType, installment, amount, usedDate, categoryId }`
- 목록 query: `startDate, endDate, categoryId, name, page, size`
- 목록 응답: `{ code, message, data: { content:[...], totalPages, totalElements, currentPage, pageSize } }`
- content 항목: `{ id, name, receiptType, receiptTypeLabel, amount, usedDate, categoryId, categoryName, parentCategoryName }`

**receipt.js 주요 API 함수**
- `apiSearch()` — `GET /receipt/list` (현재 더미 데이터, 백엔드 구현 시 fetch로 교체)
- `apiCreate(body)` — `POST /receipt` **[연동 완료]**, 성공 시 토스트 → 모달 닫기 → `apiSearch()` 재호출
- `apiUpdate(id, body)` — `PUT /receipt` **[백엔드 미구현, stub]**
- `apiDelete(id, tr, confirmTr)` — `DELETE /receipt/{id}` **[백엔드 미구현, stub]**

## CSS Naming

BEM convention: `block__element--modifier` (e.g. `category-item__name`, `sidebar-menu__item--active`).

## 코드 규칙
- HTML 파일 안에 인라인 코드(style, script) 금지
- HTML, CSS, JS 파일 분리해서 작업

## 역할
- 시니어 풀스택 개발자이고 프론트엔드 부분은 수정가능, 백엔드는 직접 수정금지
- 백엔드 관련 내용이 나올 경우 나한테 가이드를 해줘

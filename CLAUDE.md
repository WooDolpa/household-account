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
Services throw `CustomException(ExceptionCode)`. `CustomExceptionHandler` (`@ControllerAdvice`) catches these and returns `ResponseEntity<String>` with `ApiResponseDto.makeResponse(e)` at the exception's `HttpStatus`. All API responses — success and error — use `{ code, message }` JSON shape (no `data` field unless explicitly added via `makeResponse(Object data)`, or paginated fields via `makeResponse(Object data, Integer totalPages, Integer totalElements, Integer currentPage, Integer pageSize)`).
동적 메시지가 필요한 경우(예: 엑셀 행별 검증 오류) `CustomException(ExceptionCode, String message)` 생성자로 메시지를 덮어쓸 수 있다.

**Enums**
- `DataStatus` — `Yes("Y")` / `No("N")`. Persisted as `"Y"`/`"N"` via `DataStatusConverter`. Default on new records is `DataStatus.Yes`.
- `OrderType` — `Auto("auto")` / `Manual("manual")`. Used only in service logic, not persisted.
- `ReceiptType` — `F("F")` 고정 / `O("O")` 일회성. Persisted as `"F"`/`"O"` via `ReceiptTypeConverter`.
- `PaymentType` — `CARD("C")` / `CASH("M")`. Persisted via `PaymentTypeConverter`. 키 미일치 시 기본값 CARD.
- `Installment` — `"001"` 일시불 ~ `"012"` 12개월 할부. Persisted via `InstallmentConverter`. 키 미일치 시 기본값 `"001"`. 키 조회 메서드는 `findByInstallment(key)` (구 `findByKey`에서 리네임됨).

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
- `*.utils` — `ExcelUtils` (`@Component`, 엑셀 파싱·행별 검증 → `RegDto` 리스트 변환)

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
- `GET /receipt/list` — 목록 조회 (query: startDate, endDate, parentCategoryId, categoryId, name, page, size) **[구현 완료, 프론트 연동 완료]** QueryDSL + Spring Data `Page`/`Pageable`(`PageableExecutionUtils`) 사용. `parentCategoryId`/`categoryId` 각각 독립적인 필터로 `where`에 적용됨(`matchParentCategoryIdEq`/`matchCategoryIdEq`). ⚠️ `name` 검색이 여전히 `eq`(완전일치)라 부분검색 안 됨
- `POST /receipt` — 등록 **[구현 완료, 프론트 연동 완료]** (body: `{ name, receiptType("F"/"O"), paymentType("C"/"M"), installment("001"~"012"), amount, usedDate(yyyyMMdd), parentCategoryId, categoryId }`) — `parentCategoryId`는 필수, `categoryId`(소분류)는 선택값(null 허용). `parentCategoryId` 미존재 시 `PARENT_CATEGORY_NOT_FOUND` 예외
- `POST /receipt/bulk` — 일괄 등록 **[구현 완료, 프론트 연동 완료]** (body: `{ receipts: [RegDto, ...] }`) — `ReceiptService.saveBulkReceipt`가 `@Transactional` for 루프로 `saveReceipt`를 호출하므로 **한 건이라도 실패 시 전체 롤백**(원자성 보장). 응답은 `{ code, message }`. ⚠️ `receipts`가 `null`이면 NPE → 500 (프론트는 항상 검증된 1건 이상을 전송하므로 정상 흐름에선 미발생)
- `POST /receipt/excel` — 엑셀 일괄 등록 **[구현 완료, 프론트 연동 완료]** (`multipart/form-data`, param: `file`) — `ExcelUtils.excelConverter`가 첫 번째 시트를 파싱(1행 헤더 skip, 빈 행 skip)해 `RegDto` 리스트로 변환 후 `saveBulkReceipt` 재사용(전체 성공/전체 롤백). 카테고리는 엑셀에 **이름**으로 입력 → 서비스가 활성 카테고리 전체를 사전 로드한 Map(`이름 -> Category`, 소분류는 `"부모id:이름"` 키)으로 매핑. 행별 검증 실패 시 저장하지 않고 `EXCEL_ROW_INVALID`로 행번호 포함 메시지 반환(`\n` 구분, 최대 5건 + `외 N건`). 예외: `EXCEL_FILE_INVALID`(.xlsx 아님) / `EXCEL_PARSE_FAIL`(손상·암호 파일) / `EXCEL_EMPTY`(데이터 없음)
- `PUT /receipt` — 수정 **[구현 완료, 프론트 연동 완료]** (body: `ReceiptDto.UpdateDto` — `{ id, name, receiptType, paymentType, installment, amount, usedDate, parentCategoryId, categoryId }`) — 미존재 시 `RECEIPT_NOT_FOUND`. 엔티티 `change*` 메서드는 null/빈값 가드로 부분 수정 안전. 단 `changeCategory`만 가드 없이 그대로 대입 → `categoryId: null` 전송 시 **소분류 해제** 가능
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
- `parentCategory` — 대분류 Category (ManyToOne LAZY, `parent_category_id` 컬럼, `nullable = false`, 필수)
- `category` — 소분류 Category (ManyToOne LAZY, `category_id` 컬럼, nullable 허용 — 선택값)

**주요 동작 방식**
- 목록은 JS에서 `GET /receipt/list` 실제 호출로 렌더링 (더미 데이터 제거 완료)
- 응답에 `categoryName`/`parentCategoryName`이 없으므로(id만 내려옴) `receipt.js`가 `buildCategoryNameMap()`으로 대분류별 `/category/list?parentId=` 응답을 순회해 `categoryId(소분류) -> {name, parentName}` 캐시(`categoryNameMap`)와 `parentCategoryId -> name` 캐시(`parentNameMap`)를 `init()` 시점에 만들어두고 테이블 렌더링(`makeRow`)에 사용. `receiptTypeLabel`도 응답에 없어 `RECEIPT_TYPE_LABEL` 맵으로 클라이언트에서 변환
- 소분류(`categoryId`)는 선택값이라 `null`일 수 있음 — `makeRow`는 이 경우 `parentNameMap`으로 대분류명만 표시하고 `categoryNameMap` 조회를 건너뜀
- `openEditModal`은 응답의 `parentCategoryId`를 그대로 써서 대분류 select를 채움 (예전처럼 모든 대분류를 순회하며 역추적하던 `setModalParent`는 제거됨)
- 등록 모달에서 소분류는 선택값 — 미선택 시 `categoryId: null`로 전송, 검증도 하지 않음(대분류만 필수)
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

**일괄 등록 모달 (`#bulkModalOverlay`, `.modal--wide`)**
- 페이지 헤더의 `일괄 등록` 버튼(`#bulkAddBtn`)으로 오픈 — 여러 건을 표 형태(`#bulkTbody`)로 입력해 한 번에 등록
- 저장은 `POST /receipt/bulk` **단일 호출** — 전체 행을 `{ receipts: [...] }`로 한 번에 전송, 백엔드 트랜잭션으로 전체 성공/전체 롤백 보장
- 표 컬럼: 사용일 · 사용명 · 금액 · 사용구분 · 대분류 · 소분류 · 결제수단 · 할부 · 삭제
- 사용일은 단일 등록 모달과 동일하게 **Air Datepicker** 사용 — 행마다 `readonly` text input에 인스턴스를 생성해 `tr._datePicker`에 보관, `readBulkRow`에서 `dateToYMD(picker.selectedDates[0])`로 `yyyyMMdd` 변환. 행 삭제(`removeBulkRow`)·모달 재오픈(`openBulkModal` → `destroyBulkDatePickers`) 시 `destroy()` 호출로 인스턴스 정리
- 대분류 select는 `modalParentEl.innerHTML`을 복제해 행마다 생성, 변경 시 기존 `loadChildCategories()` 재사용해 소분류 동적 로드
- 결제수단이 현금(`M`)이면 해당 행의 할부 select를 `001`로 고정하고 비활성화(단일 모달과 동일 규칙)
- 소분류는 단일 등록과 동일하게 선택값(비워도 `categoryId: null`로 전송)
- `+ 행 추가`(`#bulkAddRowBtn`)로 행 추가, 각 행 삭제 버튼(`.bulk-remove-btn`)은 마지막 1개 행에서는 비활성화(최소 1행 유지)
- 하단 `#bulkSummary`에 실시간 `총 N건 · 합계금액` 표시(`updateBulkSummary()`)
- `일괄 저장`(`#bulkSaveBtn`) 클릭 시 전체 행 검증(사용명/금액/사용일/대분류 필수) → 실패 행은 `.bulk-row--invalid` 클래스로 빨간 테두리 표시하고 **전송 자체를 중단**(토스트 안내)
- 검증 통과 시 `POST /receipt/bulk` 단일 호출 (전송 중 `bulkSaveBtn` 비활성화). 성공(`code === '200'`) 시 `"N건 등록되었습니다"` 토스트 → 모달 닫기 → `apiSearch()` 목록 갱신. 실패 시 서버 `message` 토스트 표시하고 **모달 유지**(전체 롤백이므로 입력값 수정 후 재시도 가능)
- ESC 키: 일괄 등록 모달이 열려 있으면 그 모달만 닫힘, 단일 등록/수정 모달보다 우선 처리

**엑셀 업로드 (`#excelUploadBtn`)**
- 페이지 헤더 버튼 순서: `엑셀 업로드` → `일괄 등록` → `+ 등록`
- 숨김 파일 input(`#excelFileInput`, `accept=".xlsx"`, `.hidden`) 트리거 방식 — 별도 모달 없이 브라우저 파일 다이얼로그 사용
- `handleExcelUpload()`: 확장자 검증 → `FormData`로 `POST /receipt/excel` 전송 (`Content-Type` 헤더 미지정 — 브라우저가 multipart boundary 자동 설정)
- 피드백은 **토스트가 아닌 `alert()` 사용** — 행별 오류 메시지가 `\n` 멀티라인이라 alert이 그대로 표시 가능 (이 페이지의 다른 기능은 토스트 유지)
- 전송 중 `excelUploadBtn` 비활성화(중복 업로드 방지 — 백엔드에 중복 방어 없음), 파일 선택 직후 `input.value = ''` 초기화(같은 파일 재선택 시에도 `change` 재발화 보장)
- 성공 시 alert → `apiSearch()` 목록 갱신. 실패 시 서버 `message` alert (한 건이라도 오류면 전체 미등록이므로 수정 후 같은 파일 재업로드 가능)
- 엑셀 양식: 1행 헤더 필수(무조건 skip), 2행부터 데이터. A~H 컬럼 순서 고정 — 사용일(날짜 서식 셀 또는 `2026.07.01`/`20260701` 등 텍스트) · 사용명(≤32자) · 금액(콤마 허용) · 사용구분(`고정`/`일회성`) · 대분류(등록된 이름 그대로) · 소분류(선택, 해당 대분류 소속) · 결제수단(`카드`/`현금`) · 할부(선택, `일시불`/`2개월`~`12개월`, 현금이면 무시하고 일시불)

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
- 등록 body (`ReceiptDto.RegDto`): `{ name, receiptType("F"/"O"), paymentType("C"/"M"), installment("001"~"012"), amount, usedDate(yyyyMMdd), parentCategoryId, categoryId }` — `parentCategoryId` 필수, `categoryId`(소분류)는 선택값(null 허용)
- 일괄 등록 body (`ReceiptDto.BulkRegDto`): `{ receipts: [RegDto, ...] }` — `RegDto` 리스트 래퍼
- 수정 body (`ReceiptDto.UpdateDto`): `{ id, name, receiptType, paymentType, installment, amount, usedDate, parentCategoryId, categoryId }` — `categoryId: null`이면 소분류 해제
- 목록 query: `startDate, endDate, parentCategoryId, categoryId, name, page, size` — `parentCategoryId`/`categoryId` 각각 독립 필터
- 목록 응답 (`ApiResponseDto.makeResponse(data, totalPages, totalElements, currentPage, pageSize)`): `{ code, message, data, totalPages, totalElements, currentPage, pageSize }` — `data`가 최상위 필드이며 `content` 래핑 없이 바로 배열
- `ReceiptDto.ResDto`: `{ id, name, receiptType, paymentType, installment, parentCategoryId, categoryId, amount, usedDate }` — `categoryId`는 소분류 미지정 시 `null`. `receiptTypeLabel`/`categoryName`/`parentCategoryName` 없음, 프론트에서 별도 매핑 필요 (아래 참고)

**receipt.js 주요 API 함수**
- `apiSearch()` — `GET /receipt/list` **[연동 완료]**, 필터값(`parentCategoryId`, `categoryId` 포함)으로 `URLSearchParams` 구성 후 fetch, 응답 실패 시 토스트
- `apiCreate(body)` — `POST /receipt` **[연동 완료]**, 성공 시 토스트 → 모달 닫기 → `apiSearch()` 재호출
- `apiUpdate(id, body)` — `PUT /receipt` **[연동 완료]**, `handleSave`가 만든 body에 `id`를 추가해 전송. 성공 시 토스트 → 모달 닫기 → `apiSearch()`, 실패 시 토스트 + 모달 유지
- `apiDelete(id, tr, confirmTr)` — `DELETE /receipt/{id}` **[백엔드 미구현, stub]**
- `handleExcelUpload()` — `POST /receipt/excel` **[연동 완료]**, `FormData` 전송, 피드백은 alert (위 엑셀 업로드 참고)
- `buildCategoryNameMap()` — 목록 렌더링용 `categoryId(소분류) -> {name, parentName}` 캐시(`categoryNameMap`) + `parentCategoryId -> name` 캐시(`parentNameMap`) 생성, `init()`에서 `apiSearch()` 실행 전 대기
- `openBulkModal()` / `closeBulkModal()` — 일괄 등록 모달 열기/닫기, 열 때 행 1개로 초기화
- `addBulkRow()` / `removeBulkRow(tr)` — 일괄 등록 행 추가/삭제 (최소 1행 유지)
- `readBulkRow(tr)` — 행 DOM에서 값 읽어 `RegDto` 형태 객체로 변환, 필수값 누락 시 `null` 반환 + `.bulk-row--invalid` 표시
- `handleBulkSave()` — 전체 행 검증 후 `POST /receipt/bulk` 단일 호출 **[연동 완료]**, 성공 시 토스트 → 모달 닫기 → `apiSearch()`, 실패 시 모달 유지 + 에러 토스트
- `updateBulkSummary()` — 행 개수·합계 금액 갱신 + 삭제 버튼 활성화 상태 갱신

## CSS Naming

BEM convention: `block__element--modifier` (e.g. `category-item__name`, `sidebar-menu__item--active`).

## 코드 규칙
- HTML 파일 안에 인라인 코드(style, script) 금지
- HTML, CSS, JS 파일 분리해서 작업

## 역할
- 시니어 풀스택 개발자이고 프론트엔드 부분은 수정가능, 백엔드는 직접 수정금지
- 프론트 작업요청이 들어오면 계획을 나한테 보여주고 내가 작업지시를 하면 그때 코드 작업 실행
- CLAUDE.md 파일 업데이트는 내가 업데이트 요청하면 그때 업데이트 처리
- 백엔드 관련 내용이 나올 경우 나한테 가이드를 해줘

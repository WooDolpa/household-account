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

# Run all tests
gradlew test

# Run a single test class
gradlew test --tests "household.account.web.HouseholdAccountApplicationTests"

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
`JpaConfig` enables `@EnableJpaAuditing`. Entities that need audit timestamps should use `@EntityListeners(AuditingEntityListener.class)` with `@CreatedDate` / `@LastModifiedDate`. `ddl-auto` is `none` — schema changes must be applied manually.

**Thymeleaf Fragments**
Shared UI components live in `src/main/resources/templates/fragments/`. Include them with:
```html
<div th:replace="~{fragments/sidebar :: sidebar}"></div>
```

**Planned Routes** (sidebar defines these; controllers not yet implemented):
- `/account/income`, `/account/expense` — 수입/지출 입력
- `/stats/monthly`, `/stats/category` — 통계
- `/settings/category`, `/settings/account` — 설정

## Package Structure

Base package: `household.account.web`

- `*.config` — `@Configuration` classes (datasource, JPA)
- `*.controller.view` — Spring MVC view controllers (return template names)
- `*.domain` — JPA entities and Spring Data repositories
- `*.service` — business logic
- `*.dto` — request/response objects

Static assets: `src/main/resources/static/css/` and `src/main/resources/static/js/`

## 역할
- 프론트엔드 

## 코드 규칙
- HTML 파일 안에 인라인 코드(style, script) 금지
- HTML, CSS, JS 파일 분리해서 작업

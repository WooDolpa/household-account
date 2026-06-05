# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A household account (가계부) web application built with Spring Boot 4.0.6, Java 17, Thymeleaf for server-side rendering, and MariaDB for persistence.

## Commands

On Windows use `gradlew.bat`; on Unix use `./gradlew`.

```bash
# Build
gradlew build

# Run (local profile requires env vars — see Database Setup)
gradlew bootRun --args='--spring.profiles.active=local'

# Run all tests
gradlew test

# Run a single test class
gradlew test --tests "household.account.web.HouseholdAccountApplicationTests"

# Clean build
gradlew clean build
```

## Tech Stack

- **Spring Boot 4.0.6** with Spring MVC
- **Spring Data JPA** + **HikariCP** — persistence layer
- **Thymeleaf** — server-side HTML templates (`classpath:/templates/*.html`, cache off)
- **MariaDB** — database (`mariadb-java-client` driver)
- **Lombok** — boilerplate reduction
- **Spring Boot DevTools** — hot reload in development

## Architecture

Entry point: `household.account.web.Application`

`BeanConfig` manually declares the `DataSource` bean using `@ConfigurationProperties(prefix = "spring.datasource.hikari")` instead of Spring Boot's auto-configured datasource. This means datasource properties must go under `spring.datasource.hikari.*`.

## Configuration / Profiles

Active profile config files live under `src/main/resources/{profile}/application.yml`.

The `local` profile (`src/main/resources/local/application.yml`) reads datasource credentials from environment variables:

| Variable | Purpose |
|---|---|
| `MARIADB_URL` | JDBC URL after `jdbc:mariadb://` (host:port/db) |
| `MARIADB_USERNAME` | DB username |
| `MARIADB_PASSWORD` | DB password |

`ddl-auto` is set to `none` — schema changes must be applied manually. Hibernate SQL logging (`DEBUG`) and bind-parameter logging (`TRACE`) are enabled in the local profile.

## Package Structure

Base package: `household.account.web`

Intended layering as the project grows:
- `*.config` — Spring `@Configuration` classes (datasource, beans)
- `*.domain` — JPA entities and Spring Data repository interfaces
- `*.service` — business logic
- `*.controller` — Spring MVC controllers
- `*.dto` — request/response objects

## 코드 규칙
- html 파일안에 인라인 코드(style, script) 금지
- html, css, js 파일 분리해서 작업
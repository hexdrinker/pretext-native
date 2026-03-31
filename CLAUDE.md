# React Native Pretext Port 프로젝트 플랜

## 1. 프로젝트 개요

### 프로젝트명

pretext-native

### 한 줄 소개

React Native 환경에서 텍스트의 줄바꿈, 높이, 레이아웃을 렌더링 전에 계산할 수 있도록 하는 텍스트 레이아웃 엔진.

### 배경

React Native에서는 텍스트의 실제 높이와 줄바꿈을 알기 위해 보통 렌더링 이후 `onLayout` 또는 `onTextLayout`에 의존한다.

이 방식은 다음과 같은 문제를 가진다:

- 초기 렌더링 점프
- virtualization 비효율
- hidden render 필요
- 성능 저하

이를 해결하기 위해, 렌더링 없이 텍스트 레이아웃을 계산하는 엔진이 필요하다.

---

## 2. 프로젝트 목표

### 핵심 목표

- 텍스트 렌더링 전에 line count / height 계산
- React Native에서 동작하는 API 제공
- iOS / Android 공통 지원
- FlatList 등에서 활용 가능한 수준 확보

### 비목표

- Rich text editor
- HTML / Markdown 렌더링
- 완전한 브라우저 수준 typography
- 모든 언어/폰트 완벽 지원

---

## 3. 문제 정의

### 현재 RN의 문제

1. 선측정 불가
2. 리스트 성능 저하
3. 레이아웃 점프
4. 커스텀 텍스트 흐름 어려움

### 해결 목표

> 텍스트를 실제 렌더링하지 않고도 줄바꿈과 높이를 계산할 수 있게 한다.

---

## 4. 사용자 시나리오

### A. 채팅 리스트

- 메시지 높이 사전 계산
- scroll jump 감소

### B. 카드 UI

- 줄 수 초과 여부 판단
- truncation 처리

### C. eBook

- 페이지 단위 텍스트 분할

### D. 커스텀 레이아웃

- 특정 영역 회피 텍스트 흐름

---

## 5. 성공 기준

### MVP

- line count 계산 가능
- height 계산 가능
- RN에서 실제 사용 가능
- example 앱 동작

### 품질

- 실용적 정확도 확보
- CJK/emoji 기본 대응
- 캐시 기반 성능 개선

---

## 6. 입력 / 출력 정의

### 입력

- text
- width
- fontSize
- fontFamily
- fontWeight
- lineHeight
- letterSpacing
- maxLines (optional)

### 출력

- height
- lineCount
- lines
- truncated 여부

---

## 7. 구현 구조

### 1. Core (플랫폼 독립)

- tokenizer
- line breaking
- layout 계산
- truncation
- cache

### 2. Measurement Adapter

- text width 측정
- native bridge or fallback

### 3. React Native Layer

- hook
- API wrapper
- 캐시 관리

---

## 8. 패키지 구조

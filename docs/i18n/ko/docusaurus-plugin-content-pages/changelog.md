# 변경 내역

이 프로젝트의 주요 변경 사항을 기록합니다.

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 형식을 따르며,
[Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 준수합니다.

## [0.0.1] - 2026-03-31

### 추가
- 토크나이저, 줄바꿈 엔진, 레이아웃 계산기를 포함한 코어 텍스트 레이아웃 엔진
- CoreText를 사용한 iOS 네이티브 모듈 (스레드 안전)
- Kotlin으로 작성된 StaticLayout 기반 Android 네이티브 모듈
- TurboModule 지원 (New Architecture) 및 Legacy Bridge 폴백
- JSI를 통한 동기 측정 (`measureTextSync`)
- 비동기 측정 (`measureText`) 및 배치 API (`measureTextBatch`)
- sync-first 전략의 `useTextLayout` React 훅
- 2단 LRU 캐시 (단어 레벨 + 레이아웃 레벨)
- CJK 및 이모지 토큰화 지원
- 폰트 메트릭 API (`getFontMetrics`)
- 캐시 관리 (`clearCache`, `getCacheStats`, `prewarmCache`)
- 네이티브 모듈 미사용 시 순수 JS 휴리스틱 폴백
- 11개 데모 화면의 예제 앱 (Basic, Bubbles, Chat List, Accordion, Show More, Masonry, Truncation, Fonts, Dynamic Width, Batch, Benchmark)
- 영어/한국어 README

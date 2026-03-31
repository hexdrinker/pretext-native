# 변경 내역

## [0.0.1] - 2026-03-31

최초 릴리스.

### 추가
- 텍스트 레이아웃 엔진 (토크나이저, 줄바꿈, 레이아웃 계산)
- iOS 네이티브 모듈 (CoreText) 및 Android 네이티브 모듈 (StaticLayout)
- TurboModule (New Architecture) + Legacy Bridge 지원
- `measureTextSync`, `measureText`, `measureTextBatch` API
- `useTextLayout` React 훅
- 95% 이상 히트율의 2단 LRU 캐시
- CJK 및 이모지 지원
- JS 휴리스틱 폴백
- 11개 데모 화면의 예제 앱

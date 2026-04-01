# 변경 내역

## [0.0.2] - 2026-04-01

### 추가
- `allowFontScaling` 옵션 — 시스템 접근성 글꼴 크기 설정(`PixelRatio.getFontScale()`)을 fontSize와 lineHeight에 자동 반영. React Native의 `<Text>` 컴포넌트와 동일한 측정 결과 제공. 기본값 `true`.
- `isFontAvailable(fontFamily)` API — 커스텀 폰트가 디바이스에 등록되어 있는지 사전 확인.
- 커스텀 폰트 미발견 시 경고 로그 출력 (iOS: `RCTLogWarn`, Android: `Log.w`). 기존에는 조용히 시스템 폰트로 대체.
- Obstacle Text Demo — 텍스트 리플로우 + 실시간 성능 지표 패널 (FPS, reflow 시간, 줄 수, 측정 횟수).
- Example 앱에 Pretendard Regular/Bold 폰트 추가 및 커스텀 폰트 비교 데모.

### 수정
- iOS 빈 텍스트 크래시 — CoreText의 `ctLines` 배열이 비어 있는데 index 0 접근하던 문제.
- React 이중 인스턴스 에러 — 모노레포 워크스페이스 간 React 버전 불일치를 `resolutions`로 해결.
- Metro 모듈 해석 — `react-native`/`source` 엔트리포인트 추가로 소스 직접 번들링.
- ObstacleTextDemo 공 속도 — 프레임율 의존에서 delta time 기반(120px/s)으로 변경.
- CI 안정화 — eslint 설정, turbo 필터, docs 워크스페이스 분리, Jest passWithNoTests.

### 변경
- README를 원본 [pretext](https://github.com/chenglou/pretext) 참조하여 간결하게 재작성.

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

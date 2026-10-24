# 0.5.5 — 로컬 터미널 시작 시 Keychain 요청 제거

원인: 프런트엔드의 앱 마운트 효과에서 로컬 셸 시작과 별개로 `unlock_vault`를 호출했다. 따라서 로컬만 사용해도 macOS Keychain 접근 창이 나타날 수 있었다.

수정: 시작 효과는 Vault 진행 이벤트 구독과 데모 요청 플래그 읽기만 한다. Vault는 사용자가 '키체인으로 열기' 또는 '잠금 해제' 버튼을 누를 때만 연다. `--demo-hosts`도 자동 인증을 유발하지 않고 다음 명시적 잠금 해제 시 처리한다. 로컬 셸은 기존처럼 앱 실행 시 즉시 시작한다. 호스트 데이터 암호화와 Keychain 저장 방식은 변경하지 않았다.

검증: 시작 효과와 로컬 시작 함수에 Vault 인증 호출이 재도입되지 않도록 AST 회귀 검사 2개 통과 (`logs/polar-0.5.5-auth-tests.log`). Rust의 Vault 기본 생성 및 start_local 경로에 Keychain 접근이 없음을 확인했다. TypeScript/Vite 및 macOS 앱 빌드 결과는 `logs/polar-0.5.5-build.log`에 기록했다. 사용 중인 세션을 종료하지 않았으며, 새 네이티브 프로세스에서 Keychain 창이 뜨지 않는지에 대한 UI 검증은 수행하지 않았다.

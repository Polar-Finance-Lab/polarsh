# Polar SSH 0.2.3 — 로컬 인증

## 구현

- macOS LocalAuthentication의 DeviceOwnerAuthentication 정책으로 Touch ID와 Mac 로그인 암호를 지원한다. 인증 전환과 입력은 운영체제가 관리하며 앱에 로그인 암호가 전달되지 않는다.
- 각 Vault 잠금 해제에 새 인증 컨텍스트를 사용한다. 인증 성공 전에는 Keychain에서 키를 읽지 않는다. 취소·실패·시간 초과 시 잠금을 유지한다.
- 중복 인증을 거절한다. 인증 중 잠금 요청이 들어오면 해당 인증 결과로 잠금을 해제하지 않는다.
- 화면에서 macOS 인증 대기와 Keychain 접근 대기를 구분한다.
- 기존 Vault와 Keychain 서비스/계정, 암호화 형식을 유지한다. 기존 ACL을 완화하지 않는다. 앱 수준 인증 게이트이며 SecAccessControl 기반 키 항목 마이그레이션은 아니다.
- 개발 빌드 교체 후 기존 Keychain 접근 승인이 별도로 필요할 수 있다. Touch ID 인증은 이 승인을 대체하지 않는다.
- `--demo-hosts` 실행 시 인증 후 기존 데이터를 보존하면서 데모 호스트 8개를 추가한다. 개발·스테이징·운영·홈랩 4개 그룹과 예약된 example.test 주소를 사용하며 자동 연결하지 않는다. 재실행 시 중복 추가하지 않는다. 인증 취소 후 다시 잠금 해제해도 추가 요청을 유지한다.

## 검증

- 실제 Mac capability 확인: Touch ID true, owner authentication true.
- Rust 테스트 13개 통과, 별도 Keychain 통합 테스트 1개는 일반 실행에서 제외. `logs/polar-local-auth-tests.log`.
- Clippy all-targets 경고 없음. `logs/polar-local-auth-clippy.log`.
- TypeScript/Vite 및 macOS debug 앱 빌드 통과, 49.01 MiB. `logs/polar-local-auth-build.log`.
- 0.2.3 앱을 `--demo-hosts`로 실행했고 실제 앱에서 macOS 인증 대기 상태를 확인했다. 인증 완료 및 데모 데이터 저장은 아직 확인하지 않았다.
- 실제 지문·로그인 암호 입력 후 인증 성공은 사용자 조작이 필요하며 자동 검증 결과에 포함하지 않는다.

## 참고

- https://developer.apple.com/documentation/localauthentication/lapolicy/deviceownerauthentication
- https://docs.rs/objc2-local-authentication/latest/objc2_local_authentication/

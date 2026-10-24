# 0.4.1 — 터미널 중심 탐색

2026-10-24

## 변경 사항

- 기본 탐색 패널을 58px 아이콘 레일로 축소. 패널을 펼치거나 접은 선택은 다음 실행에도 유지.
- `+` / `⌘T` / 사이드바 로컬 터미널은 기본 셸을 바로 생성. 폴더·셸 선택은 별도 `⌘N` 동선.
- `⌘K`: 열린 로컬/SSH 세션, 저장된 호스트, 새 세션 작업 통합 검색. 방향키 선택, Enter 실행, Escape 닫기.
- `⌘B`: 탐색 패널 전환. `⌘1`–`⌘9`: 열린 세션 순서대로 전환.
- macOS 앱 단축키는 Command에만 적용. 셸의 Ctrl+K, Ctrl+T, Ctrl+N 등을 가로채지 않음.
- 펼친 패널에 열린 세션과 시작 폴더/호스트 표시. 로컬 탭은 `zsh · 1`처럼 실행 중 일련번호로 구분.
- 로컬 세션에서 SFTP/Bastion 버튼 제거. 두 세션 이상일 때만 분할 선택, 저장 명령이 있을 때만 삽입 선택 표시.
- 상단·하단 표시줄 높이 축소. 로컬 경로는 **시작 폴더**이며 셸의 cd를 추적하지 않음.
- 기존 SSH/Vault/아이콘/앱 식별자와 저장 경로 유지. 브랜드명은 미확정.

## Touch ID와 반복 암호창 진단

확인한 코드: `local_auth::authenticate()`가 LAContext의 DeviceOwnerAuthentication을 먼저 수행하고, `vault::unlock_vault`가 별도로 기존 generic Keychain 항목을 읽는다. Touch ID는 앱 레벨 인증 단계이며 기존 Keychain ACL 승인을 대신하지 않는다.

확인한 환경: 현재 앱은 linker/ad-hoc 서명, TeamIdentifier 없음. `security find-identity -v -p codesigning` 결과 유효한 서명 신원 0개. 재빌드에 따른 실행 파일 변경으로 기존 Keychain 항목이 접근 확인을 다시 요구할 가능성이 있다. 사용자가 본 암호창 종류는 아직 확인되지 않아 이 원인으로 단정하지 않는다.

Apple 문서에 따르면 파일 기반 Keychain은 ACL을 사용하고, 생체 인증으로 항목 자체를 보호하려면 data protection Keychain이 필요하다. 해당 Keychain의 접근 그룹은 코드 서명 entitlement와 이를 허가하는 provisioning profile을 필요로 한다.

- 출처: https://developer.apple.com/documentation/technotes/tn3137-on-mac-keychains
- 해결 방향: 사용자의 정상적인 서명 신원/프로비저닝 준비 → userPresence로 보호한 키 항목과 인증 컨텍스트 연계 → 기존 키를 승인된 경로로 읽고 새 저장소에 기록 → 복호화 검증 → 이전 완료 표시. 기존 키 삭제는 별도 결정.
- **이번 버전에서 Touch ID 단독 해제를 구현하거나 검증한 것은 아니다.** ACL 완화, 임의 인증서 신뢰 추가, 잠금 후 키 유지로 우회하지 않았다. 기존 인증 코드는 유지했고 안내를 실제 동작에 맞춰 수정했다.
- SSH 서버 암호는 별도 인증 정보다. 현재 저장하지 않으므로 Vault를 Touch ID로 열어도 서버 연결 시 입력이 필요하다. 이것까지 없애려면 별도의 opt-in 자격증명 저장/보호 설계가 필요하다.

## 검증

- TypeScript + Vite 빌드 통과.
- 브라우저 UI: 빠른 전환 검색, 방향키 선택, Enter로 폴더·셸 설정 진입 확인.
- native bundle 빌드 및 화면 확인 결과는 `logs/polar-0.4.1-build.log`, `logs/polar-0.4.1-ui.md` 참조.
- 이번 수정은 UI만 변경했다. 기존 Rust PTY 테스트 결과는 0.4 릴리스의 23개 통과 기록이며, 이번 변경의 새 인증 검증 결과가 아니다.

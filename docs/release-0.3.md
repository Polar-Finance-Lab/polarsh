# Polar SSH 0.3 — 호스트 정리와 Bastion

2026-10-24. 기존 Vault, Keychain 식별자, Touch ID/로그인 암호 인증 및 SSH 비밀번호 비저장 정책을 유지한다.

## 이번 구현

| 기능 | 동작 |
|---|---|
| 다중 선택 삭제 | 카드 체크박스, 현재 검색/그룹 결과 전체 선택, 실제 대상 목록 확인 후 삭제. 미선택 호스트·저장 명령·열린 세션은 유지 |
| 일괄 그룹 이동 | 선택한 호스트를 기존/새 그룹으로 이동. 빈 이름은 그룹에서 제외. 검색·그룹 탐색 변경 시 선택 해제 |
| 호스트 복제 | 연결 창의 복제 아이콘으로 수정 가능한 새 항목 작성. 저장 전에는 Vault를 변경하지 않음 |
| Bastion 경유 SSH | 활성 세션의 `내부 호스트 연결`, 또는 연결 창의 `연결 경로`에서 선택. direct-tcpip 안에 별도 SSH 연결을 구성 |
| 다단 경유 | 경유해서 열린 세션도 다음 연결의 Bastion으로 사용 가능. 전체 세션 상한 16개 유지 |
| 경유 SFTP | 대상 SSH transport의 별도 채널 사용. 로컬에서 내부 주소로 직접 연결하지 않음 |
| 좌우 분할 | 열린 두 세션을 나란히 표시. 별도 입력·크기 변경, 분할 해제 시 세션/스크롤백 유지 |

## 사용 순서

1. Vault를 해제하고 Bastion 서버에 연결한다. 첫 접속은 서버 지문을 확인한다.
2. 터미널 도구 모음에서 **내부 호스트 연결**을 선택한다.
3. 내부 주소, 포트, 사용자 및 대상 서버 인증 정보를 입력한다. 내부 주소의 DNS 해석은 Bastion에서 수행된다.
4. 대상 서버 지문도 별도로 확인한 뒤 연결한다. 대상 자격증명은 검증된 내부 SSH 암호화 연결로 전송된다.
5. 대상 세션의 **파일** 탭은 같은 경유 경로로 SFTP를 사용한다.
6. **화면 분할**에서 함께 볼 세션을 선택한다. 상단 도구 모음의 파일/저장 명령 작업 대상은 현재 탭이며 오른쪽 분할 세션이 아니다.

저장된 호스트에는 `bastionHostId` 참조만 기록한다. 재실행 후에는 해당 Bastion을 먼저 연결해야 한다. 경유 세션이 없거나 종료되었으면 오류로 중단하고 직접 연결로 전환하지 않는다. 연결 경로를 명시적으로 변경하면 저장된 대상 지문을 초기화하고 다시 확인한다. Bastion이 삭제되더라도 참조를 자동 제거하여 직접 연결로 바꾸지 않는다.

Bastion 탭을 닫을 때 하위 탭이 있으면 함께 종료됨을 확인한다. 네트워크 단절·원격 종료도 하위 연결 종료로 전파한다. 인증·터널 생성 대기는 제한 시간과 취소를 적용한다. 대상 인증 실패는 부모 세션을 종료하지 않는다.

## 검증 결과

- Rust 17개 통과, 기존 별도 Keychain 테스트 1개 제외: `logs/polar-0.3-tests.log`.
- 신규 SSH 테스트: 다단 경유 및 PTY 왕복, 독립 채널, 대상 미확인/변경 지문 차단과 인증 미전송, 잘못된 대상 암호, forwarding 거부 시 직접 연결 금지, 부모 종료 시 자식 transport 종료.
- 실제 로컬 루프백의 Bastion/대상 두 fixture로 SSH 인증·PTY echo·별도 SFTP 채널·OpenSSH sftp-server 파일 읽기·mkdir/rmdir 통과: `logs/polar-0.3-bastion-sftp.log`.
- 재현: `cargo build --manifest-path app/src-tauri/Cargo.toml --examples` 후 프로젝트 Node로 `scripts/qa/bastion-smoke.mjs` 실행. 테스트 프로세스는 완료 후 종료하며 사용자 SSH 설정·키를 읽지 않는다.
- Clippy all-targets `-D warnings` 통과: `logs/polar-0.3-clippy.log`.
- TypeScript/Vite 및 macOS 0.3.0 debug 앱 빌드 통과, 번들 49.27 MiB: `logs/polar-0.3-build.log`.
- 브라우저 UI: 호스트 작성→복제→2개 일괄 그룹 이동→삭제 취소→선택한 1개만 삭제→필터 변경 시 선택 초기화 확인. 실제 사용자 Vault에서 삭제 테스트하지 않음.
- 실제 TerminalPane/xterm 컴포넌트의 분할·해제·복원 시 표시/스크롤백 유지 확인. `app/qa-split.html`은 개발용 시각 fixture이며 production build entry에 포함하지 않는다. 스크린샷: `docs/assets/polar-0.3-split-qa.jpg`.
- 위 브라우저 시각 검증은 macOS WKWebView에서 실제 운영 서버까지 연결한 전체 E2E 검증과 구분한다. 사용자 서버·자격증명으로 테스트하지 않았다.
- 업데이트 직전 기존 앱에서 데모 호스트 8개, 그룹 4개, 즐겨찾기 3개, 저장 명령 1개 및 연결 세션 0개를 확인했다.

## 남은 범위

- 경유 체인 전체 자동 접속/자격증명 재입력 흐름, SSH Agent, 로컬/원격 Port Forwarding, 자동 재연결.
- 3개 이상 패널·드래그 분할 비율, 가져오기/내보내기, 로그 검색, Workspace, Broadcast.
- SFTP 폴더 재귀 전송·이어받기, 키 생성, 암호화 동기화, AI, 협업.
- 운영 SSH/OpenSSH Bastion 서버, VPN·sleep/wake, 장시간 부하, macOS IME/접근성 전체 E2E와 서명·공증.

## 근거

설치는 기존 고정 버전 russh 0.64.1을 유지했다. 로컬 Cargo의 공식 배포 소스 `client::Handle::channel_open_direct_tcpip`, `client::connect_stream`, `Channel::into_stream` API를 확인하고 사용했다. [RFC 4254 §7.2](https://www.rfc-editor.org/rfc/rfc4254#section-7.2)의 direct-tcpip 채널 위에서 대상 SSH를 별도로 검증한다.

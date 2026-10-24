# Harbor SSH 0.2 — Polar Night

2026-10-24. 북극곰을 모티프로 UI를 다시 설계하고 로컬 생산성·저장·파일 전송 기능을 추가했다. 이전 0.1 문서의 평문 저장/기능 미구현 설명은 이 문서의 현황으로 대체한다.

## 디자인과 사용 흐름

[디자인 시스템](design-system.md): 자체 제작 북극곰 SVG, Snow/Glacier 탐색 화면, Midnight 터미널, Polar blue 주요 작업. 앱 아이콘도 변경했다.

왼쪽 영역은 모든 호스트·즐겨찾기·저장 명령·그룹·Vault 상태로 구성했다. 검색을 작업 영역으로 옮기고 이름/주소/사용자/그룹/태그를 검색한다. 카드에서 연결·편집·즐겨찾기를 구분하고 기존의 큰 홍보 문구를 제거했다. 검색 포커스는 컨테이너에 표시한다. Cmd+K 검색, Cmd+N 호스트 추가, 모달 Escape/focus trap을 적용했다.

[화면 검증 이미지](../logs/polar-design-preview.png)는 브라우저 미리보기에서 만든 synthetic 예시 호스트다. 사용자의 실제 서버나 연결 상태가 아니다.

## 추가한 기능

| 기능 | 현재 동작 |
|---|---|
| 암호화 로컬 Vault | SQLite의 workspace payload를 XChaCha20-Poly1305로 암호화. 24-byte 무작위 nonce와 고정 버전 AAD, 32-byte 키 |
| macOS Keychain | 앱 전용 service `dev.harbor.ssh.vault.v1`, account `local-master-key`. 다른 앱의 항목에 접근하지 않음 |
| 잠금/해제 | 시작 시 잠금. 잠글 때 세션을 종료하고 화면의 호스트·명령·입력 비밀번호를 비움. OS Keychain 접근으로 해제 |
| 기존 호스트 이전 | 기존 `harbor.hosts.v1`을 읽고 암호화 저장이 성공한 다음 해당 항목 제거. 원래 WebView 파일/백업의 포렌식 삭제는 아님 |
| 호스트 정리 | 즐겨찾기, 단일 그룹, 여러 태그, 검색, 저장·편집·삭제, 인증 방식/개인 키 경로 저장 |
| SFTP 탐색 | 기존 SSH 연결의 별도 채널에서 경로 탐색, 상위 이동, 숨김 파일, 수정 시각/크기, 폴더 생성 |
| 파일 전송 | native 파일 선택, 다중 파일 업로드(선택 순서), 다운로드, 진행률, 취소. 서버와 직접 통신 |
| 전송 보호 | 기존 파일 덮어쓰기 거부. 업로드 exclusive create/0600 요청, 다운로드 0600 임시 파일 후 no-clobber publish. 실패/취소 시 부분 파일 정리 시도 및 실패 보고 |
| 전송 유지 | 터미널/파일 및 세션 탭 전환 중 유지. 해당 세션 종료·Vault 잠금 시 취소 |
| 저장 명령 | Vault에 저장·편집·삭제. 대상/명령 미리보기 확인 후 터미널에 넣음. 여러 줄은 붙여넣기 시 실행될 수 있음을 표시 |
| 오류 안내 | timeout에 대상 주소·포트와 VPN/주소 확인 안내, 종료 탭에서 다시 연결 |

비밀번호와 키 암호는 저장하지 않는다. Keychain master key는 프런트엔드에 반환하지 않는다. 잠금은 별도 앱 비밀번호나 생체 인증을 강제하는 기능은 아니다. 앱 전용 데이터 경로의 `vault-v1.sqlite`에 암호문을 보관한다.

## 검증

- [Rust 테스트](../logs/polar-rust-tests.log): 12 passed. 기존 SSH 테스트 7개와 암호화·SQLite·SFTP 테스트 5개. Keychain 테스트 1개는 별도 명시 실행한다.
- [실제 Keychain 테스트](../logs/polar-keychain-test.log): 1 passed. 임의의 테스트 service에서 키 저장/읽기/삭제, production Vault 키에는 접근하지 않음.
- [SSH+SFTP 통합 smoke](../logs/polar-integration-smoke.log): loopback SSH 인증·PTY echo, 두 번째 채널의 SFTP negotiation, 실제 macOS OpenSSH sftp-server로 파일 읽기와 mkdir/rmdir 성공.
- SFTP 전송 테스트: 한글/emoji를 포함한 파일의 upload/download byte 일치, 양방향 기존 파일 보존, 취소 시 부분 업로드 제거, 디렉터리 조작. 임시 테스트 디렉터리만 사용.
- [Clippy](../logs/polar-clippy.log): 전체 target 경고 오류 처리 통과. [프런트엔드 빌드](../logs/polar-frontend-build.log): TypeScript/Vite 통과.
- [macOS 최종 빌드](../logs/polar-desktop-build.log): Harbor SSH.app 0.2.0, arm64 debug, 48.74 MiB. Info.plist 버전까지 확인했다. [검증 요약 JSON](../logs/polar-validation.json).
- 브라우저 UI: 호스트 추가·그룹·태그·즐겨찾기·검색 결과 없음·그룹 필터·저장 명령 생성 검증. 미리보기의 데이터는 메모리에만 둔다.
- 격리된 `Harbor QA` macOS 앱: 실행, 새 화면, Vault 잠금 해제 확인. 후속 UI 클릭 도구가 `native pipe closed before response`로 반복 실패하여 전체 native 연결/파일 선택 흐름 자동 검증은 완료하지 못했다. 기존 사용 중인 Harbor SSH 프로세스는 종료하지 않았다.

## 남아 있는 범위

- 화면 분할, SSH Agent/MFA, Jump Host, Port Forwarding, 자동 재연결, import/export.
- SFTP 재귀 폴더 전송, 이름 변경/삭제, 덮어쓰기/재개, 심볼릭 링크 다운로드. 현재 기존 파일은 새 이름으로 전송해야 한다. 연결이 끊기거나 앱이 강제 종료되면 부분 파일이 남을 수 있다.
- 자동 잠금·키 회전·백업/복구, DB migration 정책 강화, 여러 앱 인스턴스의 동시 저장 충돌 제어. 현재 프로세스 내부 저장은 직렬화한다.
- 로그·Workspace 복원·Broadcast, E2EE sync, AI, 팀 협업.
- native 전체 E2E, 한글 IME/tmux/vim, 장시간 부하/절전 복원, 성능 비교, 서명·공증. 현재 debug 개발 빌드다.

라이브러리 근거: [russh-sftp API](https://docs.rs/russh-sftp/3.0.1/russh_sftp/client/struct.SftpSession.html), [macOS Keychain API](https://docs.rs/security-framework/3.7.0/security_framework/passwords/index.html). 사용 버전은 lockfile에 고정했다.

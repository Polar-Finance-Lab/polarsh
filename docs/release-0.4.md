# Polar Terminal 0.4 — 로컬 + SSH

2026-10-24. Polar SSH를 Polar Terminal로 확장했다. 북극곰/터미널 아이콘을 재사용하며 내부 식별자 `dev.harbor.ssh`, Vault DB 경로, Keychain 서비스/계정은 유지한다.

## 구현

- macOS 앱 실행 시 기본 로컬 로그인 셸을 한 탭에 연다. Vault 인증이 필요 없다.
- 새 터미널에서 로컬 / SSH를 선택한다. 로컬은 시스템 기본 셸, zsh, bash와 시작 폴더를 선택한다. 폴더 선택 대화상자 및 절대 경로·`~`·`~/…`를 지원한다.
- `⌘T`: 기본 로컬 셸 추가. `⌘N`: 새 터미널 선택 창.
- LOCAL / SSH 탭 표시 및 로컬 작업 시작 경로 표시. 로컬·원격 혼합 좌우 분할을 지원한다.
- 저장된 호스트와 명령은 기존 Touch ID / Mac 로그인 암호 Vault 인증 후 사용한다. Vault 잠금은 원격 세션·파일 전송을 종료하지만 로컬 세션을 유지한다.
- 로컬 세션에는 SFTP 및 Bastion 경유 대상으로 선택하는 기능을 비활성화한다. 터미널에 직접 입력하는 `ssh` 등 일반 셸 명령은 사용할 수 있다.
- 셸 종료 후 탭에는 종료 상태를 표시하고 같은 시작 경로·셸로 새 세션을 열 수 있다.

## 구현 구조

`portable-pty 0.9.0`(MIT, WezTerm 프로젝트)의 macOS PTY를 사용한다. 실제 셸을 인자 배열로 실행하며 문자열 명령을 조합하지 않는다. OS 계정 정보에서 홈과 기본 로그인 셸을 읽어 개발 실행기의 작업 경로를 기본값으로 사용하지 않는다. 셸은 `/etc/shells` 등록 절대 경로만 허용한다.

로그인·대화형 셸(`-l -i`)로 사용자 시작 설정을 적용한다. TERM=xterm-256color, COLORTERM=truecolor, TERM_PROGRAM=PolarTerminal을 제공하며 환경과 PATH는 상속하고 로그인 설정으로 보완한다. LANG/PATH가 비어 있을 때만 기본값을 제공한다.

SSH와 로컬은 세션 상한 16개, 입력 큐, 출력 ACK, 리사이즈·취소 IPC를 공유한다. 로컬 PTY는 전용 blocking worker 하나에서 nonblocking descriptor를 읽고 쓴다. 최대 8개 출력 청크 이후 ACK를 기다려 출력을 제한하고 입력 대기 버퍼도 제한한다. 출력이 멈춰 있어도 취소 요청을 처리한다.

종료 시 전면 프로세스 그룹에 SIGHUP을 보내고 셸을 종료·회수하며 PTY를 닫는다. 정상 앱 종료는 세션 취소와 정리 시간을 확보한다. `nohup`/daemon처럼 의도적으로 터미널에서 분리한 프로세스까지 강제 추적·종료하는 기능은 아니다. 강제 종료·전원 중단까지 동일한 정리를 보장하지 않는다.

## 검증

- Rust 테스트 23개 통과, 별도 Keychain 통합 테스트 1개 제외: `logs/polar-0.4-tests.log`.
- 신규 실제 PTY 테스트: TTY 여부, 한글·이모지 및 공백 포함 시작 경로, stty 크기 변경, Ctrl-C와 셸 생존, 셸/전면 작업 종료·회수, 잘못된 셸/폴더 거절, 독립 세션과 종료 코드, 출력 ACK 정체 중 취소.
- 테스트는 임시 디렉터리 및 `/bin/zsh -f -i`를 사용하여 사용자 zshrc를 실행하지 않는다. 정상 앱은 사용자의 로그인 설정을 사용한다.
- 셸 종료 코드 테스트에서는 실제 터미널처럼 PTY 출력을 계속 읽으면서 종료를 기다린다. 읽지 않고 wait만 하면 TTY 출력 배출을 기다리는 셸이 종료하지 않을 수 있다.
- 기존 SSH·Bastion·Vault·SFTP 테스트도 동일 실행에서 통과했다.
- 브라우저에서 시작 화면, 새 로컬/SSH 선택, 시작 폴더 및 셸 선택 UI와 기존 SSH 입력 폼을 확인했다. 브라우저 미리보기는 로컬 프로세스를 실행하지 않는다.
- macOS 실제 `Polar Terminal.app`을 실행했다. Vault 잠김, LOCAL zsh 탭, 로컬 1 / SSH 0, `/Users/polar` 시작 경로와 실제 zsh 프롬프트를 접근성 트리와 스크린샷으로 확인했다. SFTP/Bastion/저장 명령 버튼은 해당 상태에서 비활성화되어 있었다.
- 네이티브 키 입력 자동 테스트는 앱 상태 변경 감지로 도구가 중단했다. 실제 UI 키 입력 왕복 성공으로 기록하지 않는다. PTY 입력·출력·Ctrl-C는 위 자동 테스트에서 검증했다.
- TypeScript/Vite 및 macOS 개발 앱 빌드 통과, 번들 50.20 MiB: `logs/polar-0.4-build.log`.

## 남은 범위

- 로컬 현재 디렉터리 자동 추적(지금은 시작 경로 표시), 세션 프로필 저장·복원, 탭 이름 편집, 셸 통합, 테마/단축키 설정.
- macOS 한글 IME, vim/tmux 전체 사용 흐름, 장시간 대량 출력, 다양한 사용자 로그인 설정과 PATH 상호운용 검증.
- SSH Agent, 포트 포워딩, 자동 재연결, import/export, 로그/검색, Broadcast 및 동기화·협업은 기존 후속 범위다.

## 참고

- portable-pty 공식 API: https://docs.rs/portable-pty/0.9.0/portable_pty/
- 빌드 앱: `app/src-tauri/target/debug/bundle/macos/Polar Terminal.app`

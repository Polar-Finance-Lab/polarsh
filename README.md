# Polarsh 1.0.0

macOS용 로컬·SSH 통합 터미널. Tauri 2, React/TypeScript, Rust, xterm.js로 구현했습니다.

[앱 다운로드](https://github.com/Polar-Finance-Lab/polarsh/releases/tag/v1.0.0) · [버전별 변경 이력](CHANGELOG.md) · [스크린샷 사용 가이드](docs/user-guide.md)

실행 앱은 릴리스의 `Polarsh-1.0.0-macos-arm64.zip`을 사용하세요. Apple Silicon용이며, 저장소 접근 권한이 있는 GitHub 계정으로 다운로드할 수 있습니다.

## 기능

- 로컬 셸과 SSH 세션, 탭, 드래그 분할·이동·크기 조절
- SSH 비밀번호·개인 키·Agent 인증, 서버 키 지문 확인, Bastion 경유 연결
- 호스트·그룹·태그·즐겨찾기·검색, 선택 삭제·그룹 이동
- SFTP 파일 탐색·업로드·다운로드·전송 취소
- 저장 명령과 터미널 명령 선택, 빠른 전환
- macOS Keychain으로 보호하는 로컬 암호화 저장소
- Snow, Frost, Paper, Obsidian, Graphite, Midnight, Forest, Plum, Arctic 테마

앱을 다시 실행하면 새 로컬 터미널 하나로 시작합니다. 이전 세션·출력·탭 배치를 복원하지 않습니다. 호스트·저장 명령·테마 설정은 유지됩니다.

## 개발 환경

macOS, Xcode Command Line Tools, Node.js 24 이상, npm, Rust/Cargo 1.90 이상이 필요합니다. 현재 네이티브 구현은 macOS 전용입니다.

```sh
xcode-select --install
node --version
cargo --version

git clone https://github.com/Polar-Finance-Lab/polarsh.git
cd polarsh
npm ci --prefix app
./scripts/app-dev
```

REA나 Termius 설치는 앱 실행·빌드에 필요하지 않습니다. 브라우저 미리보기는 `npm run dev --prefix app`으로 실행할 수 있지만 실제 로컬 셸·SSH·Keychain은 네이티브 앱에서만 동작합니다.

## 빌드

```sh
# 배포용 최적화 빌드
./scripts/app-build

# 개발 빌드
./scripts/app-build --debug
```

결과물은 `app/src-tauri/target/release/bundle/macos/Polarsh.app`이며, `--debug` 사용 시 `release` 대신 `debug` 디렉터리에 생성됩니다. Apple Developer ID 서명과 공증은 포함하지 않습니다. v1.0.0 릴리스에는 소스와 ad-hoc 서명된 Apple Silicon용 앱 ZIP을 함께 제공합니다.

## 검증

```sh
node --test scripts/qa/*.test.mjs
cargo test --manifest-path app/src-tauri/Cargo.toml
```

기본 Rust 테스트는 격리된 로컬 PTY·루프백 SSH/SFTP를 사용합니다. 실제 Keychain 임시 항목 테스트와 장시간 장애·부하 테스트는 기본 실행에서 제외됩니다. Keychain 테스트는 임시 항목을 생성하므로 별도로 실행합니다.

```sh
cargo test --manifest-path app/src-tauri/Cargo.toml \
  noninteractive_migration_preserves_key -- --ignored
```

`app/qa-*.html`은 개발 서버용 화면 검증 fixture이며 배포 앱 진입점에 포함되지 않습니다.

## 저장과 인증

호스트와 저장 명령은 SQLite에 XChaCha20-Poly1305 암호문으로 보관하며 마스터 키는 macOS Keychain에 저장합니다. SSH 비밀번호와 개인 키 암호는 저장하지 않습니다. 로컬 터미널을 열 때에는 Vault 잠금 해제를 요청하지 않습니다.

키체인 서비스는 `dev.polarsh.vault.v1`, 표시 이름은 `Polarsh — 호스트와 저장 명령`입니다. 이전 개발 버전의 키와 승인창 설명을 이전하는 코드가 포함됩니다. 기존 데이터 위치를 보존하기 위해 앱의 내부 bundle identifier는 `dev.harbor.ssh`를 유지합니다.

## 소스 구성

| 경로 | 내용 |
| --- | --- |
| `app/src/` | React UI, 탭·분할·테마, 터미널·SFTP 화면 |
| `app/src-tauri/src/` | Rust SSH/SFTP, 로컬 PTY, Vault·Keychain |
| `app/src-tauri/examples/` | 격리된 연결 검증용 서버·클라이언트 |
| `scripts/qa/` | 회귀 테스트 및 추가 smoke 테스트 |
| `scripts/app-*` | 개발·빌드 실행 스크립트 |
| `docs/` | 설계, 분석, 개발 이력 |

`docs/`의 초기 기능 목록과 로드맵에는 아직 구현하지 않은 계획도 포함됩니다. 동기화·협업·AI 추천 등은 이번 릴리스 기능이 아닙니다. 원격 네트워크 전환, 장시간 사용, 다양한 한글 IME 조합에 대한 추가 검증이 필요합니다.

로컬 개발 도구, 실행 로그, 사용자 데이터, 키·인증서, 의존성 디렉터리와 빌드 산출물은 저장소에 포함하지 않습니다.

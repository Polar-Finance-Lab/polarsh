# Polarsh 브랜치와 릴리스 관리

## 역할

- `main`: 다음 배포를 위한 통합 코드. 기능 브랜치를 검토·검증한 뒤 합칩니다.
- `release/1.0`: 기존 v1.0.0의 유지보수 기준. 이번 1.1 기능을 섞지 않습니다.
- `release/1.1`: 1.1.x 배포 코드. 이번 v1.1.0과 동일한 커밋에서 시작합니다.
- `feature/<내용>`: 기능 작업, `fix/<내용>`: 수정 작업. 완료 후 main에 병합합니다.
- `v1.1.0`: 배포한 코드의 고정 태그. 앞으로 배포한 태그와 파일을 덮어쓰지 않습니다.

버전별 브랜치는 minor 계열마다 하나만 만듭니다. 1.1.1은 release/1.1에서 수정하고 v1.1.1 태그를 붙입니다.
수정은 main에도 반영하고, 옛 버전에 필요한 경우만 해당 release 브랜치에 cherry-pick합니다.
1.2 기능은 main에서 진행하고 안정화 시 release/1.2를 분기합니다.

## 배포 순서

1. main 또는 해당 release 브랜치에서 작업하고 테스트합니다.
2. package.json·package-lock.json, Cargo.toml·Cargo.lock, tauri.conf.json의 버전을 일치시킵니다.
3. CHANGELOG와 해당 버전 설명을 작성합니다.
4. `npm --prefix app test`, 프런트엔드 빌드, Rust 테스트와 macOS 앱 빌드를 검증합니다.
5. 검증한 커밋을 release 브랜치에 반영하고 annotated tag를 생성합니다.
6. 앱 ZIP과 SHA-256 체크섬을 GitHub Release에 올립니다.
7. 원격 브랜치·태그·다운로드 파일의 체크섬을 확인합니다.

브랜치 보호 규칙이나 필수 PR 승인은 이번 작업에서 변경하지 않습니다.

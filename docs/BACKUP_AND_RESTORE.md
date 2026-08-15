# 암호화 백업과 복구

운영 API는 매일 오전 4시 15분(한국 시간)에 PostgreSQL custom-format 덤프를 만들고 AES-256-CBC/PBKDF2로 암호화한 뒤 coders.kr 오브젝트 저장소에 업로드합니다. `latest` 파일과 14개 순환 슬롯을 사용해 저장 공간을 제한합니다.

필수 비밀값 `BACKUP_ENCRYPTION_KEY`는 32자 이상의 무작위 문자열로 coders.kr 환경변수에 저장하고 저장소에는 커밋하지 않습니다. 이 값을 잃으면 백업을 복구할 수 없으므로 비밀번호 관리자에도 별도 보관합니다.

복구는 격리된 새 PostgreSQL에서 먼저 검증합니다.

```bash
export BACKUP_URL="https://morningnews.coders.kr/__storage/database/latest.dump.enc"
export BACKUP_ENCRYPTION_KEY="..."
export DATABASE_URL="postgresql://user:password@host:5432/database"
export CONFIRM_RESTORE=YES
./scripts/restore-backup.sh
```

복구 후 Flyway 검증, 에디션 수, 활성 구독 수, `/actuator/health`를 확인한 뒤에만 트래픽을 전환합니다. 운영 DB에 바로 복원하지 않습니다.

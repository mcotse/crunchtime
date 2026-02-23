.PHONY: deploy stop build seed-prod update-emails

deploy: stop build
	./scripts/start-prod.sh

build:
	npm run build

seed-prod:
	DB_PATH=crunchtime.db tsx server/seed-prod.ts

update-emails:
	sqlite3 crunchtime.db "\
		UPDATE members SET email='huangxue@meta.com'          WHERE id='m3'; \
		UPDATE members SET email='ultimatedbz@gmail.com'      WHERE id='m4'; \
		UPDATE members SET email='jonathan.tan.13@gmail.com'  WHERE id='m5'; \
		UPDATE members SET email='msongvo@gmail.com'          WHERE id='m7'; \
		UPDATE members SET email='mike.luo1122@gmail.com'     WHERE id='m8'; \
		UPDATE members SET email='sandyfeng32@gmail.com'      WHERE id='m9'; \
		UPDATE members SET email='simon.xmfan@gmail.com'      WHERE id='m10'; \
		UPDATE members SET email='lyna1223liu@gmail.com'      WHERE id='m11'; \
	"
	@echo "Done. Member emails updated."

stop:
	@pkill -f "dist/server/index.js" || true
	@pkill -f "cloudflared tunnel.*crunchtime" || true

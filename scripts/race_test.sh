#!/bin/bash
# race_test.sh — проверка гонки при "Взять в работу"
# Ожидание: один запрос 200, другой 409 или 400

set -e
# По умолчанию: frontend proxy (Docker dev). Для прямого backend: BASE_URL=http://localhost:8000
BASE="${BASE_URL:-http://localhost:5173/api}"
TMPDIR="${TMPDIR:-/tmp}"

echo "=== Race test: take in work ==="
echo "Base URL: $BASE"
echo ""

# 1. Создаём заявку
echo "1. Creating request..."
RESP=$(curl -s -X POST "$BASE/requests" -H "Content-Type: application/json" \
  -d '{"clientName":"RaceTest","clientPhone":"+7","problemText":"Race test"}')
REQ_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   Request ID: $REQ_ID"

# 2. Получаем токены master1 и master2
echo "2. Getting tokens..."
TOKEN1=$(curl -s -X POST "$BASE/auth/token" -d "username=master1&password=dev123" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
TOKEN2=$(curl -s -X POST "$BASE/auth/token" -d "username=master2&password=dev123" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "   Tokens obtained"

# 3. Параллельные запросы на взятие заявки
echo "3. Sending parallel PATCH requests..."
(
  CODE1=$(curl -s -o "$TMPDIR/race_resp1.json" -w "%{http_code}" -X PATCH "$BASE/requests/$REQ_ID/take" -H "Authorization: Bearer $TOKEN1")
  echo "$CODE1" > "$TMPDIR/race_code1.txt"
) &
(
  CODE2=$(curl -s -o "$TMPDIR/race_resp2.json" -w "%{http_code}" -X PATCH "$BASE/requests/$REQ_ID/take" -H "Authorization: Bearer $TOKEN2")
  echo "$CODE2" > "$TMPDIR/race_code2.txt"
) &
wait

CODE1=$(cat "$TMPDIR/race_code1.txt")
CODE2=$(cat "$TMPDIR/race_code2.txt")

# 4. Результат
echo ""
echo "4. Results:"
echo "   Response 1: $CODE1"
echo "   Response 2: $CODE2"

# Успех: один 200, второй 409 (атомарный отказ) или 400 (уже в работе)
if { [ "$CODE1" = "200" ] && { [ "$CODE2" = "409" ] || [ "$CODE2" = "400" ]; }; } || \
   { [ "$CODE2" = "200" ] && { [ "$CODE1" = "409" ] || [ "$CODE1" = "400" ]; }; }; then
  OTHER=$([ "$CODE1" = "200" ] && echo "$CODE2" || echo "$CODE1")
  echo ""
  echo "   PASS: One 200, one $OTHER (race handled correctly)"
  exit 0
else
  echo ""
  echo "   FAIL: Expected one 200 and one 409/400, got $CODE1 and $CODE2"
  exit 1
fi

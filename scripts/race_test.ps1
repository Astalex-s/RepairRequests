# race_test.ps1 — проверка гонки при "Взять в работу"
# Ожидание: один запрос 200, другой 409

$ErrorActionPreference = "Stop"
# По умолчанию: frontend proxy (Docker dev). Для прямого backend: BASE_URL=http://localhost:8000
$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:5173/api" }

Write-Host "=== Race test: take in work ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host ""

# 1. Создаём заявку
Write-Host "1. Creating request..."
$createBody = '{"clientName":"RaceTest","clientPhone":"+7","problemText":"Race test"}'
$createResp = Invoke-RestMethod -Uri "$BaseUrl/requests" -Method Post -Body $createBody -ContentType "application/json"
$reqId = $createResp.id
Write-Host "   Request ID: $reqId"

# 2. Получаем токены master1 и master2
Write-Host "2. Getting tokens..."
$authBody = "username=master1&password=dev123"
$token1Resp = Invoke-RestMethod -Uri "$BaseUrl/auth/token" -Method Post -Body $authBody -ContentType "application/x-www-form-urlencoded"
$authBody2 = "username=master2&password=dev123"
$token2Resp = Invoke-RestMethod -Uri "$BaseUrl/auth/token" -Method Post -Body $authBody2 -ContentType "application/x-www-form-urlencoded"
$token1 = $token1Resp.accessToken
$token2 = $token2Resp.accessToken
Write-Host "   Tokens obtained"

# 3. Параллельные запросы на взятие заявки
Write-Host "3. Sending parallel PATCH requests..."
$takeUrl = "$BaseUrl/requests/$reqId/take"

$scriptBlock = {
    param([string]$Url, [string]$Token)
    $headers = @{ Authorization = "Bearer $Token" }
    try {
        $r = Invoke-WebRequest -Uri $Url -Method Patch -Headers $headers -UseBasicParsing
        return [int]$r.StatusCode
    } catch {
        return [int]$_.Exception.Response.StatusCode.value__
    }
}

$job1 = Start-Job -ScriptBlock $scriptBlock -ArgumentList $takeUrl, $token1
$job2 = Start-Job -ScriptBlock $scriptBlock -ArgumentList $takeUrl, $token2

$code1 = [int](Receive-Job -Job $job1 -Wait)
$code2 = [int](Receive-Job -Job $job2 -Wait)
Remove-Job -Job $job1, $job2 -Force

# 4. Результат
Write-Host ""
Write-Host "4. Results:"
Write-Host "   Response 1: $code1"
Write-Host "   Response 2: $code2"

# Успех: один 200, второй 409 (атомарный отказ) или 400 (уже в работе)
$success = ($code1 -eq 200 -and $code2 -in @(409, 400)) -or ($code2 -eq 200 -and $code1 -in @(409, 400))
if ($success) {
    Write-Host ""
    Write-Host "   PASS: One 200, one $($code1+$code2-200) (race handled correctly)" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "   FAIL: Expected one 200 and one 409/400, got $code1 and $code2" -ForegroundColor Red
    exit 1
}

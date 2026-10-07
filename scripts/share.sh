#!/usr/bin/env bash
# Mở app qua Expo Go cho người ở mạng khác: Cloudflare Tunnel thay cho `expo start --tunnel`
# (ngrok đi kèm Expo hay lỗi "failed to start tunnel").
# QR Expo tự in ra (exp://...:443) không dùng được, dùng QR exps:// script in ở cuối.
set -euo pipefail

PORT="${PORT:-8081}"
QR_PNG="${QR_PNG:-$HOME/Desktop/expo-qr.png}"

if ! command -v cloudflared >/dev/null; then
  echo "Thiếu cloudflared, cài bằng: brew install cloudflared" >&2
  exit 1
fi

log="$(mktemp -t cloudflared)"
cloudflared tunnel --no-autoupdate --url "http://localhost:$PORT" >"$log" 2>&1 &
tunnel_pid=$!
trap 'kill $tunnel_pid 2>/dev/null; rm -f "$log"' EXIT

echo "Đang mở tunnel..."
url=""
for _ in $(seq 1 60); do
  url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$log" | head -1 || true)"
  [ -n "$url" ] && break
  sleep 1
done
if [ -z "$url" ]; then
  cat "$log" >&2
  echo "Không lấy được URL tunnel" >&2
  exit 1
fi
app_url="exps://${url#https://}"

# In QR sau khi Metro chạy để nó nằm dưới QR của Expo
(
  until curl -sf -o /dev/null "http://localhost:$PORT/status"; do sleep 1; done
  npx -y qrcode@1.5.4 -o "$QR_PNG" -w 600 "$app_url" >/dev/null
  echo
  echo "════ Gửi QR này cho người khác (bỏ qua QR exp:// của Expo ở trên) ════"
  npx -y qrcode@1.5.4 --small "$app_url"
  echo "Link Expo Go: $app_url"
  echo "Ảnh QR: $QR_PNG"
  echo
) &

EXPO_PACKAGER_PROXY_URL="$url" npx expo start --port "$PORT" "$@"

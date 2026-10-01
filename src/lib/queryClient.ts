import NetInfo from '@react-native-community/netinfo'
import { onlineManager, QueryClient } from '@tanstack/react-query'

// Cùng mặc định với web (src/app/providers.tsx)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

// TanStack Query mặc định nghe sự kiện online/offline của trình duyệt; trên điện thoại lấy từ NetInfo
// để query tự tạm dừng khi mất mạng và chạy lại khi có mạng
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
)

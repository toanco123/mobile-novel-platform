import { Platform, Share } from 'react-native'
import { SITE_URL } from './siteUrl'

/**
 * Mở bảng chia sẻ của máy với link trang web (`path` lấy từ `paths`): người nhận chưa cài app vẫn mở
 * được, đã cài thì link mở thẳng vào app (Universal Links / App Links). Android chỉ gửi `message` nên
 * gộp link vào đó; iOS gửi riêng `url` để app nhận (Tin nhắn, Zalo...) hiện ô xem trước.
 */
export async function shareLink({ title, path }: { title: string; path: string }) {
  const url = `${SITE_URL}${path}`
  try {
    await Share.share(
      Platform.OS === 'ios' ? { message: title, url } : { title, message: `${title}\n${url}` },
      { dialogTitle: title, subject: title },
    )
  } catch {
    // Bảng chia sẻ không mở được (hiếm): không có gì để báo thêm, người dùng bấm lại được
  }
}

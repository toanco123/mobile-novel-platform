import { router, useNavigation } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { SITE_URL } from '@/lib/siteUrl'

/**
 * Đóng cả cửa sổ đăng nhập (nhóm (auth) mở dạng modal), dù đang ở màn nào bên trong. Thay cho
 * `?next=` của web: đóng modal là về đúng chỗ người dùng đang đứng. Mở từ deep link khi app chưa
 * chạy thì bên dưới là thanh tab (unstable_settings.anchor), vẫn đóng được.
 */
export function useCloseAuth() {
  const navigation = useNavigation()
  return () => {
    const root = navigation.getParent()
    if (root?.canGoBack()) root.goBack()
    else router.replace('/')
  }
}

/** Mở một trang của web (điều khoản, quyền riêng tư, Sáng tác...) trong trình duyệt của app */
export const openWebPage = (path: string) => WebBrowser.openBrowserAsync(`${SITE_URL}${path}`)

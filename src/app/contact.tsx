import { ScrollView, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { ContactForm } from '@/features/feedback/components/ContactForm'

/** Liên hệ (ContactPage của web); trang Điều khoản vẫn mở trên web từ tab Tài khoản */
export default function ContactScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 pt-2 pb-12"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <View>
        <Text role="heading" className="font-heading-bold text-4xl leading-tight">
          Liên hệ
        </Text>
        <Text className="mt-1 text-muted-foreground">
          Góp ý, báo lỗi, bản quyền hay hợp tác: gửi cho chúng tôi ở đây.
        </Text>
        <Text className="mt-4 text-sm leading-relaxed text-foreground/90">
          Gặp lỗi trong một chương cụ thể? Dùng nút{' '}
          <Text className="font-sans-semibold text-sm">Báo lỗi chương</Text> ở cuối chương để tác
          giả nhận được ngay. Với câu hỏi khác, điền form dưới đây.
        </Text>
      </View>
      <View className="rounded-xl border border-border bg-card/40 p-5">
        <ContactForm />
      </View>
    </ScrollView>
  )
}

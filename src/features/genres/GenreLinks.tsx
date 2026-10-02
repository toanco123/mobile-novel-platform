import { router } from 'expo-router'
import { Fragment } from 'react'
import { Text as RNText } from 'react-native'
import { links } from '@/lib/links'
import type { Genre } from '@/types/story'

/**
 * Tên các thể loại cách nhau " · ", mỗi tên bấm mở trang thể loại. Đặt trong một Text: dùng Text
 * của React Native để kế thừa cỡ chữ, màu của dòng chứa nó.
 */
export function GenreLinks({ genres }: { genres: Genre[] }) {
  return genres.map((g, i) => (
    <Fragment key={g.slug}>
      {i > 0 && ' · '}
      <RNText
        role="link"
        suppressHighlighting={false}
        onPress={() => router.push(links.genre(g.slug))}
      >
        {g.name}
      </RNText>
    </Fragment>
  ))
}

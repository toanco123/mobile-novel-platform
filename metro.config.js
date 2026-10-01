const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

const config = getDefaultConfig(__dirname)

// withUniwindConfig phải là lớp bọc ngoài cùng
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  // Màu nền trang đọc (global.css); thêm theme ở đây thì thêm cả --theme ở lệnh typecheck
  extraThemes: ['reader-white', 'reader-paper', 'reader-gray', 'reader-black'],
})

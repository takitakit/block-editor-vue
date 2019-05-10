// i18nメッセージのロード処理
const i18n_msg = {}
const requires = require.context(
  './',
  false,
  /.json$/
)
requires.keys().forEach(file => {
  const config = requires(file)
  let m
  if ((m = file.match(/([^\/\.]+)\.json$/)) !== null) {
    let locale = m[1]
    i18n_msg[locale] = config
  }
})
export default i18n_msg;
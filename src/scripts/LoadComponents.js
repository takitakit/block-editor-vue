const components = {}
const item_classes = {}
const requires = require.context(
  '@/components', false, /.vue$/
)
requires.keys().forEach(file => {
  let m
  if ((m = file.match(/^\.\/(.+?)\.vue$/))!==null) {
    const name = m[1]
    const config = requires(file)
    const component = config.default || config
    const item_class = config.Item

    components[name] = component
    item_classes[name] = item_class
  }
})

export {components, item_classes}
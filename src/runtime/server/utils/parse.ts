export function stripCSSStyles(message: string): string {
  let cleaned = message.replace(/%c/g, '')
  // eslint-disable-next-line regexp/no-dupe-disjunctions
  const cssPattern = /\b(?:color|background|background-color|font-weight|font-style|text-decoration|border|border-radius|padding|margin|display|position|width|height|top|left|right|bottom|z-index|opacity|transform|transition|animation|box-shadow|text-shadow|font-size|font-family|line-height|text-align|vertical-align|overflow|cursor|pointer-events|user-select|outline|border-collapse|border-spacing|table-layout|white-space|word-wrap|word-break|text-overflow|letter-spacing|word-spacing|text-indent|text-transform|font-variant|font-stretch|unicode-bidi|direction|writing-mode|resize|appearance|filter|backdrop-filter|clip-path|mask|mix-blend-mode|isolation|will-change|contain|content|quotes|counter-increment|counter-reset|list-style|list-style-type|list-style-position|list-style-image|border-image|flex|flex-direction|flex-wrap|flex-flow|justify-content|align-items|align-content|align-self|order|flex-grow|flex-shrink|flex-basis|grid|grid-template|grid-template-rows|grid-template-columns|grid-template-areas|grid-auto-rows|grid-auto-columns|grid-auto-flow|grid-row|grid-column|grid-area|gap|row-gap|column-gap|place-items|place-content|place-self|justify-items|justify-self|align-items|align-content|align-self)\s*:[^;]+;?\s*/gi
  cleaned = cleaned.replace(cssPattern, '')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  return cleaned
}

export function shouldLogMessage(message: string): boolean {
  if (!message || message.length === 0) {
    return false
  }

  const lowerMessage = message.toLowerCase()
  const blockedPatterns = [
    'ssr',
    '[ssr]',
    'hydration',
    '[hydration]',
    // to avoid bugging chrome devtools not found maybe will get rid of this later
    'vue-router',
  ]

  return !blockedPatterns.some(pattern => lowerMessage.includes(pattern))
}

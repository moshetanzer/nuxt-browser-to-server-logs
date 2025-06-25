<template>
  <div>
    Nuxt module playground!
  </div>
</template>

<script setup>
console.warn('This is the Nuxt module playground!')
console.log('You can use this to test your Nuxt modules in isolation.')
console.info('This playground is not meant for production use, but rather for development and testing purposes.')
console.error('Please do not use this in production, as it may contain experimental features or unstable code.')
// Basic log
console.log('Hello, World!')

// Template literal with expressions
console.log(`User ${'Moshe'} has ${2 + 3} messages at ${new Date().toISOString()}`)

// Log with special characters
console.log('🚀🔥💥 Unicode test: © ™ ✓ 𝌆 𐍈')

// Array with holes
console.log([1,,3,,5])

// Object with nested structure
console.log({
  user: 'test',
  profile: {
    age: 30,
    preferences: {
      color: 'blue',
      languages: ['JS', 'TS', 'Rust'],
    },
  },
})

// Error object
console.log(new Error('Something went wrong'))

// Circular reference
const a = {}
a.self = a
console.log(a)

// Symbol key and value
const sym = Symbol('hidden')
const obj = { [sym]: 'secret', visible: true }
console.log(obj)

// Function logging
function shout(msg) {
  return msg.toUpperCase()
}
console.log(shout, shout('test'))

// Mixed types
console.log(undefined, null, Number.NaN, Infinity, -Infinity, true, false, 0, -0)

// Complex inspect
const inspected = {
  toString() {
    return 'toString called'
  },
  [Symbol.toPrimitive]() {
    return 'primitive'
  },
  inspect() {
    return 'custom inspect'
  },
}
console.log(inspected)

// Deeply nested array
const deep = [[[['too deep']]]]
console.log(deep)

// Stack trace
console.trace('Trace test')

// Escaped characters and edge string
console.log('Newline:\nTab:\tBackslash:\\ Quote:" Single quote:\'')

// Logging multiple things
console.log('User', { id: 1 }, [1, 2, 3], () => 'hi')

// Huge number and bigint
console.log(1e100, BigInt('9007199254740991'))

// Dates and regex
console.log(new Date(), /abc/i)

// Logging the console itself (meta!)
console.log(console)
</script>

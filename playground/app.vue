<template>
  <div>
    Nuxt module playground!
  </div>
</template>

<script setup>
console.log('Final test: ', '&amp;lt;script&amp;gt;alert("xss")&amp;lt;/script&amp;gt;')
console.warn('This is the Nuxt module playground!')
console.log('You can use this to test your Nuxt modules in isolation.')
console.info('This playground is not meant for production use, but rather for development and testing purposes.')
console.error('Please do not use this in production, as it may contain experimental features or unstable code.')
console.log('Hello, World!')
console.log(`User ${'Moshe'} has ${2 + 3} messages at ${new Date().toISOString()}`)
console.log('🚀🔥💥 Unicode test: © ™ ✓ 𝌆 𐍈 emoji: 👨‍💻🦄🌈💀')
</script>

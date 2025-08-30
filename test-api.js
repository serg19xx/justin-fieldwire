import { testAllEndpoints } from './src/utils/api-test.js'

console.log('Starting API tests...')
testAllEndpoints().then(results => {
  console.log('All tests completed!')
  process.exit(0)
}).catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})

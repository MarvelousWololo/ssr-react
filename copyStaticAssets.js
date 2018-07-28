const fs = require('fs-extra')

try {
  fs.copySync('src/public/favicon.ico', 'dist/public/favicon.ico')

  console.log('######## static assets copy: OK ########')
} catch (err) {
  console.error('######## static assets copy: ERROR ########', err.message)
}

const port = process.env.PORT || 4000;
const env = process.env.NODE_ENV || 'development';
const src = env === 'production' ? './build/app' : './src/app';

require('babel-polyfill');
if (env === 'development') {
  console.log('dev');
  // for development use babel/register for faster runtime compilation
  require('babel-register');
}

const app = require(src).default;
app.listen(port);

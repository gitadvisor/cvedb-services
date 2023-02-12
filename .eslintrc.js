module.exports = {
  env: {
    mocha: true,
    node: true
  },
  extends: [
    'plugin:mocha/recommended',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module' // Allows for the use of imports
  },
  plugins: [
    'mocha'
  ],
  rules: {
    'mocha/no-mocha-arrows': 'off'
  }
}

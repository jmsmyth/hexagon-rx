
export function isFunction (x) {
  return typeof x === "function";
}

const alphabet = 'ABCEDEF0123456789'.split('')
const alphabetSize = alphabet.length
export function randomId () {
  let res = ''
  for (let i = 0; i < 32; i++) {
    res += alphabet[Math.floor(Math.random() * alphabetSize)]
  }
  return res
}

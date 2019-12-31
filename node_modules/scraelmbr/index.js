function scramble (input) {
  var str = input || ''
  var ret = ''
  var re = /([a-zA-Z]+)|([^a-zA-Z]+)/g
  var match = []

  while (match = re.exec(str)) {
    if (match[2]) {
      ret += match[2]

      continue
    }

    if (match[1].length < 4) {
      ret += match[1]

      continue
    }

    ret 
      += match[1]
        .slice(0, 1)
      + match[1]
        .slice(1, -1)
        .split('')
        .sort(() => {
          return (0.5 - Math.random())
        })
        .join('')
      + match[1]
        .slice(-1)
  }

  return ret
}

module.exports = scramble

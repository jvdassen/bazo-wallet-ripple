import qs from 'qs';

const URIScheme = {
  decode: function decode (uri) {
    var qregex = /bazo:\/?\/?([^?]+)(\?([^]+))?/.exec(uri)
    if (!qregex) throw new Error('Invalid URI: ' + uri)

    var address = qregex[1]
    var query = qregex[3]
    var options = qs.parse(query)

    if (options.amount) {
      options.amount = Number(options.amount)
      if (!isFinite(options.amount)) throw new Error('Invalid amount')
      if (options.amount < 0) throw new Error('Invalid amount')
    }

    return { address: address, options: options }
  },
  encode: function encode (address, options) {
    options = options || {}
    var query = qs.stringify(options)

    if (options.amount) {
      if (!isFinite(options.amount)) throw new TypeError('Invalid amount')
      if (options.amount < 0) throw new TypeError('Invalid amount')
    }

    return 'bazo:' + address + (query ? '?' : '') + query
  }
};

export default URIScheme;

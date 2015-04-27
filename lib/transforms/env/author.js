'use strict';

var author = require('parse-author');

/**
 * Called in the `init` transform. Adds an `author`
 * property to the context, or normalizes the existing one.
 */

module.exports = function author_(app) {
  var res = app.get('data.author');
  if (res && typeof res === 'string') {
    app.data({author: author(res)});
  } else {
    app.data({author: {}});
  }
};

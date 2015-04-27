'use strict';

var _ = require('lodash');

/**
 * Transform for loading helper collections
 *
 *  - Loads template-helpers
 *  - Loads logging-helpers
 *  - Exposes markdown-utils as helpers
 *  - exposes path helpers on the `path.` property
 *
 * ```js
 * <%= mdu.link(author.name, author.url) %>
 * //=> [Jon Schlinkert](https://github.com/jonschlinkert)
 *
 * <%= path.extname("foo.md") %>
 * //=> '.md'
 * ```
 */

module.exports = function collections_(verb) {
  verb.helpers({console: console});
  verb.helpers(require('logging-helpers'));

  // namespaced helpers
  verb.helpers({mdu: require('markdown-utils')});

  // remove `path` helpers from root and add them to `path.`
  var helpers = require('template-helpers');
  verb.helpers(_.omit(helpers._, Object.keys(helpers.path)));
  verb.helpers({path: helpers.path});
};

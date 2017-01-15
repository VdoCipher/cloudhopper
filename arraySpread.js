"use strict";

/**
 * This function is just a babel traspiled version of [].concat(arr);
 * Kind of like array  flatten but not sure
 */

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function cons(files) {
  var _ref;

  return (_ref = []).concat.apply(_ref, _toConsumableArray(files));
}

module.exports = cons;

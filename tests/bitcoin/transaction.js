'use strict';

const assert = require('assert');
const Transaction = require('../../types/bitcoin/transaction');

const settings = require('../../settings/test');

describe('@fabric/core/types/bitcoin/transaction', function () {
  it('is available from @fabric/core', function () {
    assert.equal(Transaction instanceof Function, true);
  });

  it('creates an empty instance', function () {
    const tx = new Transaction();
    assert.ok(tx);
  });
});

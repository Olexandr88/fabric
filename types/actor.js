'use strict';

// Dependencies
const { EventEmitter } = require('events');
const monitor = require('fast-json-patch');

// Fabric Types
const Hash256 = require('./hash256');

// Fabric Functions
const _sortKeys = require('../functions/_sortKeys');

/**
 * Generic Fabric Actor.
 * @access protected
 * @emits message Fabric {@link Message} objects.
 * @property {String} id Unique identifier for this Actor (id === SHA256(preimage)).
 * @property {String} preimage Input hash for the `id` property (preimage === SHA256(ActorState)).
 */
class Actor extends EventEmitter {
  /**
   * Creates an {@link Actor}, which emits messages for other
   * Actors to subscribe to.  You can supply certain parameters
   * for the actor, including key material [!!!] — be mindful of
   * what you share with others!
   * @param {Object} [actor] Object to use as the actor.
   * @param {String} [actor.seed] BIP24 Mnemonic to use as a seed phrase.
   * @param {Buffer} [actor.public] Public key.
   * @param {Buffer} [actor.private] Private key.
   * @returns {Actor} Instance of the Actor.  Call {@link Actor#sign} to emit a {@link Signature}.
   */
  constructor (actor = {}) {
    super(actor);

    this.log = [];
    this.signature = null;
    this.value = this._readObject(actor); // TODO: use Buffer?

    // Internal State
    this._state = {
      '@type': 'Actor',
      '@data': this.value,
      status: 'PAUSED',
      content: this.value || {}
    };

    // Chainable
    return this;
  }

  static fromAny (input = {}) {
    let state = null;

    if (typeof input === 'string') {
      state = { content: input };
    } else if (input instanceof Buffer) {
      state = { content: input.toString('hex') };
    } else {
      state = Object.assign({}, input);
    }

    return new Actor(state);
  }

  static fromJSON (input) {
    let result = null;

    if (typeof input === 'string' && input.length) {
      console.log('trying to parse as JSON:', input);
      try {
        result = JSON.parse(input);
      } catch (E) {
        console.error('Failure in fromJSON:', E);
      }
    } else {
      console.trace('Invalid input:', typeof input);
    }

    return result;
  }

  get id () {
    const buffer = Buffer.from(this.preimage, 'hex');
    return Hash256.digest(buffer);
  }

  get preimage () {
    const input = {
      '@type': 'FabricActorState',
      '@data': this.toObject()
    };

    const string = JSON.stringify(input, null, '  ');
    const buffer = Buffer.from(string, 'utf8');

    return Hash256.digest(buffer);
  }

  get state () {
    return this._state.content;
  }

  get type () {
    return this._state['@type'];
  }

  /**
   * Resolve the current state to a commitment.
   * @emits Actor Current malleable state.
   * @returns {String} 32-byte ID
   */
  commit () {
    const state = new Actor(this._state.content);
    this.log.push(...state.id);
    this.emit('commit', state);
    return state.id;
  }

  /**
   * Casts the Actor to a normalized Buffer.
   * @returns {Buffer}
   */
  toBuffer () {
    return Buffer.from(this.serialize(), 'utf8');
  }

  /**
   * Returns the Actor's current state as an {@link Object}.
   * @returns {Object}
   */
  toObject () {
    return _sortKeys(this.state);
  }

  toString (format = 'json') {
    switch (format) {
      case 'hex':
        return Buffer.from(this.serialize(), 'utf8').toString('hex');
      case 'json':
      default:
        return this.serialize();
    }
  }

  pause () {
    this.status = 'PAUSING';
    this.commit();
    return this;
  }

  /**
   * Serialize the Actor's current state into a JSON-formatted string.
   * @returns {String}
   */
  serialize () {
    let json = null;

    try {
      json = JSON.stringify(this.toObject(), null, '  ');
    } catch (exception) {
      json = JSON.stringify({
        type: 'Error',
        content: `Exception serializing: ${exception}`
      }, null, '  ');
    }

    return json;
  }

  /**
   * Signs the Actor.
   * @returns {Actor}
   */
  sign () {
    throw new Error('Unimplemented on this branch.  Use @fabric/core/types/signer instead.');
    /* this.signature = this.key._sign(this.toBuffer());
    this.emit('signature', this.signature);
    return this; */
  }

  /**
   * Toggles `status` property to unpaused.
   * @
   * @returns {Actor}
   */
  unpause () {
    this.status = 'UNPAUSING';
    this.commit();
    this.status = 'UNPAUSED';
    return this;
  }

  /**
   * Incurs 1 SYSCALL
   * @access private
   * @returns {Object}
   */
  _getState () {
    return this.state;
  }

  _readObject (input = {}) {
    let state = {};

    if (typeof input === 'string') {
      state = Object.assign(state, {
        type: 'String',
        content: input
      });
    } else if (input instanceof Buffer) {
      state = Object.assign(state, {
        type: 'Buffer',
        content: input.toString('hex'),
        encoding: 'hex'
      });
    } else {
      state = Object.assign(state, input);
    }

    return state;
  }
}

module.exports = Actor;
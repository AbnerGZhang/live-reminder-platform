'use strict';

const { createDouyinPageStatusSource } = require('./douyin-page-status-source.cjs');
const { createHttpJsonStatusSource } = require('./http-json-status-source.cjs');

function createStatusSourceRuntime(options = {}) {
  const definitions = requireArray(options.definitions, 'definitions');
  for (const [index, definition] of definitions.entries()) validateDefinition(definition, index);

  const now = options.now ?? (() => new Date());
  const pageDefinitions = definitions.filter(definition => definition.kind === 'douyin-page');
  const createBrowserDriver = options.createBrowserDriver;
  let driver = null;
  let started = false;
  let closed = false;
  const registrations = new Map();
  const needsDriver = pageDefinitions.length > 0 || options.enableDynamicDouyinPageSources === true;

  if (needsDriver) {
    if (typeof createBrowserDriver !== 'function') throw new TypeError('createBrowserDriver is required for douyin-page sources');
    driver = createBrowserDriver({ ...options.browser, fetch: options.fetch });
    if (!driver || typeof driver.start !== 'function'
      || typeof driver.inspectDouyinPage !== 'function'
      || typeof driver.close !== 'function') {
      throw new TypeError('browser driver must provide start, inspectDouyinPage, and close');
    }
  }

  function makeRegistration(definition) {
    if (definition.kind === 'douyin-page' && !driver) throw new Error('a browser driver is not configured for Douyin page sources');
    const frozenDefinition = Object.freeze({ ...definition });
    const source = frozenDefinition.kind === 'douyin-page'
      ? createDouyinPageStatusSource({
          id: frozenDefinition.id,
          url: frozenDefinition.url,
          expectedIdentity: frozenDefinition.expectedIdentity,
          timeoutMs: frozenDefinition.timeoutMs,
          driver,
          now,
        })
      : createHttpJsonStatusSource({
          id: frozenDefinition.id,
          url: frozenDefinition.url,
          timeoutMs: frozenDefinition.timeoutMs,
          allowLoopbackHttp: frozenDefinition.allowLoopbackHttp === true,
          bearerToken: frozenDefinition.bearerToken,
          fetch: options.fetch,
          now,
        });
    return Object.freeze({ definition: frozenDefinition, source });
  }

  for (const definition of definitions) {
    if (registrations.has(definition.id)) throw new Error('duplicate status source id: ' + definition.id);
    registrations.set(definition.id, makeRegistration(definition));
  }

  return Object.freeze({
    get registrations() { return Object.freeze([...registrations.values()]); },
    addSource(definition) {
      if (closed) throw new Error('status source runtime is closed');
      validateDefinition(definition, registrations.size);
      if (registrations.has(definition.id)) throw new Error('duplicate status source id: ' + definition.id);
      const registration = makeRegistration(definition);
      registrations.set(definition.id, registration);
      return registration;
    },
    removeSource(id) {
      const registration = registrations.get(id) || null;
      registrations.delete(id);
      return registration;
    },
    updateDefinition(definition) {
      if (closed) throw new Error('status source runtime is closed');
      validateDefinition(definition, registrations.size);
      const existing = registrations.get(definition.id);
      if (!existing) return this.addSource(definition);
      const before = existing.definition;
      const sameTarget = before.kind === definition.kind
        && before.id === definition.id
        && before.broadcasterId === definition.broadcasterId
        && before.url === definition.url
        && before.expectedIdentity === definition.expectedIdentity
        && before.timeoutMs === definition.timeoutMs;
      if (!sameTarget) throw new Error('source target changed; remove the old source before updating it');
      const registration = Object.freeze({ definition: Object.freeze({ ...definition }), source: existing.source });
      registrations.set(definition.id, registration);
      return registration;
    },
    async start() {
      if (closed) throw new Error('status source runtime is closed');
      if (started) return;
      try {
        if (driver) await driver.start();
        started = true;
      } catch (error) {
        await driver?.close().catch(() => {});
        closed = true;
        throw error;
      }
    },
    async close() {
      if (closed) return;
      closed = true;
      if (driver) await driver.close();
      started = false;
    },
  });
}

function validateDefinition(definition, index) {
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    throw new TypeError('definitions[' + index + '] must be an object');
  }
  if (!['http-json', 'douyin-page'].includes(definition.kind)) {
    throw new TypeError('definitions[' + index + '].kind must be http-json or douyin-page');
  }
  if (typeof definition.id !== 'string' || !definition.id.trim()) {
    throw new TypeError('definitions[' + index + '].id must be a non-empty string');
  }
}

function requireArray(value, name) {
  if (!Array.isArray(value)) throw new TypeError(name + ' must be an array');
  return value;
}

module.exports = { createStatusSourceRuntime };

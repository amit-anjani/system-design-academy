// A drop-in replacement for the Claude-artifact `window.storage` API, backed by
// the browser's localStorage instead of Anthropic's hosted storage. This means
// data lives only on each visitor's own device/browser \u2014 there's no shared
// backend, so accounts and progress aren't synced across devices.

const ROOT_KEY = "sda-local-storage-v1";

function readAll() {
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    return raw ? JSON.parse(raw) : { personal: {}, shared: {} };
  } catch (e) {
    return { personal: {}, shared: {} };
  }
}

function writeAll(data) {
  window.localStorage.setItem(ROOT_KEY, JSON.stringify(data));
}

export const storage = {
  async get(key, shared = false) {
    const data = readAll();
    const scope = shared ? "shared" : "personal";
    if (!data[scope] || !(key in data[scope])) {
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value: data[scope][key], shared };
  },

  async set(key, value, shared = false) {
    const data = readAll();
    const scope = shared ? "shared" : "personal";
    if (!data[scope]) data[scope] = {};
    data[scope][key] = value;
    writeAll(data);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const data = readAll();
    const scope = shared ? "shared" : "personal";
    if (data[scope]) delete data[scope][key];
    writeAll(data);
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    const data = readAll();
    const scope = shared ? "shared" : "personal";
    const keys = data[scope] ? Object.keys(data[scope]).filter((k) => k.startsWith(prefix)) : [];
    return { keys, prefix, shared };
  }
};

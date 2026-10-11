const api = require('./api');
const { getConfig } = require('./config');
const session = require('./session');
const { normalizeChannels, normalizeMe } = require('../utils/view-model');
const { fetchDemoClientData } = require('./demo-data');

let localConfig = null;
try {
  localConfig = require('../config.local.js');
} catch (error) {
  localConfig = null;
}

async function fetchClientData(t, options) {
  if (localConfig && localConfig.demoMode === true) {
    return fetchDemoClientData(t);
  }

  await session.ensureSession({ force: Boolean(options && options.forceAuth) });
  const [channelsPayload, mePayload] = await Promise.all([
    api.getChannels(),
    api.getMe(),
  ]);
  const me = normalizeMe(mePayload);
  const channels = normalizeChannels(channelsPayload, me, getConfig().staleAfterMs, t);
  const namesById = new Map(channels.map((channel) => [channel.id, channel.displayName]));
  me.activity = me.activity.map((entry) => ({
    ...entry,
    channelDisplayName: entry.channelDisplayName || namesById.get(String(entry.channelId || '')),
  }));
  return { channels, me };
}

module.exports = {
  fetchClientData,
};

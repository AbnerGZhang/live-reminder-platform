const { normalizeChannels, normalizeMe } = require('../utils/view-model');

function fetchDemoClientData(t) {
  const now = Date.now();
  const channelsPayload = {
    channels: [
      {
        channelId: 'demo-channel-a',
        name: '演示频道 A',
        sourceLabel: '本地演示',
        status: 'live',
        stale: false,
        observedAt: new Date(now - 25000).toISOString(),
      },
      {
        channelId: 'demo-channel-b',
        name: '演示频道 B',
        sourceLabel: '本地演示',
        status: 'offline',
        stale: false,
        observedAt: new Date(now - 60000).toISOString(),
      },
      {
        channelId: 'demo-channel-c',
        name: '演示频道 C',
        sourceLabel: '本地演示',
        status: 'unknown',
        stale: false,
        observedAt: '',
      },
    ],
  };

  const mePayload = {
    me: {
      reminders: { enabled: true, availableCredits: 3 },
      templateId: 'demo-template-not-real',
      subscriptions: [
        { channelId: 'demo-channel-a', active: true },
        { channelId: 'demo-channel-b', active: false },
        { channelId: 'demo-channel-c', active: true },
      ],
      activity: [
        {
          id: 'demo-activity-1',
          kind: 'status',
          status: 'live',
          channelId: 'demo-channel-a',
          channelName: '演示频道 A',
          occurredAt: new Date(now - 2 * 60000).toISOString(),
        },
        {
          id: 'demo-activity-2',
          kind: 'reminder',
          deliveryStatus: 'accepted',
          channelId: 'demo-channel-a',
          channelName: '演示频道 A',
          occurredAt: new Date(now - 5 * 60000).toISOString(),
        },
        {
          id: 'demo-activity-3',
          kind: 'status',
          status: 'offline',
          channelId: 'demo-channel-b',
          channelName: '演示频道 B',
          occurredAt: new Date(now - 12 * 60000).toISOString(),
        },
        {
          id: 'demo-activity-4',
          kind: 'reminder',
          deliveryStatus: 'pending',
          channelId: 'demo-channel-c',
          channelName: '演示频道 C',
          occurredAt: new Date(now - 25 * 60000).toISOString(),
        },
      ],
    },
  };

  const me = normalizeMe(mePayload);
  const channels = normalizeChannels(channelsPayload, me, 300000, t);
  const namesById = new Map(channels.map((channel) => [channel.id, channel.displayName]));
  me.activity = me.activity.map((entry) => ({
    ...entry,
    channelDisplayName: entry.channelDisplayName || namesById.get(String(entry.channelId || '')),
  }));

  return { channels, me, demoMode: true };
}

module.exports = { fetchDemoClientData };

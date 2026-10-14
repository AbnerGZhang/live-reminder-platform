import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconBroadcast,
  IconCheck,
  IconClock,
  IconLanguage,
  IconLock,
  IconLogout,
  IconRefresh,
  IconSend,
  IconUsers,
} from '@tabler/icons-react';

const COPY = Object.freeze({
  en: {
    language: '中文',
    product: 'Reminder administration',
    operational: 'Operational dashboard',
    signIn: 'Administrator sign in',
    signInIntro: 'Enter the private password configured on this server.',
    password: 'Password',
    submit: 'Sign in',
    signingIn: 'Signing in…',
    noDefault: 'There is no default password. Use the one-time password printed on first local start, or generate private values with npm run admin:secrets.',
    authFailed: 'The password was not accepted. Check the server configuration and try again.',
    rateLimited: 'Too many attempts. Wait for the retry window before trying again.',
    unavailable: 'The dashboard is unavailable. Check the server and persistence health.',
    refreshing: 'Refreshing…',
    refresh: 'Refresh',
    logout: 'Sign out',
    summary: 'Summary',
    broadcasters: 'Channels',
    recipients: 'Recipients (aggregate)',
    events: 'Events',
    receipts: 'Receipts',
    accepted: 'Accepted',
    pending: 'Pending',
    failed: 'Failed',
    ambiguous: 'Ambiguous',
    bookkeeping: 'Bookkeeping pending',
    sourceStatus: 'Channel status',
    sourceId: 'Channel ID',
    stableStatus: 'Stable status',
    observed: 'Last observed',
    subscriptions: 'Active subscriptions',
    eligible: 'Currently eligible recipients',
    noChannels: 'No channels have been observed.',
    recentEvents: 'Recent events',
    eventId: 'Event ID',
    denominator: 'Frozen denominator',
    reconciliation: 'Reconciliation',
    consistent: 'Counts consistent',
    inconsistent: 'Counts inconsistent',
    terminal: 'Processing complete',
    open: 'Open',
    noEvents: 'No reminder events have been created.',
    deliveryTitle: 'Notification status',
    deliveryText: 'Accepted means the configured sender accepted the request. It does not confirm that a phone displayed the notification.',
    loading: 'Loading dashboard…',
    unknown: 'Unknown',
    live: 'Live',
    offline: 'Offline',
  },
  zh: {
    language: 'EN',
    product: '提醒管理后台',
    operational: '运营控制台',
    signIn: '管理员登录',
    signInIntro: '请输入这台服务器上配置的私有密码。',
    password: '密码',
    submit: '登录',
    signingIn: '正在登录…',
    noDefault: '系统没有默认密码。请使用本机首次启动时打印的一次性密码，或运行 npm run admin:secrets 生成私有配置。',
    authFailed: '密码未被接受，请检查服务器配置后重试。',
    rateLimited: '尝试次数过多，请等待限流窗口结束后再试。',
    unavailable: '后台暂不可用，请检查服务器和持久化存储的健康状态。',
    refreshing: '正在刷新…',
    refresh: '刷新',
    logout: '退出登录',
    summary: '汇总',
    broadcasters: '频道',
    recipients: '接收者（汇总）',
    events: '事件',
    receipts: '回执',
    accepted: '已接受',
    pending: '待处理',
    failed: '失败',
    ambiguous: '不确定',
    bookkeeping: '待完成账务',
    sourceStatus: '频道状态',
    sourceId: '频道 ID',
    stableStatus: '稳定状态',
    observed: '最近观察',
    subscriptions: '有效订阅',
    eligible: '当前有效接收者',
    noChannels: '尚未观察到频道。',
    recentEvents: '近期事件',
    eventId: '事件 ID',
    denominator: '冻结分母',
    reconciliation: '对账',
    consistent: '计数一致',
    inconsistent: '计数不一致',
    terminal: '处理完毕',
    open: '未完成',
    noEvents: '尚未创建提醒事件。',
    deliveryTitle: '通知状态',
    deliveryText: '“已接受”仅表示配置的发送端接受了请求，不代表手机已经展示通知。',
    loading: '正在加载后台…',
    unknown: '未知',
    live: '直播中',
    offline: '未开播',
  },
});

function number(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function text(value, fallback = '—') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function time(value, language) {
  if (typeof value !== 'string') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function SummaryCard({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <article className={`admin-metric admin-metric--${tone}`}>
      <span className="admin-icon"><Icon size={19} stroke={1.8} /></span>
      <span>{label}</span>
      <strong>{number(value).toLocaleString()}</strong>
    </article>
  );
}

function StatusPill({ status, copy }) {
  const normalized = ['live', 'offline', 'unknown'].includes(status) ? status : 'unknown';
  return <span className={`status-pill status-pill--${normalized}`}><span aria-hidden="true" />{copy[normalized]}</span>;
}

const MONITOR_COPY = Object.freeze({
  en: {
    title: 'Monitor account management', add: 'Add account', save: 'Save changes', cancel: 'Cancel',
    name: 'Account name', url: 'Douyin profile URL', interval: 'Polling interval (minutes)',
    description: 'Description (optional)', enabled: 'Enable monitoring', edit: 'Edit',
    pause: 'Disable', resume: 'Enable', remove: 'Delete', empty: 'No Douyin accounts configured.',
    added: 'Account added.', saved: 'Changes saved.', deleted: 'Account deleted.',
    confirmDelete: 'Delete this monitoring account? Existing history will be retained.',
    requestFailed: 'The request failed. Please try again.', status: 'Status', actions: 'Actions',
    enabledStatus: 'Enabled', disabledStatus: 'Disabled', identity: 'Profile ID',
  },
  zh: {
    title: '\u76d1\u6d4b\u8d26\u53f7\u7ba1\u7406', add: '\u6dfb\u52a0\u8d26\u53f7', save: '\u4fdd\u5b58\u4fee\u6539', cancel: '\u53d6\u6d88',
    name: '\u4e3b\u64ad\u540d\u79f0', url: '\u6296\u97f3\u4e3b\u9875\u94fe\u63a5', interval: '\u68c0\u6d4b\u95f4\u9694\uff08\u5206\u949f\uff09',
    description: '\u5907\u6ce8\uff08\u53ef\u9009\uff09', enabled: '\u542f\u7528\u76d1\u6d4b', edit: '\u7f16\u8f91',
    pause: '\u505c\u7528', resume: '\u542f\u7528', remove: '\u5220\u9664', empty: '\u6682\u65e0\u6296\u97f3\u76d1\u6d4b\u8d26\u53f7\u3002',
    added: '\u8d26\u53f7\u5df2\u6dfb\u52a0\u3002', saved: '\u4fee\u6539\u5df2\u4fdd\u5b58\u3002', deleted: '\u8d26\u53f7\u5df2\u5220\u9664\u3002',
    confirmDelete: '\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u76d1\u6d4b\u8d26\u53f7\u5417\uff1f\u5386\u53f2\u8bb0\u5f55\u4f1a\u4fdd\u7559\u3002',
    requestFailed: '\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002', status: '\u72b6\u6001', actions: '\u64cd\u4f5c',
    enabledStatus: '\u5df2\u542f\u7528', disabledStatus: '\u5df2\u505c\u7528', identity: '\u4e3b\u9875 ID',
  },
});

function MonitorManagement({ language, monitors, busy, onMutation }) {
  const copy = MONITOR_COPY[language] || MONITOR_COPY.en;
  const blankForm = { displayName: '', url: '', pollIntervalMinutes: '5', description: '', enabled: true };
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  function startEdit(item) {
    setEditingId(item.channelId);
    setForm({
      displayName: item.displayName || '', url: item.url || '',
      pollIntervalMinutes: String(item.pollIntervalMinutes || 5),
      description: item.description || '', enabled: item.enabled !== false,
    });
    setFormError('');
    setNotice('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setFormError('');
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    setNotice('');
    const result = await onMutation(editingId ? 'PATCH' : 'POST', editingId, {
      displayName: form.displayName,
      url: form.url,
      pollIntervalMinutes: Number(form.pollIntervalMinutes),
      description: form.description,
      enabled: form.enabled,
    });
    if (!result.ok) {
      setFormError(result.error || copy.requestFailed);
      return;
    }
    setNotice(editingId ? copy.saved : copy.added);
    setEditingId(null);
    setForm(blankForm);
  }

  async function toggle(item) {
    setFormError('');
    const result = await onMutation('PATCH', item.channelId, { enabled: !item.enabled });
    if (!result.ok) setFormError(result.error || copy.requestFailed);
    else setNotice(item.enabled ? copy.disabledStatus : copy.enabledStatus);
  }

  async function remove(item) {
    if (!window.confirm(copy.confirmDelete + '\n' + item.displayName)) return;
    setFormError('');
    const result = await onMutation('DELETE', item.channelId);
    if (!result.ok) {
      setFormError(result.error || copy.requestFailed);
      return;
    }
    if (editingId === item.channelId) cancelEdit();
    setNotice(copy.deleted);
  }

  return (
    <section className="admin-section monitor-management" aria-labelledby="monitor-management-title">
      <div className="section-title">
        <div><p className="admin-eyebrow">Douyin</p><h2 id="monitor-management-title">{copy.title}</h2></div>
        <span>{monitors.length}</span>
      </div>
      <form className="monitor-form" onSubmit={submit}>
        <label><span>{copy.name}</span><input value={form.displayName} maxLength={100} required onChange={event => setForm(current => ({ ...current, displayName: event.target.value }))} /></label>
        <label className="monitor-form__url"><span>{copy.url}</span><input type="url" value={form.url} maxLength={2048} placeholder="https://www.douyin.com/user/..." required onChange={event => setForm(current => ({ ...current, url: event.target.value }))} /></label>
        <label><span>{copy.interval}</span><input type="number" min="1" max="60" step="1" required value={form.pollIntervalMinutes} onChange={event => setForm(current => ({ ...current, pollIntervalMinutes: event.target.value }))} /></label>
        <label><span>{copy.description}</span><input value={form.description} maxLength={300} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></label>
        <label className="monitor-enabled"><input type="checkbox" checked={form.enabled} onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))} /> <span>{copy.enabled}</span></label>
        <div className="monitor-form__actions">
          <button className="primary-button" type="submit" disabled={busy}>{editingId ? copy.save : copy.add}</button>
          {editingId && <button type="button" onClick={cancelEdit} disabled={busy}>{copy.cancel}</button>}
        </div>
      </form>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      {notice && <p className="monitor-notice" role="status">{notice}</p>}
      {monitors.length === 0 ? <p className="empty-state">{copy.empty}</p> : (
        <div className="monitor-list">
          {monitors.map(item => (
            <article className="monitor-row" key={item.channelId}>
              <div className="monitor-row__main">
                <strong>{item.displayName}</strong>
                <span>{copy.identity}: <code>{item.expectedIdentity}</code></span>
                <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                <small>{item.pollIntervalMinutes} min</small>
              </div>
              <span className={item.enabled ? 'monitor-state monitor-state--enabled' : 'monitor-state'}>{item.enabled ? copy.enabledStatus : copy.disabledStatus}</span>
              <div className="monitor-row__actions">
                <button type="button" disabled={busy} onClick={() => startEdit(item)}>{copy.edit}</button>
                <button type="button" disabled={busy} onClick={() => toggle(item)}>{item.enabled ? copy.pause : copy.resume}</button>
                <button type="button" className="monitor-delete" disabled={busy} onClick={() => remove(item)}>{copy.remove}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function LoginView({ copy, language, onLanguage, onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setPassword('');
        onAuthenticated();
      } else {
        setError(response.status === 429 ? copy.rateLimited : copy.authFailed);
      }
    } catch {
      setError(copy.unavailable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <button className="admin-language" type="button" onClick={onLanguage}>
        <IconLanguage size={17} stroke={1.8} aria-hidden="true" /> {copy.language}
      </button>
      <section className="login-card" aria-labelledby="login-title">
        <span className="login-lock"><IconLock size={26} stroke={1.7} /></span>
        <p className="admin-eyebrow">{copy.product}</p>
        <h1 id="login-title">{copy.signIn}</h1>
        <p>{copy.signInIntro}</p>
        <form onSubmit={submit}>
          <label htmlFor="admin-password">{copy.password}</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            minLength={12}
            required
          />
          <button className="primary-button" type="submit" disabled={busy || password.length < 12}>
            {busy ? copy.signingIn : copy.submit}
          </button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="login-help">{copy.noDefault}</p>
      </section>
    </main>
  );
}

function DashboardView({ copy, language, dashboard, busy, error, onRefresh, onLogout, onLanguage, monitorTargets, monitorBusy, onMonitorMutation }) {
  const summary = dashboard.summary || {};
  const broadcasters = Array.isArray(dashboard.broadcasters) ? dashboard.broadcasters : [];
  const events = Array.isArray(dashboard.events) ? dashboard.events : [];
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div><p className="admin-eyebrow">{copy.product}</p><h1>{copy.operational}</h1></div>
        <div className="admin-actions">
          <button type="button" onClick={onLanguage}><IconLanguage size={17} stroke={1.8} />{copy.language}</button>
          <button type="button" onClick={onRefresh} disabled={busy}><IconRefresh size={17} stroke={1.8} />{busy ? copy.refreshing : copy.refresh}</button>
          <button type="button" onClick={onLogout}><IconLogout size={17} stroke={1.8} />{copy.logout}</button>
        </div>
      </header>

      <main className="admin-main">
        {error && <p className="dashboard-error" role="alert">{error}</p>}
        <section aria-labelledby="summary-title">
          <h2 id="summary-title">{copy.summary}</h2>
          <div className="admin-metric-grid">
            <SummaryCard icon={IconBroadcast} label={copy.broadcasters} value={summary.broadcasters} />
            <SummaryCard icon={IconUsers} label={copy.recipients} value={summary.recipients} />
            <SummaryCard icon={IconActivityHeartbeat} label={copy.events} value={summary.events} />
            <SummaryCard icon={IconSend} label={copy.receipts} value={summary.receipts} />
            <SummaryCard icon={IconCheck} label={copy.accepted} value={summary.accepted} tone="positive" />
            <SummaryCard icon={IconClock} label={copy.pending} value={number(summary.pending) + number(summary.inFlight)} tone="attention" />
            <SummaryCard icon={IconAlertTriangle} label={copy.failed} value={summary.failed} tone="danger" />
            <SummaryCard icon={IconAlertTriangle} label={copy.ambiguous} value={summary.ambiguous} tone="attention" />
            <SummaryCard icon={IconClock} label={copy.bookkeeping} value={summary.bookkeepingPending} tone="attention" />
          </div>
        </section>

        <MonitorManagement language={language} monitors={monitorTargets} busy={monitorBusy} onMutation={onMonitorMutation} />

        <section className="admin-section" aria-labelledby="channels-title">
          <div className="section-title"><div><p className="admin-eyebrow">{copy.sourceStatus}</p><h2 id="channels-title">{copy.broadcasters}</h2></div><span>{broadcasters.length}</span></div>
          {broadcasters.length === 0 ? <p className="empty-state">{copy.noChannels}</p> : (
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>{copy.sourceId}</th><th>{copy.stableStatus}</th><th>{copy.observed}</th><th>{copy.subscriptions}</th><th>{copy.eligible}</th></tr></thead>
                <tbody>{broadcasters.map((item, index) => (
                  <tr key={text(item.broadcasterId, `channel-${index}`)}>
                    <td className="mono-cell">{text(item.broadcasterId)}</td>
                    <td><StatusPill status={item.stableStatus} copy={copy} /></td>
                    <td>{time(item.lastObservedAt, language)}</td>
                    <td>{number(item.activeSubscriptions).toLocaleString()}</td>
                    <td>{number(item.currentlyEligibleRecipients).toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-section" aria-labelledby="events-title">
          <div className="section-title"><div><p className="admin-eyebrow">{copy.reconciliation}</p><h2 id="events-title">{copy.recentEvents}</h2></div><span>{events.length}</span></div>
          {events.length === 0 ? <p className="empty-state">{copy.noEvents}</p> : (
            <div className="event-grid">{events.slice().reverse().map((item, index) => {
              const counts = item.counts || {};
              return (
                <article className="event-card" key={text(item.eventId, `event-${index}`)}>
                  <div className="event-card__top"><div><span>{copy.eventId}</span><strong>{text(item.eventId)}</strong></div><StatusPill status={item.status} copy={copy} /></div>
                  <dl>
                    <div><dt>{copy.sourceId}</dt><dd>{text(item.broadcasterId)}</dd></div>
                    <div><dt>{copy.denominator}</dt><dd>{number(item.denominator)}</dd></div>
                    <div><dt>{copy.accepted}</dt><dd>{number(counts.accepted)}</dd></div>
                    <div><dt>{copy.failed}</dt><dd>{number(counts.failed)}</dd></div>
                    <div><dt>{copy.ambiguous}</dt><dd>{number(counts.ambiguous)}</dd></div>
                    <div><dt>{copy.bookkeeping}</dt><dd>{number(counts.bookkeepingPending)}</dd></div>
                  </dl>
                  <div className="event-flags">
                    <span className={counts.countConsistent === true ? 'flag flag--ok' : 'flag flag--warn'}>{counts.countConsistent === true ? copy.consistent : copy.inconsistent}</span>
                    <span className="flag">{counts.terminal === true ? copy.terminal : copy.open}</span>
                  </div>
                </article>
              );
            })}</div>
          )}
        </section>

        <aside className="delivery-banner"><IconLock size={21} stroke={1.8} /><div><h2>{copy.deliveryTitle}</h2><p>{copy.deliveryText}</p></div></aside>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const [language, setLanguage] = useState('en');
  const [state, setState] = useState({ phase: 'loading', dashboard: null, error: '' });
  const [monitorTargets, setMonitorTargets] = useState([]);
  const [monitorBusy, setMonitorBusy] = useState(false);
  const copy = COPY[language];

  const load = useCallback(async () => {
    setState((current) => ({ ...current, phase: current.dashboard ? 'refreshing' : 'loading', error: '' }));
    try {
      const response = await fetch('/api/admin-dashboard', { credentials: 'same-origin', cache: 'no-store' });
      if (response.status === 401) return setState({ phase: 'login', dashboard: null, error: '' });
      const payload = await readJson(response);
      if (!response.ok || !payload || payload.ok !== true || !payload.data) throw new Error('unavailable');
      const monitorResponse = await fetch('/api/admin-monitors', { credentials: 'same-origin', cache: 'no-store' });
      if (monitorResponse.status === 401) {
        setMonitorTargets([]);
        return setState({ phase: 'login', dashboard: null, error: '' });
      }
      const monitorPayload = await readJson(monitorResponse);
      if (!monitorResponse.ok || !monitorPayload || monitorPayload.ok !== true || !Array.isArray(monitorPayload.data)) throw new Error('unavailable');
      setMonitorTargets(monitorPayload.data);
      return setState({ phase: 'ready', dashboard: payload.data, error: '' });
    } catch {
      return setState((current) => ({ phase: current.dashboard ? 'ready' : 'error', dashboard: current.dashboard, error: copy.unavailable }));
    }
  }, [copy.unavailable]);

  const mutateMonitor = useCallback(async (method, channelId, body) => {
    setMonitorBusy(true);
    try {
      const url = channelId
        ? '/api/admin-monitors/' + encodeURIComponent(channelId)
        : '/api/admin-monitors';
      const options = { method, credentials: 'same-origin', cache: 'no-store' };
      if (body !== undefined) {
        options.headers = { 'content-type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      const payload = await readJson(response);
      if (!response.ok || !payload || payload.ok !== true) {
        return { ok: false, error: payload && (payload.message || payload.error) || copy.unavailable };
      }
      await load();
      return { ok: true };
    } catch {
      return { ok: false, error: copy.unavailable };
    } finally {
      setMonitorBusy(false);
    }
  }, [copy.unavailable, load]);

  useEffect(() => { load(); }, [load]);
  const toggleLanguage = () => setLanguage((value) => value === 'en' ? 'zh' : 'en');
  const authenticated = () => load();
  const logout = async () => {
    try { await fetch('/api/admin-logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' }); } catch { /* local state still closes */ }
    setMonitorTargets([]);
    setState({ phase: 'login', dashboard: null, error: '' });
  };
  const view = useMemo(() => {
    if (state.phase === 'login') return <LoginView copy={copy} language={language} onLanguage={toggleLanguage} onAuthenticated={authenticated} />;
    if (!state.dashboard) {
      return <main className="loading-shell"><IconActivityHeartbeat size={28} stroke={1.6} /><p role="status">{state.error || copy.loading}</p><button type="button" onClick={load}>{copy.refresh}</button></main>;
    }
    return <DashboardView copy={copy} language={language} dashboard={state.dashboard} busy={state.phase === 'refreshing'} error={state.error} onRefresh={load} onLogout={logout} onLanguage={toggleLanguage} monitorTargets={monitorTargets} monitorBusy={monitorBusy} onMonitorMutation={mutateMonitor} />;
  }, [copy, language, load, logout, monitorTargets, monitorBusy, mutateMonitor, state]);
  return view;
}

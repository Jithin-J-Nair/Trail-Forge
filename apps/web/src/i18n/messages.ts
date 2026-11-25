export type MessageKey =
  | 'appTagline'
  | 'areaQuery'
  | 'theme'
  | 'duration'
  | 'radius'
  | 'generate'
  | 'cancel'
  | 'locating'
  | 'fetching'
  | 'writing'
  | 'building'
  | 'stops'
  | 'km'
  | 'minutes'
  | 'verifiedBar'
  | 'whyTrusted'
  | 'approve'
  | 'remove'
  | 'exportGeojson'
  | 'exportCsv'
  | 'offline'
  | 'errorRetry'
  | 'language';

export const messages = {
  en: {
    appTagline: 'Plan a themed walking tour from real OpenStreetMap places.',
    areaQuery: 'Area query',
    theme: 'Theme',
    duration: 'Duration (minutes)',
    radius: 'Radius (meters)',
    generate: 'Generate tour',
    cancel: 'Cancel',
    locating: 'Locating area…',
    fetching: 'Fetching map data…',
    writing: 'Writing & verifying…',
    building: 'Building scene…',
    stops: 'stops',
    km: 'km',
    minutes: 'min',
    verifiedBar: '{verified} verified, {needsReview} need review',
    whyTrusted: 'Why is this trusted?',
    approve: 'Approve',
    remove: 'Remove',
    exportGeojson: 'Export GeoJSON',
    exportCsv: 'Export CSV',
    offline: 'You appear offline. Reconnect and retry.',
    errorRetry: 'Something went wrong. Retry?',
    language: 'Language',
  },
  ja: {
    appTagline: 'OpenStreetMapの実在スポットからテーマ散策を計画します。',
    areaQuery: 'エリア',
    theme: 'テーマ',
    duration: '所要時間（分）',
    radius: '半径（メートル）',
    generate: 'ルート生成',
    cancel: 'キャンセル',
    locating: 'エリアを特定中…',
    fetching: '地図データを取得中…',
    writing: '説明を作成・検証中…',
    building: 'シーンを構築中…',
    stops: '地点',
    km: 'km',
    minutes: '分',
    verifiedBar: '検証済み {verified} / 要確認 {needsReview}',
    whyTrusted: 'なぜ信頼できる？',
    approve: '承認',
    remove: '削除',
    exportGeojson: 'GeoJSON出力',
    exportCsv: 'CSV出力',
    offline: 'オフラインのようです。再接続して再試行してください。',
    errorRetry: 'エラーが発生しました。再試行しますか？',
    language: '言語',
  },
} as const satisfies Record<'en' | 'ja', Record<MessageKey, string>>;

export type UiLang = keyof typeof messages;

export function t(lang: UiLang, key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = messages[lang][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function detectLang(): UiLang {
  if (typeof window === 'undefined') return 'en';
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param === 'ja' || param === 'en') return param;
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

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
  | 'language'
  | 'advanced'
  | 'play'
  | 'pause'
  | 'emptyTitle'
  | 'emptyBody'
  | 'emptyHint'
  | 'openDemo'
  | 'saveNeedSignIn'
  | 'saved'
  | 'saveFailed'
  | 'camAerial'
  | 'camFollow';

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
    exportGeojson: 'GeoJSON',
    exportCsv: 'CSV',
    offline: 'You appear offline. Reconnect and retry.',
    errorRetry: 'Something went wrong. Retry?',
    language: 'Language',
    advanced: 'Advanced',
    play: 'Walk route',
    pause: 'Stop walk',
    emptyTitle: 'No city loaded',
    emptyBody:
      'Search an area, pick a theme, and generate a tour from live OpenStreetMap places. We never invent locations.',
    emptyHint: 'Use the panel to start — the 3D scene appears after a real generate.',
    openDemo: 'Open labeled DEMO city',
    saveNeedSignIn: 'Sign in on Profile to save itineraries.',
    saved: 'Itinerary saved',
    saveFailed: 'Could not save itinerary.',
    camAerial: 'Aerial',
    camFollow: 'Follow',
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
    exportGeojson: 'GeoJSON',
    exportCsv: 'CSV',
    offline: 'オフラインのようです。再接続して再試行してください。',
    errorRetry: 'エラーが発生しました。再試行しますか？',
    language: '言語',
    advanced: '詳細設定',
    play: '徒歩で歩く',
    pause: '歩行停止',
    emptyTitle: '都市データがありません',
    emptyBody:
      'エリアとテーマを選んで生成すると、OpenStreetMapの実在スポットからルートを作ります。架空の場所は出しません。',
    emptyHint: '左のパネルから生成してください。実データが届くと3Dが表示されます。',
    openDemo: 'ラベル付きデモ都市を開く',
    saveNeedSignIn: '保存するにはプロフィールでサインインしてください。',
    saved: '旅程を保存しました',
    saveFailed: '旅程を保存できませんでした。',
    camAerial: '俯瞰',
    camFollow: '追従',
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

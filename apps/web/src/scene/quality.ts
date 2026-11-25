export type Quality = 'low' | 'medium' | 'high';

export function probeQuality(): Quality {
  if (typeof window === 'undefined') return 'medium';
  const params = new URLSearchParams(window.location.search).get('quality');
  if (params === 'low' || params === 'medium' || params === 'high') return params;

  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') ||
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  if (!gl) return 'low';
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)).toLowerCase()
    : '';
  if (/swiftshader|llvmpipe|software/i.test(renderer)) return 'low';
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 4) return 'medium';
  return 'high';
}

export function dprForQuality(q: Quality): [number, number] {
  if (q === 'low') return [1, 1];
  if (q === 'medium') return [1, 1.5];
  return [1, 2];
}

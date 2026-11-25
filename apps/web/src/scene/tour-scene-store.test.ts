import { beforeEach, describe, expect, it } from 'vitest';
import { SAMPLE_RESPONSE } from '../fixtures/sample-response.js';
import { useTourSceneStore } from './tour-scene-store.js';

describe('useTourSceneStore', () => {
  beforeEach(() => {
    useTourSceneStore.setState({
      response: null,
      selectedPoiId: null,
      hoveredPoiId: null,
      uiLanguage: 'en',
      status: 'idle',
      errorMessage: null,
    });
  });

  it('stores response and selection', () => {
    useTourSceneStore.getState().setResponse(SAMPLE_RESPONSE);
    useTourSceneStore.getState().setSelectedPoiId('node/1');
    const state = useTourSceneStore.getState();
    expect(state.status).toBe('ready');
    expect(state.response?.pois).toHaveLength(8);
    expect(state.response?.scene.buildings).toHaveLength(400);
    expect(state.selectedPoiId).toBe('node/1');
  });
});

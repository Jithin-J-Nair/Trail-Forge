import { ModelRouter, createProviderRegistry } from '@trailforge/ai-core';

export function createAiRouter() {
  return new ModelRouter(createProviderRegistry(process.env));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const router = createAiRouter();
  console.log('ai-orchestrator scaffold ready', { router: Boolean(router) });
}

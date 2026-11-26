import { VerificationEngine, RuleBasedClaimVerifier } from '@trailforge/domain';

export function createVerificationEngine() {
  return new VerificationEngine(new RuleBasedClaimVerifier());
}

// Service bootstrap placeholder: wire HTTP/gRPC transport, DB fact store, and audit publisher here.
if (import.meta.url === `file://${process.argv[1]}`) {
  const engine = createVerificationEngine();
  console.log('verification-service scaffold ready', { engine: Boolean(engine) });
}

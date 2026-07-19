// Route for GET/POST/PATCH /api/swimmers/:id/consent.
// The handler (auth + club-role gated, service-role writes to swimmer_consent_records)
// already existed in api/_lib/consentHandler.js but was never wired to a route, so
// every consent read/save 404'd — which blocked upload for minor swimmers (the
// consent gate could never be satisfied). This file wires it up.
import { handleSwimmerConsent } from '../../_lib/consentHandler.js';

export default function handler(req, res) {
  return handleSwimmerConsent(req, res);
}

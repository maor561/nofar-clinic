# tests/isolation/

Cross-tenant isolation suite — the executable definition of the critical requirement
(`CLAUDE.md` "כלל הזהב", `docs/ARCHITECTURE.md` §5).

For every endpoint and every id: a session for patient B hitting patient A's data must
get 403/404. Runs in CI and every session. **No new endpoint without an isolation test.**

Populated from WP-03 onward (needs the scoping guard and data layer). Empty in WP-00.

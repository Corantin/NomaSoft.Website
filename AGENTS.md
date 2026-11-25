# CRM feature parity

Every user-facing CRM data operation must also be available through the authenticated MCP endpoint at /api/mcp. When adding or changing an operation, update the UI and MCP in the same change, reuse the same service handlers and validation, and verify both entry points. Preserve optimistic concurrency, idempotency, attachment permissions and the separation between Redis CRM data and spreadsheet time entries.

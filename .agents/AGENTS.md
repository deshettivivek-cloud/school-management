# Workspace Rules — School Management System

## Testing and Verification Cleanup Rule
- **One-Off Test Scripts**: Any test or verification script created for one-time proof-of-work (e.g. `captureBaseline.js`, `testRepositoryLayer.js`, `verifyEvidence.js`) MUST be deleted immediately after output capture and verification is complete. Do NOT commit temporary test scripts to the codebase.
- **Verification Test Data Cleanup**: Any test data rows inserted into databases (master or tenant DBs) during verification MUST be cleaned up via hard `DELETE FROM` immediately after testing completes. Never leave synthetic test rows in production or development databases.

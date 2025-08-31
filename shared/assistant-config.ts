// Central assistant configuration shared between server and client
// Keep this file small and dependency-free so it can be imported from both runtimes.
export const AUTOFILL_CONFIDENCE_THRESHOLD = 0.6;

// Note: To override on the server at runtime, set environment variable
// ASSISTANT_AUTOFILL_THRESHOLD (a number between 0 and 1). The server will
// read that at runtime and may include the effective threshold in the
// assistant response for the client to consume.

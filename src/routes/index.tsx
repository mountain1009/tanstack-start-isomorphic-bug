import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";

/**
 * Bug Reproduction: createIsomorphicFn doesn't work at module top-level
 *
 * When called at module top-level, it returns a FUNCTION instead of the expected value.
 * When called inside a component, it works correctly.
 */

const getEnvironment = createIsomorphicFn()
  .server(() => {
    console.log("[SERVER] getEnvironment called");
    return "server";
  })
  .client(() => {
    console.log("[CLIENT] getEnvironment called");
    return "client";
  });

// BUG: This returns a FUNCTION, not "server" string
const moduleLevel = getEnvironment();
console.log("[MODULE] typeof moduleLevel:", typeof moduleLevel);
console.log("[MODULE] moduleLevel:", moduleLevel);

// Test: Inside Server Function
const testInServerFn = createServerFn().handler(async () => {
  const env = getEnvironment();
  console.log("[SERVER_FN] typeof env:", typeof env);
  console.log("[SERVER_FN] env:", env);
  return {
    value: typeof env === "function" ? "[Function]" : String(env),
    type: typeof env,
  };
});

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: async () => {
    // Test in loader (runs on server during SSR)
    const result = await testInServerFn();
    console.log("[LOADER] Server function result:", result);
    return { serverFnResult: result };
  },
});

function HomeComponent() {
  // This works correctly and returns "client" string
  const componentLevel = getEnvironment();

  // Get server function result from loader
  const { serverFnResult } = Route.useLoaderData();

  const formatValue = (val: unknown): string => {
    if (val === undefined) return "undefined";
    if (val === null) return "null";
    if (typeof val === "function")
      return `[Function: ${(val as { name?: string }).name || "anonymous"}]`;
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>createIsomorphicFn Bug Reproduction</h1>

      <section style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem", borderRadius: "8px" }}>
        <h2>Module Level (BUG)</h2>
        <p>
          <strong>Value:</strong> <code>{formatValue(moduleLevel)}</code>
        </p>
        <p>
          <strong>typeof:</strong> <code>{typeof moduleLevel}</code>
        </p>
        <p style={{ color: typeof moduleLevel === "function" ? "red" : "green" }}>
          {typeof moduleLevel === "function"
            ? "❌ BUG: Returns function instead of string"
            : "✅ OK: Returns string"}
        </p>
      </section>

      <section style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem", borderRadius: "8px" }}>
        <h2>Component Level (Works)</h2>
        <p>
          <strong>Value:</strong> <code>{formatValue(componentLevel)}</code>
        </p>
        <p>
          <strong>typeof:</strong> <code>{typeof componentLevel}</code>
        </p>
        <p style={{ color: typeof componentLevel === "string" ? "green" : "red" }}>
          {typeof componentLevel === "string"
            ? "✅ OK: Returns string"
            : "❌ BUG: Returns non-string"}
        </p>
      </section>

      <section style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem", borderRadius: "8px" }}>
        <h2>Inside Server Function (via loader)</h2>
        <p>
          <strong>Value:</strong> <code>{serverFnResult.value}</code>
        </p>
        <p>
          <strong>typeof:</strong> <code>{serverFnResult.type}</code>
        </p>
        <p style={{ color: serverFnResult.type === "string" ? "green" : "red" }}>
          {serverFnResult.type === "string"
            ? "✅ OK: Returns string"
            : "❌ BUG: Returns non-string"}
        </p>
      </section>

      <section style={{ background: "#fffbeb", padding: "1rem", borderRadius: "8px" }}>
        <h2>Expected Behavior</h2>
        <ul>
          <li>Module level during SSR: "server" (string)</li>
          <li>Module level on client: "client" (string)</li>
          <li>Component level during SSR: "server" (string)</li>
          <li>Component level on client: "client" (string)</li>
        </ul>
        <h2>Actual Behavior</h2>
        <ul>
          <li>Module level: Returns a FUNCTION (bug)</li>
          <li>Component level: Works correctly</li>
        </ul>
      </section>
    </div>
  );
}

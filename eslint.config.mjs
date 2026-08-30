import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // Scoping guard (WP-03): the raw DB handle is off-limits. App and domain code
  // must go through @/modules/core/authz/server (getTherapistDb / getPatientDb).
  // Trusted base — core/data, core/authz, core/auth, core/audit — is exempt, as
  // are tests.
  {
    files: ["app/**/*.{ts,tsx}", "modules/**/*.{ts,tsx}"],
    ignores: [
      "modules/core/data/**",
      "modules/core/authz/**",
      "modules/core/auth/**",
      "modules/core/audit/**",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/modules/core/data/client",
              allowImportNames: ["DbNotConfiguredError"],
              message:
                "Raw DB handle. Get a scoped DB from @/modules/core/authz/server (getTherapistDb / getPatientDb).",
            },
            {
              name: "@/modules/core/data",
              importNames: ["getDb", "schema"],
              message: "Use a scoped DB from @/modules/core/authz/server, not getDb().",
            },
          ],
          patterns: [
            {
              group: ["**/core/data/client", "**/core/data/migrate", "**/core/data/seed"],
              message: "Not reachable from app/domain code — use the scoping guard.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

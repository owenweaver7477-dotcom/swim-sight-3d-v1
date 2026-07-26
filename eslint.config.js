import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
    ],
    ignores: ["src/lib/**/*", "src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      // ⚠️ These two spreads are load-bearing. Without them this `rules` key REPLACES the
      // recommended rulesets spread in above, rather than extending them — which is what
      // was happening: no-undef, no-use-before-define, no-unreachable and even
      // no-const-assign were all NOT SET, so lint was enforcing only the handful of rules
      // written out below. Three runtime-only bugs in one component (two temporal-dead-zone
      // references, one call to a setter that does not exist) passed lint and build because
      // of this. Do not add a rule above these spreads.
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,
      // Using a `const` before its declaration is a ReferenceError at runtime and invisible
      // to the build. It is how a React dependency array can reference a value declared
      // later in the same component. functions:false keeps hoisted function declarations
      // legal, which this codebase relies on.
      "no-use-before-define": ["error", { variables: true, functions: false, classes: true }],
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      // Stylistic only — an apostrophe in JSX text renders correctly. Left off so the
      // rules above that catch real runtime faults are not drowned in 17 copy nits.
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    files: ["src/components/hud/**/*.{js,mjs,cjs,jsx}"],
    rules: {
      // React Three Fiber JSX uses Three.js object properties, not DOM attributes.
      "react/no-unknown-property": "off",
    },
  },
];

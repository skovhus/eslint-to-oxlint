const restrictedImportPaths = [
  {
    name: "react-router",
    importNames: ["Prompt"],
    message: "Please use PromptOnNavigation or usePromptOnNavigation instead",
  },
  {
    name: "react-router",
    importNames: ["useLoaderData"],
    message: "Please use useRouteData from ~/routing/utils/useRouteData instead",
  },
  {
    name: "react-router",
    importNames: ["redirect", "replace"],
    message: "Please import from ~/routing/redirects instead",
  },
  {
    name: "react-use",
    message: "Please import from @linear/orbiter/hooks/react-use instead",
  },
  {
    name: "lodash/uniq",
    importNames: ["default"],
    message: "Please use <array>.distinct() instead",
  },
  {
    name: "date-fns",
    importNames: ["format", "formatRelative"],
    message: "Please use ~/utils/time instead",
  },
  {
    name: "date-fns/format",
    importNames: ["default"],
    message: "Please use ~/utils/time instead",
  },
  {
    name: "date-fns/formatRelative",
    importNames: ["default"],
    message: "Please use ~/utils/time instead",
  },
  {
    name: "lodash",
    importNames: ["default"],
    message: "Please import individual methods instead",
  },
  {
    name: "lodash/uniqWith",
    importNames: ["default"],
    message: "uniqWith is slow and causes performance issues on large workspaces, prefer uniqBy or use a Set",
  },
  {
    name: "@linear/common/auth/ApiRouter",
    message: "Do not import API router code to the client",
  },
  {
    name: "lodash/deburr",
    importNames: ["default"],
    message: "Please use ~/utils/deburr instead",
  },
  {
    name: "zod",
    message: 'Import from "zod/v3" instead',
  },
];

const restrictedImportPatterns = [];

const restrictedSyntax = [
  {
    selector: "MemberExpression[object.property.name='constructor'][property.name='name']",
    message: "'constructor.name' is not reliable after obfuscation.",
  },
  {
    selector: "MemberExpression[object.property.name='modelClass'][property.name='name']",
    message: "'modelClass.name' is not reliable after obfuscation.",
  },
  {
    selector: "MemberExpression[object.name='modelClass'][property.name='name']",
    message: "'modelClass.name' is not reliable after obfuscation.",
  },
];

module.exports = {
  extends: "../.eslintrc.js",
  env: { node: false, browser: true },
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "no-restricted-globals": [
      "error",
      {
        name: "location",
        message: "Get location from useLocation hook instead",
      },
      {
        name: "document",
        message:
          "Use self.document instead. Prevents variable conflicts when using Document model often named document too.",
      },
      {
        name: "open",
        message: "Use self.open instead. Prevents variable conflicts when using arguments / variables named open too.",
      },
    ],
    "no-restricted-syntax": ["error", ...restrictedSyntax],
    "no-restricted-imports": [
      "error",
      {
        patterns: restrictedImportPatterns,
        paths: restrictedImportPaths,
      },
    ],
    "linear-app/no-three-dots": "warn",
    "linear-app/no-anonymous-observer": "warn",
    "linear-app/check-property-decorator": "error",
    "linear-app/svg-jsx-camel-case-attributes": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  overrides: [
    {
      files: ["**/src/editor/**/*.ts", "**/src/editor/**/*.tsx"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    {
      files: ["**/src/views/App/RouteDataLoaders.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              ...restrictedImportPatterns,
              {
                group: ["*/action/*"],
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        "**/src/views/Auth/**/*.ts",
        "**/src/views/Auth/**/*.tsx",
        "**/src/views/Login/**/*.ts",
        "**/src/views/Login/**/*.tsx",
        "**/src/components/ErrorBoundary/**/*.tsx",
        "**/src/components/LoadingDone/*.tsx",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              ...restrictedImportPatterns,
              {
                group: ["*/hooks/useStore"],
                message:
                  "The store might not be available, use getApplicationStore in component or useApplicationStore for views instead",
              },
            ],
            paths: restrictedImportPaths,
          },
        ],
      },
    },
    {
      files: ["**/src/models/*.ts"],
      rules: {
        "no-restricted-imports": [
          "warn",
          {
            patterns: [
              ...restrictedImportPatterns,
              {
                group: ["*components*", "*/views/*"],
              },
            ],
            paths: [
              ...restrictedImportPaths,
              {
                name: "@linear/editor",
                message: "Please import specific modules from @linear/editor/* instead",
              },
            ],
          },
        ],
        "no-restricted-syntax": [
          "error",
          ...restrictedSyntax,
          {
            selector:
              "PropertyDefinition[decorators.length>0][value.type='NewExpression'][value.callee.name='LazyCollection'] > Decorator > CallExpression[callee.name='LazyOneToMany']",
            message:
              "Properties with @LazyOneToMany decorator should not be initialized with new LazyCollection() (the decorator handles lazy initialization)",
          },
          {
            selector:
              "PropertyDefinition[decorators.length>0][value.type='NewExpression'][value.callee.name='Collection'] > Decorator > CallExpression[callee.name='OneToMany']",
            message:
              "Properties with @OneToMany decorator should not be initialized with new Collection() (the decorator handles lazy initialization)",
          },
          {
            selector:
              "PropertyDefinition[decorators.length>0][value.type='NewExpression'][value.callee.name='Collection'] > Decorator > CallExpression[callee.name='ManyToMany']",
            message:
              "Properties with @ManyToMany decorator should not be initialized with new Collection() (the decorator handles lazy initialization)",
          },
          {
            selector:
              "PropertyDefinition[decorators.length>0][value.type='NewExpression'][value.callee.name='LazyCollection'] > Decorator > CallExpression[callee.name='LazyManyToMany']",
            message:
              "Properties with @LazyManyToMany decorator should not be initialized with new LazyCollection() (the decorator handles lazy initialization)",
          },
        ],
      },
    },
  ],
};

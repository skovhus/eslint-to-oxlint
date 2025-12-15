const disabledInEditor =
  process.env.CI || process.env.STRICT_LINT ? "warn" : "off";

const typescriptRules = {
  "@typescript-eslint/array-type": [
    "error",
    {
      default: "array",
    },
  ],
  "@typescript-eslint/dot-notation": "warn",
  "@typescript-eslint/explicit-member-accessibility": [
    "warn",
    {
      accessibility: "explicit",
      overrides: {
        accessors: "explicit",
        constructors: "explicit",
        parameterProperties: "explicit",
      },
    },
  ],
  "@stylistic/ts/indent": "off",
  "@typescript-eslint/member-ordering": "off",
  "@typescript-eslint/naming-convention": "off",
  "@typescript-eslint/no-empty-function": "warn",
  "@typescript-eslint/no-empty-interface": "off",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "warn",
    {
      checksVoidReturn: false,
    },
  ],
  "@typescript-eslint/consistent-type-exports": "warn",
  "@typescript-eslint/no-import-type-side-effects": "warn",
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    { fixStyle: "inline-type-imports", prefer: "type-imports" },
  ],
  "@typescript-eslint/no-misused-new": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": "off", // Too many false positives. See https://github.com/typescript-eslint/typescript-eslint/issues/1410
  "@typescript-eslint/no-var-requires": "error",
  "@typescript-eslint/unified-signatures": "error",
  "@typescript-eslint/no-unused-vars": "off", // disabled the default one
  "unused-imports/no-unused-imports": disabledInEditor, // enabled during the commit hook, but annoying in editor
  "unused-imports/no-unused-vars": [
    "warn",
    {
      vars: "all",
      // TODO: enable "after-used", already enforcing in precommit
      args: "none",
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      ignoreRestSiblings: true,
    },
  ],
  "@typescript-eslint/no-shadow": [
    "warn",
    {
      hoist: "all",
    },
  ],
  "@typescript-eslint/restrict-template-expressions": [
    "error",
    {
      allowNumber: true,
    },
  ],
  // Should fix
  "@typescript-eslint/ban-types": "off", // TODO: enable, enforcing in precommit already
  "@typescript-eslint/no-unsafe-assignment": "off", // TODO: enable, enforcing in precommit already
  "@typescript-eslint/no-unsafe-member-access": "off", // TODO: enable, enforcing in precommit already
  "@typescript-eslint/no-unsafe-call": "off", // TODO: enable, enforcing in precommit already
  "@typescript-eslint/no-unsafe-return": "off", // TODO: enable, enforcing in precommit already
  "@typescript-eslint/unbound-method": "off",
  "@typescript-eslint/no-inferrable-types": "off",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/require-await": "off",
  "@typescript-eslint/ban-ts-comment": "off",
  "@typescript-eslint/prefer-regexp-exec": "off",
  "@typescript-eslint/no-non-null-assertion": "off",
  "@typescript-eslint/restrict-plus-operands": "off",
  "@typescript-eslint/no-namespace": "off",
  "@typescript-eslint/no-duplicate-enum-values": "error",
  "@typescript-eslint/tslint/config": [
    "error",
    {
      rules: {
        ban: [
          true,
          "eval",
          {
            name: ["DataSourceManager", "getDataSource"],
            message:
              "Deadlock possibility! Use context-based db operations instead",
          },
          {
            name: "getRepository",
            message:
              "Deadlock possibility! Use context-based db operations instead",
          },
          {
            name: ["ContextRunner", "createContext"],
            message:
              "Deadlock possibility! See Context.ts how to obtain a context",
          },
          {
            name: ["ContextRunner", "runAnonymousContext"],
            message:
              "Deadlock possibility! See Context.ts how to obtain a context",
          },
          {
            name: ["ContextRunner", "runOrganizationContext"],
            message:
              "Deadlock possibility! Use withOrganizationContext instead",
          },
          {
            name: ["ContextRunner", "runUserContext"],
            message:
              "Deadlock possibility! Use withOrganizationContext instead",
          },
          {
            name: ["ContextRunner", "runTransaction"],
            message:
              "Deadlock possibility! Use withTxOrganizationContext instead",
          },
          {
            name: ["ContextInternal", "asAnonymousContext"],
            message: "Use withAnonymousContext instead",
          },
          {
            name: ["ContextInternal", "asUserAccountContext"],
            message: "Use withUserAccountContext instead",
          },
          {
            name: ["ContextInternal", "asOrganizationContext"],
            message: "Use withOrganizationContext instead",
          },
          {
            name: ["ContextInternal", "asUserContext"],
            message: "Use withUserContext instead",
          },
          {
            name: ["*", "where"],
            message:
              "Use `andWhere` instead to not accidentally override previous conditions",
          },
          {
            name: ["*", "scheduleInEveryRegion"],
            message:
              "Auth service: Task.`scheduleInEveryRegion` only allowed to be used within auth service",
          },
          {
            name: ["*", "scheduleInRegion"],
            message:
              "Auth service: Task.`scheduleInRegion` only allowed to be used within auth service",
          },
          {
            name: ["crypto", "timingSafeEqual"],
            message:
              "Please use safeEqual from @linear/common/utils/crypto.ts instead",
          },
        ],
      },
    },
  ],
};

const generalRules = {
  "prefer-const": "off", // Enabled in precommit
  "prefer-spread": "off", // TODO: enable
  "constructor-super": "error",
  curly: "error",
  "default-case": "error",
  "@stylistic/eol-last": "off",
  eqeqeq: ["error", "always", { null: "ignore" }], // Allow something != null to allow checking if not null or undefined
  "id-denylist": [
    "warn",
    "any",
    "String",
    "string",
    "Boolean",
    "boolean",
    "Undefined",
    "undefined",
  ],
  "id-match": "error",
  "no-template-curly-in-string": "error",
  "no-undef-init": "warn",
  "no-underscore-dangle": "off",
  "no-var": "warn",
  "@stylistic/linebreak-style": "off",
  "no-caller": "error",
  "no-console": "warn",
  "no-debugger": "error",
  "no-duplicate-imports": "error",
  "no-empty": "error",
  "no-eval": "error",
  "no-invalid-this": "off",
  "no-null/no-null": "off",
  "no-redeclare": "off",
  "no-unused-vars": "off",
  "object-shorthand": ["error", "properties"],
  "no-constant-condition": ["error", { checkLoops: false }],
  "no-sequences": ["error", { allowInParentheses: false }],

  // Disable a few eslint:recommended rules
  "no-inner-declarations": "off",
  "no-extra-boolean-cast": "off",
  "no-useless-escape": "off",
  "no-unused-labels": "off",
  "no-case-declarations": "off",
  "no-control-regex": "off",
  "no-prototype-builtins": "off", // TODO: enable
  "import/no-restricted-paths": [
    "error",
    {
      zones: [
        {
          target: "client/src/models",
          from: "client/src/components",
        },
      ],
    },
  ],
};

const excludeDefaultReactProps =
  ":not([key.name='children'],[key.name='className'],[key.name='style'])";

const jsDocRules = {
  "jsdoc/require-jsdoc": [
    "warn",
    {
      // disabled all default things and override in contexts
      require: {
        ArrowFunctionExpression: false,
        ClassDeclaration: false,
        ClassExpression: false,
        FunctionDeclaration: false,
        MethodDefinition: false,
      },
      // enabled in specific contexts, targeting all that relevant to us
      contexts: [
        // all variable exports
        "ExportNamedDeclaration[declaration.type=VariableDeclaration]",
        // all enum exports
        "ExportNamedDeclaration[declaration.type=TSEnumDeclaration]",
        // all namespace exports
        "ExportNamedDeclaration[declaration.type=TSModuleDeclaration]",
        // all function declarations except overloads
        'ExportNamedDeclaration[declaration.type="TSDeclareFunction"]:not(ExportNamedDeclaration[declaration.type="TSDeclareFunction"] + ExportNamedDeclaration[declaration.type="TSDeclareFunction"])',
        'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]:not(ExportNamedDeclaration[declaration.type="TSDeclareFunction"] + ExportNamedDeclaration[declaration.type="FunctionDeclaration"])',
        // class declarations without decorators
        "ClassDeclaration:not([decorators.length > 0])",
        // all default exports
        "ExportDefaultDeclaration",
        // methods and properties on exported types and interfaces
        "ExportNamedDeclaration[declaration.type=TSInterfaceDeclaration]",
        "ExportNamedDeclaration[declaration.type=TSTypeAliasDeclaration]",
        // inline props for exported components
        "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression Identifier[name=/(props|params)$/] TSTypeAnnotation TSMethodSignature",
        `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression Identifier[name=/(props|params)$/] TSTypeAnnotation TSPropertySignature${excludeDefaultReactProps}`,
        "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression ObjectPattern TSTypeAnnotation TSMethodSignature",
        `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression ObjectPattern TSTypeAnnotation TSPropertySignature${excludeDefaultReactProps}`,
        "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > CallExpression > :matches(ArrowFunctionExpression, FunctionExpression) Identifier[name=/(props|params)$/] TSTypeAnnotation TSMethodSignature",
        `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > CallExpression > :matches(ArrowFunctionExpression, FunctionExpression) Identifier[name=/(props|params)$/] TSTypeAnnotation TSPropertySignature${excludeDefaultReactProps}`,
        "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > CallExpression > :matches(ArrowFunctionExpression, FunctionExpression) ObjectPattern TSTypeAnnotation TSMethodSignature",
        `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > CallExpression > :matches(ArrowFunctionExpression, FunctionExpression) ObjectPattern TSTypeAnnotation TSPropertySignature${excludeDefaultReactProps}`,
        "ExportNamedDeclaration > FunctionDeclaration > Identifier[name=/(props|params)$/] TSTypeAnnotation TSMethodSignature",
        `ExportNamedDeclaration > FunctionDeclaration > Identifier[name=/(props|params)$/] TSTypeAnnotation TSPropertySignature${excludeDefaultReactProps}`,
        "ExportNamedDeclaration > FunctionDeclaration > ObjectPattern TSTypeAnnotation TSMethodSignature",
        `ExportNamedDeclaration > FunctionDeclaration > ObjectPattern TSTypeAnnotation TSPropertySignature${excludeDefaultReactProps}`,
        // not exported types and interfaces
        // only ending with *Props or *Params
        // (excluding having "Internal" in the name)
        "TSInterfaceDeclaration[id.name=/(Props|Params)$/][id.name=/^(?!.*Internal).*/] TSMethodSignature",
        `TSInterfaceDeclaration[id.name=/(Props|Params)$/][id.name=/^(?!.*Internal).*/] TSPropertySignature${excludeDefaultReactProps}`,
        "TSTypeAliasDeclaration[id.name=/(Props|Params)$/][id.name=/^(?!.*Internal).*/] TSMethodSignature",
        `TSTypeAliasDeclaration[id.name=/(Props|Params)$/][id.name=/^(?!.*Internal).*/] TSPropertySignature${excludeDefaultReactProps}`,
        // Methods on classes and objects, except overridden and ones that have decorators
        "MethodDefinition[override=false][accessibility=/(public|protected)/]:not([decorators.length > 0]):not([key.name='constructor'])",
        // Properties on classes and objects, except overridden and ones that have decorators
        "PropertyDefinition[override=false][accessibility=/(public|protected)/]:not([decorators.length > 0])",
      ],
      enableFixer: false,
    },
  ],
};

const importRules = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "typeorm",
          importNames: ["BaseEntity", "IsEmail"],
          message:
            "Use Linear specific implementations instead (ClientEntity, BackendEntity, IsEmail)",
        },
        {
          name: "typeorm",
          importNames: [
            "AfterInsert",
            "AfterRemove",
            "AfterSoftRemove",
            "AfterUpdate",
            "BeforeInsert",
            "BeforeRecover",
            "BeforeRemove",
            "BeforeSoftRemove",
            "BeforeUpdate",
            "ManyToOne",
            "OneToOne",
          ],
          message:
            "Use Linear specific implementations instead (beforeInsert, beforeUpdate, etc.)",
        },
        {
          name: "type-graphql",
          importNames: ["Mutation", "Query"],
          message:
            "Please use @AuthorizedMutation or @AuthorizedQuery instead (refer to resolvers/Decorators.ts)",
        },
        {
          name: "node-fetch",
          importNames: ["fetch", "default"],
          message: "Use `fetch` from ~/utils/fetch instead",
        },
        {
          name: "jsonwebtoken",
          message: "Use ~/utils/jsonwebtoken instead",
        },
        {
          name: "zod",
          message: 'Import from "zod/v3" instead',
        },
      ],
      patterns: [
        { group: ["^[\\./]+/common/"] },
        { group: ["@linear/*/src/*"] },
      ],
    },
  ],
  "import/no-cycle": "warn",
  "lodash/import-scope": ["warn", "method"],
  "import/order": [
    "warn",
    {
      groups: [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index",
        "object",
      ],
      pathGroups: [
        {
          pattern: "~/**",
          group: "internal",
        },
        {
          pattern: "@linear/**",
          group: "internal",
          position: "before",
        },
        {
          pattern: "react**",
          group: "external",
          position: "before",
        },
      ],
      pathGroupsExcludedImportTypes: [],
    },
  ],
};

const reactRules = {
  "react/jsx-key": "off",
  "react/jsx-uses-vars": "warn",
  "react/jsx-uses-react": "warn",
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "off", // Enable later,
  "react/jsx-no-target-blank": "error",
};

const nodeRules = {
  "node/no-process-env": "error",
};

const config = {
  env: {
    browser: true,
    es6: true,
  },
  ignorePatterns: [
    "**/.eslintrc.js",
    "**/vite.config.js",
    "!.snaplet",
    "!.github",
    "!.storybook",
    "!.syncpackrc.ts",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    extraFileExtensions: [".json"],
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    "@typescript-eslint",
    "@typescript-eslint/tslint",
    "eslint-plugin-jsdoc",
    "eslint-plugin-import",
    "eslint-plugin-lodash",
    "eslint-plugin-no-null",
    "eslint-plugin-react",
    "eslint-plugin-node",
    "eslint-plugin-react-hooks",
    "import",
    "unused-imports",
    "@stylistic",
  ],
  extends: [
    "eslint:recommended",
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended",
  ],
  rules: {
    ...typescriptRules,
    ...generalRules,
    ...jsDocRules,
    ...reactRules,
    ...importRules,
    ...nodeRules,
    "linear-app/no-function-identifier-in-condition":
      process.env.CI === "true" ? "error" : "off",
  },
  overrides: [
    {
      files: ["**/*.js"],
      env: { node: true },
      parserOptions: {
        ecmaVersion: 6,
        sourceType: "script",
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        ...generalRules,
        ...jsDocRules,
        ...nodeRules,
        "node/no-process-env": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["**/*.{test,bench}.ts", "**/__mocks__/*", "**/jest/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "jsdoc/require-jsdoc": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/dot-notation": "off",
      },
    },
  ],
};

module.exports = config;

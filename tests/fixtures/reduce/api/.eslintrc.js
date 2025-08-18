const rootConfig = require("../.eslintrc");

const noRestrictedImportRules = { ...rootConfig.rules["no-restricted-imports"][1] };

// Do not allow imports from auth service in api
noRestrictedImportRules.patterns = noRestrictedImportRules.patterns.concat([
  {
    group: ["~/services/auth/*", "!~/services/auth/helpers", "!~/services/auth/resolverTypes"],
    message: "Auth service: Importing from auth service not allowed",
  },
]);

// Temporal workflow specific rules, which disallow using modules that can cause non-deterministic behavior
const temporalNoRestrictedImportRules = { ...noRestrictedImportRules };
temporalNoRestrictedImportRules.paths = temporalNoRestrictedImportRules.paths.concat([
  {
    name: "~/logging/Logger",
    importNames: ["Logger"],
    message: "Use this.logger instead of importing Logger directly",
  },
]);

// Allow imports from auth service in tests
const testsNoRestrictedImportRules = { ...noRestrictedImportRules };
testsNoRestrictedImportRules.paths = testsNoRestrictedImportRules.paths.filter(
  path => !path.message?.startsWith("Auth service:")
);
testsNoRestrictedImportRules.patterns = testsNoRestrictedImportRules.patterns.filter(
  pattern => !pattern.message?.startsWith("Auth service:")
);

// Do not allow imports outside auth service in auth service
const authServiceNoRestrictedImportRules = { ...testsNoRestrictedImportRules };
authServiceNoRestrictedImportRules.paths = authServiceNoRestrictedImportRules.paths
  .filter(path => !path.message?.startsWith("Auth service:"))
  .map(path => {
    if (path.name === "typeorm") {
      // Allow direct usage of ManyToOne, OneToMany, OneToOne, and ManyToMany decorators in auth service.
      return {
        ...path,
        importNames: path.importNames?.filter(
          name => !["ManyToOne", "OneToMany", "OneToOne", "ManyToMany"].includes(name)
        ),
      };
    }
    return path;
  })
  .concat([
    {
      name: "~/auth/Context",
      importNames: [
        "UserContext",
        "withUserContext",
        "withNewTxUserContext",
        "withTxUserContext",
        "OrganizationContext",
        "withOrganizationContext",
        "withNewTxOrganizationContext",
        "withTxOrganizationContext",
      ],
      message: "Usage of `UserContext` is not allowed within the auth service",
    },
    {
      name: "~/resolvers/decorators/Decorators",
      importNames: ["AuthenticatedQuery", "AuthenticatedMutation"],
      message: "Usage of `AuthenticatedQuery` and `AuthenticatedMutation` is not allowed within the auth service",
    },
  ]);
authServiceNoRestrictedImportRules.patterns = authServiceNoRestrictedImportRules.patterns
  .filter(pattern => !pattern.message?.startsWith("Auth service:"))
  .concat([
    {
      group: ["~/entity"],
      message: "Auth service: Only authentication specific entities can be used within the auth service",
    },
    {
      group: ["~/filter"],
      message: "Auth service: Only authentication specific filters can be used within the auth service",
    },
    {
      group: ["~/resolvers/*", "!~/resolvers/decorators", "!~/resolvers/validators"],
      message: "Auth service: Only authentication specific resolvers can be used within the auth service",
    },
    {
      group: ["~/routes/*", "!~/routes/base"],
      message: "Auth service: Only authentication specific routes can be used within the auth service",
    },
  ]);

// Allow calls to Task.scheduleInEveryRegion and Task.scheduleInRegion but forbid calls to Task.schedule in auth service.
const authServiceTslintConfigRules = { ...rootConfig.rules["@typescript-eslint/tslint/config"][1] };
authServiceTslintConfigRules.rules = {
  ...authServiceTslintConfigRules.rules,
  ban: (
    authServiceTslintConfigRules.rules?.ban?.filter(
      b => !(typeof b === "object") || !b.message?.startsWith("Auth service:")
    ) || [true, "eval"]
  ).concat([
    {
      name: ["*", "schedule"],
      message:
        "Auth service: Task.`schedule` is not allowed to be called within auth service. Use `scheduleInEveryRegion`",
    },
  ]),
};

// Restricted syntax selectors
const entityRestrictedSyntaxSelectors = [
  {
    selector:
      "CallExpression[callee.name='ManyToOne']>.arguments:nth-child(1)[type='ArrowFunctionExpression'][body.name='OauthClient']",
    message: "Foreign keys to OauthClient will not work correctly across regions.",
  },
  {
    selector:
      "CallExpression[callee.name='OneToOne']>.arguments:nth-child(1)[type='ArrowFunctionExpression'][body.name='OauthClient']",
    message: "Foreign keys to OauthClient will not work correctly across regions.",
  },
  {
    selector: "CallExpression[callee.name='Check']:has(.arguments:nth-child(2))>.arguments:first-child",
    message:
      "Do not use Check constraints with an explicit name, as this will prevent them from being updated when the expression changes.",
  },
];

const taskRestrictedSyntaxSelectors = [
  {
    selector: "Decorator CallExpression[callee.name='Task']",
    message: "Usage of @Task decorator is only allowed in the eventbus/tasks directory.",
  },
  {
    selector: "Decorator CallExpression[callee.name='AnonymousTask']",
    message: "Usage of @AnonymousTask decorator is only allowed in the eventbus/tasks directory.",
  },
  {
    selector: "Decorator CallExpression[callee.name='CronTask']",
    message: "Usage of @CronTask decorator is only allowed in the eventbus/tasks directory.",
  },
];

const processorRestrictedSyntaxSelectors = [
  {
    selector: "Decorator CallExpression[callee.name='Processor']",
    message: "Usage of @Processor decorator is only allowed in the eventbus/processors directory.",
  },
];

module.exports = {
  plugins: ["jest"],
  extends: "../.eslintrc.js",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "linear-app/no-native-fetch": "error",
    "linear-app/no-voiding-entity-save": "error",
    "linear-app/ensure-column-field-property-match": "error",
    "linear-app/check-gql-context": "error",
    "linear-app/no-organization-name-in-emails": process.env.CI === "true" ? "error" : "off",
    "linear-app/ensure-batch-loader-on-relations": "error",
    "linear-app/no-many-to-one-access": "error",
    // Currently disabled in CI while we fix up the codebase
    "linear-app/no-outer-context": "error",
    "react-hooks/rules-of-hooks": "off",
    "no-restricted-imports": ["error", noRestrictedImportRules],
    "no-restricted-syntax": ["error", ...taskRestrictedSyntaxSelectors, ...processorRestrictedSyntaxSelectors],
    "@typescript-eslint/no-inferrable-types": "off", // GraphQl requires explicit types
    // potentially we should enable these rules to align with the rest of the codebase
    "@typescript-eslint/consistent-type-exports": "off",
    "@typescript-eslint/no-import-type-side-effects": "off",
    "@typescript-eslint/consistent-type-imports": ["off", { fixStyle: "inline-type-imports", prefer: "type-imports" }],
  },
  settings: {
    jest: {
      globalAliases: {
        beforeAll: ["beforeAllc"],
        beforeEach: ["beforeEachc"],
        it: ["itc"],
      },
    },
  },
  overrides: [
    {
      files: ["src/temporal/workflows/**/*Workflow.{ts,tsx}"],
      rules: {
        "no-restricted-imports": ["error", temporalNoRestrictedImportRules],
      },
    },
    {
      files: ["src/entity/**/*.{ts,tsx}", "src/services/auth/entity/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-syntax": [
          "error",
          ...taskRestrictedSyntaxSelectors,
          ...processorRestrictedSyntaxSelectors,
          ...entityRestrictedSyntaxSelectors,
        ],
      },
    },
    {
      files: ["src/eventbus/tasks/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-syntax": ["error", ...processorRestrictedSyntaxSelectors, ...entityRestrictedSyntaxSelectors],
      },
    },
    {
      files: ["src/eventbus/processors/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-syntax": ["error", ...taskRestrictedSyntaxSelectors, ...entityRestrictedSyntaxSelectors],
      },
    },
    {
      files: ["src/migrations/**/*.{ts,tsx}"],
      rules: {
        "jsdoc/require-jsdoc": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-member-accessibility": "off",
      },
    },
    {
      files: ["src/services/auth/**/*.*"],
      rules: {
        "linear-app/ensure-batch-loader-on-relations": "off",
        "linear-app/no-batch-loader": "error",
        "no-restricted-imports": ["error", authServiceNoRestrictedImportRules],
        "@typescript-eslint/tslint/config": ["error", authServiceTslintConfigRules],
      },
    },
    {
      files: ["src/jest/**/*.*"],
      rules: {
        "no-restricted-imports": ["error", testsNoRestrictedImportRules],
      },
    },
    {
      files: ["src/**/*.{test,bench}.{ts,tsx}"],
      rules: {
        "jsdoc/require-jsdoc": "off",
        "@typescript-eslint/tslint/config": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "no-restricted-imports": ["error", testsNoRestrictedImportRules],
      },
    },
    {
      files: [
        "src/eventbus/tasks/**/*Task.{ts,tsx}",
        "src/eventbus/processors/**/*Processor.{ts,tsx}",
        "**/__mocks__/*",
      ],
      rules: {
        "jsdoc/require-jsdoc": "off",
      },
    },
    {
      files: ["src/email/emails/**/*.tsx"],
      rules: {
        "no-restricted-syntax": [
          "error",
          ...taskRestrictedSyntaxSelectors,
          ...processorRestrictedSyntaxSelectors,
          {
            selector: "MemberExpression[object.name='organization'][property.name='name']",
            message: "Usage of organization.name is not allowed in emails. Use organization.emailDisplayName instead.",
          },
        ],
      },
    },
  ],
  ignorePatterns: ["src/temporal/workflow-bundle.js"],
};

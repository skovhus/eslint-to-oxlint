# eslint-to-oxlint

Some hacky vibe-coded tools to help migrate from ESLint 8 to Oxlint. You might want to just
upgrade to ESLint 9+ and explore https://github.com/oxc-project/oxlint-migrate


## Usage

Start by cloning this repository and install the dependencies:

```sh
pnpm install
```

### To migrate from ESLint 8 to Oxlint

To migration .eslintrc.js files (and sub packages) to Oxlint:
```sh
npx tsx src/init.ts ../my-project
```

Generates initial Oxlint files (best effort) and dump recommendations around removing rules from ESLint.

### To get rid of ESLint rules when having Oxlint configured

Once you have Oxlint configured alongside ESLint, use the reduce script to find rules you can remove from ESLint (since Oxlint already handles them):

```sh
npx tsx src/reduce.ts ../my-project
```

This analyzes both configs and outputs a report showing which ESLint rules are redundant and can be safely disabled.

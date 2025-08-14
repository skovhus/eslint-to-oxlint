# eslint-to-oxlint

Some hacky vibe-coded tools to help migrate from ESLint (8) to oxlint.


## Usage

Start by cloning this repository and install the dependencies.

### To migrate from ESLint 8 to oxlint

To migration .eslintrc.js files (and sub packages) to oxlint:
```sh
npx tsx src/init.ts ../my-project
```

Generates initial oxlint files (best effort) and dump recommendations around removing rules from ESLint.

### To get rid of ESLint when having oxlint configured.

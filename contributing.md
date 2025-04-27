# Contributing

## Code of Conduct

All interactions in the **npm** organization on GitHub are considered to be covered by the standard [Code of Conduct](https://docs.npmjs.com/policies/conduct).

## Reporting Bugs

Before submitting a new bug report please search for an existing or similar report.

Use one of our existing issue templates if you believe you've come across a unique problem.

Duplicate issues, or issues that don't use one of our templates may get closed without a response.

## Pull Request Conventions

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). This is enforced by commitlint within the codebase.

When opening a pull request please be sure that either the pull request title, or each commit in the pull request, has one of the following prefixes:

- `feat`: For when introducing a new feature. The result will be a new semver minor version of the package when it is next published.
- `fix`: For bug fixes. The result will be a new semver patch version of the package when it is next published.
- `docs`: For documentation updates. The result will be a new semver patch version of the package when it is next published.
- `chore`: For changes that do not affect the published module. Often these are changes to tests. The result will be _no_ change to the version of the package when it is next published (as the commit does not affect the published version).

### Linting

Linting and prettier is also being used. `npm run lint` will check linting errors. `npm run format` will check for any formatting issues

Please make sure linting passes before submitting a PR.

# Contributing to Masterportal

Thank you for your interest in contributing to the Masterportal! This document is the entry point for contributors.

## Code of Conduct

All participants are expected to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Developer Documentation

Our full developer documentation lives in [`docs/Dev/`](./docs/Dev/About.md) and covers:

- **[Setting up your local development environment](./docs/Dev/Contributing/setupDev.md)** — Git, Node.js, proxy configuration, and npm setup
- **[Coding conventions](./docs/Dev/Contributing/codingConventions.md)** — Linting rules, naming, styles, JSDoc, unit tests, i18n, changelog requirements
- **[Git workflow & Definition of Done](./docs/Dev/Contributing/gitWorkflow.md)** — Branching, rebasing, commit messages, PR process, and the checklist your PR must pass
- **[Add-on development](./docs/Dev/Tutorials/addOnsVue.md)** — How to build features as add-ons without modifying the core repository

## Quick Reference

| What | Where |
|---|---|
| Start dev server | `npm start` |
| Run tests | `npm test` |
| Run linter | `npm run lint` |
| Pre-push check (lint + tests) | `npm run prePushHook` |
| Build for production | `npm run build` |

## Asking Questions

If you have questions about using or developing with the Masterportal, visit the [Community board (User forum)](https://discourse.opencode.de/t/ueber-die-kategorie-masterportal-projekt-413/1691).

## Getting Familiar with the Code in the Repository

To get started with the codebase, follow our tutorial: [Masterportal Tutorial](./docs/Dev/Tutorials/tutorial.md)

## How to Contribute

1. **Fork** the repository — external developers do not receive write access. See [Forks](./docs/Dev/Contributing/gitWorkflow.md#forks).
2. **Branch** from `dev` and follow the [Git workflow](./docs/Dev/Contributing/gitWorkflow.md).
3. **Write code** that adheres to the [coding conventions](./docs/Dev/Contributing/codingConventions.md).
4. **Add tests** for new or changed functionality.
5. **Update documentation** — config parameters must be documented in both `config.json.md` (EN) and `config.json.de.md` (DE).
6. **Update the changelog** — add an entry under `Unreleased` in `CHANGELOG.md`.
7. **Open a Pull Request** against `dev`. Reviewers will check against the [Definition of Done](./docs/Dev/Contributing/gitWorkflow.md#definition-of-done).

## Reporting Issues

Use the [Bitbucket Issue Tracker](https://bitbucket.org/geowerkstatt-hamburg/masterportal/issues). Please include:

- A clear description of the problem or feature request
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Browser and Node.js version
- Relevant portal configuration (if applicable)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](License.txt).

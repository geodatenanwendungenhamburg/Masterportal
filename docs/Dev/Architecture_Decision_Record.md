
# Title

Migration of the Bundler in Masterportal - Webpack 4 to Vite

# Issue

The application Masterportal currently uses Webpack 4 as its frontend bundler. With increasing project complexity, long development build times, complex configuration files, and performance limitations (especially during HMR), the current setup no longer meets modern development standards. Additionally, Webpack 4 is outdated and limits long-term sustainability. A strategic decision is required to ensure future-proof, performant, and maintainable build processes.

# Decision

Masterportal will migrate from Webpack 4 to Vite as its new frontend build tool.

# Implemented since Masterportal version

This decision has been implemented since Masterportal version 3.20.0.

# Status

Decided.

# Assumptions

Masterportal is a modern JavaScript/Vue-based application. Another step into the Vue ecosystem, with the advantage that the technologies are more tightly integrated.

Long-term sustainability requires an active community and strong ecosystem support.

Fast development builds and efficient HMR are critical for developer productivity.

Migration effort is acceptable if long-term benefits outweigh short-term costs.

ES Module support is viable for the project environment.

# Constraints

Existing Webpack-specific configurations, plugins, and loaders must be replaced.

Testing setup (currently Mocha + mochapack) must be adjusted or replaced (e.g., with Vitest).

Addons, Vuetify loading, and custom build functions require refactoring.

# Positions

The following bundlers were evaluated:

Webpack 5

Vite

Rollup

Parcel

After comparison (speed, HMR, configuration complexity, plugin ecosystem, community activity, sustainability), Webpack 5 and Vite were shortlisted as the most suitable candidates.

# Argument

Although migrating to Webpack 5 would require less structural change, prototype testing revealed significant breaking changes and persistent configuration complexity.

Vite demonstrated:

Significantly faster dev server startup (via ESBuild)

Superior HMR performance

Native ES Module support

Simpler configuration (defineConfig)

Reduced dependency complexity (no loaders required for most assets)

Strong and rapidly growing community adoption

While the migration effort is slightly higher than upgrading to Webpack 5, Vite provides better long-term maintainability, performance, and developer experience. Therefore, long-term benefits outweigh short-term migration costs.

# Implications

Removal of Webpack-related dependencies and configuration files

Introduction of vite.config.js

Replacement of Webpack plugins with Vite-native solutions

Possible migration from Mocha/mochapack to Vitest

Refactoring of buildFunctions.js

Adaptation of environment variable handling

Improved development speed and smaller production bundles

# Related Decisions

Adjustment of test infrastructure using Vitest instead of Mocha/mochapack

Refactoring of addon and Vuetify loading mechanisms

Related Requirements

Faster development builds

Improved maintainability

Reduced configuration complexity

Sustainable open-source ecosystem

Optimized production bundle size

# Related Artifacts

Branch webpack-test

Branch vite-test

Updated package.json

vite.config.js

Adjusted setupUnitTests.js

Refactored buildFunctions.js

# Notes

Webpack 5 remains a viable fallback option if critical blockers arise during full migration. However, based on technical evaluation, ecosystem trends, and prototype testing, Vite is the strategically preferred solution for Masterportalâ€™s future development.

---
# Title
Migration of the Test Runner in Masterportal

# Issue

The Masterportal currently uses Mocha together with mochapack for unit testing. Mochapack tightly couples the test execution to Webpack, which increases configuration complexity and slows down test runs. With the planned migration to Vite, mochapack is no longer compatible. A modern, Vite-native testing solution is required to ensure fast, maintainable, and future-proof test execution.

# Decision

Masterportal will replace Mocha + mochapack with Vitest as the new unit testing framework.

# Implemented since Masterportal version

Together with the Vite migration in 3.20.0.

# Status

Decided.

# Assumptions

Masterportal is migrating to Vite as its build tool. Another step into the Vue ecosystem, with the advantage that the technologies like vite are more tightly integrated.

Fast test execution is important for developer productivity and CI performance.

The existing test suite can be adapted with moderate refactoring effort.

Compatibility with modern ES Modules is required.

# Constraints

Existing tests are written for Mocha syntax and partially depend on Webpack preprocessing.

setupUnitTests.js requires adjustments (e.g., global â†’ globalThis).


# Positions

The following options were considered:

Keep Mocha without mochapack and adapt manually

Upgrade Mocha-based setup with alternative bundling

Replace with Vitest

Vitest was identified as the most suitable option due to its native integration with Vite.

# Argument

Vitest offers the following advantages:

Native integration with Vite (no external bundler wrapper required)

Significantly faster execution using ESBuild

Built-in TypeScript support

Jest-compatible API, making migration from Mocha manageable

Simplified configuration and reduced tooling complexity

Keeping Mocha would require additional tooling and configuration to work with Vite, increasing maintenance effort. Vitest aligns with the new build architecture and improves performance and developer experience. Therefore, the architectural consistency and long-term maintainability justify the migration effort.

# Implications

Removal of mochapack and related Webpack test configuration

Introduction of Vitest configuration (e.g., within vite.config.js)

Partial refactoring of test files (minor syntax adjustments if required)

Update of package.json test commands

Improved test performance and reduced complexity

# Related Decisions

Migration from Webpack 4 to Vite


# Related Requirements

Faster unit test execution

Reduced tooling complexity

Better integration with modern build tooling

Long-term maintainability

Related Artifacts

Updated package.json

Adjusted setupUnitTests.js

vite.config.js test configuration

# Notes

Vitest provides a future-proof testing strategy aligned with the modern Vite-based architecture of Masterportal. Minor refactoring effort is expected, but overall complexity and maintenance cost will be reduced significantly.

---
# Title
Decommissioning of End-to-End (E2E) Tests in Masterportal

# Issue  
End-to-End (E2E) tests in  Masterportal were originally introduced to validate complete user workflows across the system. However, over time, the E2E test suite became increasingly complex, fragile, and expensive to maintain.  

With the architectural and structural changes introduced up to version 2, the existing E2E tests showed high instability, frequent false positives, and significant maintenance overhead. The effort required to stabilize and adapt the tests to the evolving codebase exceeded their practical benefit in terms of defect detection.  

A reassessment of cost versus value determined that, in their current form, E2E tests were economically inefficient.

# Decision  
The existing E2E test suite will be discontinued as of version 2.  

E2E testing as a quality assurance practice is not permanently abandoned. Instead, the topic will be revisited and re-evaluated in the future with an adapted, more sustainable strategy.

# Implemented since Masterportal version  
3.0.0  

# Status  
Decided  

# Assumptions  
- The complexity of Masterportalâ€™s architecture increased significantly compared to earlier versions.  
- E2E tests required high maintenance effort due to UI changes, asynchronous behavior, and integration dependencies.  
- Unit and integration tests provide more stable and cost-efficient defect detection at the current stage.  
- Development resources are limited and must be allocated efficiently.  

# Constraints  
- Removal of E2E tests reduces full-system automated workflow validation.  
- Critical user journeys are currently covered only by manual testing and lower-level automated tests.  
- Future reintroduction will require tool evaluation and architectural alignment.  

# Positions  
The following options were considered:

- Maintain and refactor the existing E2E test suite  
- Reduce E2E coverage to a minimal critical-path subset  
- Fully discontinue E2E tests for the current version and reassess later  

The third option was selected.

# Argument  
The E2E test suite required disproportionate effort compared to the number of defects detected.  

Key challenges included:
- High flakiness and instability  
- Frequent breakage after UI or configuration changes  
- Long execution times in CI pipelines  
- Complex debugging and maintenance  

Given limited development capacity, continuing investment in the existing E2E setup was considered economically unjustifiable.  

Focusing on stable unit and integration tests provides better costâ€“benefit ratio while maintaining acceptable quality standards.

# Implications  
- CI pipelines are simplified and run faster.  
- Full user workflow validation is reduced.  
- Increased responsibility on integration and manual testing.  
- Future architectural decisions may consider improved testability to enable more stable E2E testing.  

# Related Decisions  
- Strengthening of unit and integration test coverage  
- Tooling modernization within the build and test infrastructure  

# Related Requirements  
- Efficient use of development resources  
- Maintainable and stable automated test infrastructure  
- Sustainable long-term quality assurance strategy  

# Related Artifacts  
- Removal of E2E test directories and configuration  
- CI pipeline adjustments  
- Updated testing documentation  

# Notes  
E2E testing is not permanently rejected.  

A future reintroduction is planned after:
- Stabilization of the new architecture  
- Evaluation of modern E2E tools  
- Definition of a reduced and business-critical test scope  
- Clear costâ€“benefit validation  

The topic remains under strategic consideration.

---


-------------------------------------------------------------------------------------
Template for Architecture Decision Record (ADR)
-------------------------------------------------------------------------------------


# Issue

Describe the architectural or technical issue within the JavaScript application Masterportal that needs to be addressed. Clearly explain why this issue is relevant at this point in the project lifecycle (e.g., scalability challenges, maintainability concerns, performance bottlenecks, framework limitations, or increasing technical debt). Following a minimalist approach, document only the aspects that require clarification or decision-making at this stage of Masterportalâ€™s evolution.

# Decision

Clearly state the chosen technical direction for Masterportal. This may include selecting or replacing a JavaScript framework, defining a state management strategy, restructuring modules, introducing TypeScript, standardizing APIs, or adapting the build and deployment process.

# Implemented since Masterportal version

Specify the Masterportal version in which this decision has been implemented (e.g., since version 3.20.0).

# Status

Indicate the current state of the decision within Masterportal: pending, decided, approved, implemented, or deprecated.

# Assumptions

Describe the assumptions about the technical and organizational environment of Masterportal under which this decision is made. This may include assumptions about supported browsers, Node.js runtime versions, team expertise, project timelines, budget constraints, CI/CD infrastructure, plugin architecture, or integration with external GIS services. Organizational standards (e.g., frontend guidelines, coding conventions, or preferred libraries) may restrict the range of feasible alternatives.

# Constraints

Document any additional technical or organizational constraints introduced by the selected decision for Masterportal. Examples include dependency on a specific framework ecosystem, compatibility limitations with existing modules, performance trade-offs, or reduced flexibility for third-party extensions.

# Positions

List the viable technical alternatives that were evaluated for Masterportal. For example, alternative JavaScript frameworks, architectural patterns (e.g., modular vs. monolithic structure), state management approaches, testing strategies, or bundling and build tools.

# Argument

Explain why the selected option was chosen for Masterportal. Include considerations such as implementation complexity, long-term maintainability, performance impact, ecosystem maturity, developer availability, learning curve, integration effort with existing GIS components, and time to market. The reasoning behind the decision is as important as the decision itself.

# Implications

Describe the consequences of the decision for Masterportal. It may require additional architectural decisions, introduce new technical requirements, modify existing workflows, impact performance or security characteristics, or influence long-term scalability and extensibility. Clearly outline these effects.

# Related Decisions

List other architectural or technical decisions within Masterportal that are directly related to or dependent on this one.

# Related Requirements

Map this decision to the relevant business, functional, or non-functional requirements of Masterportal (e.g., performance targets, maintainability goals, accessibility standards, security requirements, or interoperability with GIS services).

# Related Artifacts

Reference related documentation affected by this decision, such as architecture diagrams, technical concepts, API specifications, coding guidelines, plugin documentation, or backlog items within the Masterportal project.

# Notes

Optional space for additional remarks, context, or implementation hints relevant to the ongoing development of Masterportal.
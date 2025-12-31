# Git Workflow and Commit Guidelines 

## Branch Management

### 1. Branch Naming Convention
All branches should follow a consistent naming convention to clearly indicate their purpose.

| Branch Type | Naming Format                                 | Example                        |
|-------------|-----------------------------------------------|--------------------------------|
| Feature     | `feat/<feature-name>`                         | `feat/add-user-authentication` |
| Bug Fix     | `fix/<bug-name>`                              | `fix/login-error`              |
| Refactor    | `refactor/<refactor-area>`                    | `refactor/database-queries`    |
| Docs        | `docs/<documentation-update>`                 | `docs/api-instructions`        |

### 2. Branching Strategy
- Use `main` (or `master`) for production-ready code only.
- Create a new branch for every feature, bug fix, or documentation update.
- Avoid committing directly to `main`.
- Use **Pull Requests (PRs)** for merging branches into `main`. Ensure all PRs are reviewed before merging.

---

## Commit Message Guidelines

### 1. Commit Message Structure

Each commit message should follow this format:
<keyword>: <concise description> - <author's name>


- **Keyword**: Choose from predefined keywords (listed below).
- **Concise Description**: Briefly describe the change or addition.
- **Author's Name**: Include the name of the committer.

### 2. Commit Keywords

| Keyword   | Description                                                                                   |
|-----------|-----------------------------------------------------------------------------------------------|
| `feat`    | A new feature or enhancement.                                                                 |
| `fix`     | A bug fix.                                                                                     |
| `docs`    | Documentation changes.                                                                         |
| `style`   | Code style changes (formatting, whitespace) with no functional impact.                         |
| `refactor`| Code changes that neither fix a bug nor add a feature (improving structure or readability).    |
| `perf`    | Performance improvements.                                                                      |
| `test`    | Adding or updating tests.                                                                      |
| `chore`   | Other tasks like build process, package management, etc.                                       |
| `ci`      | Changes to Continuous Integration configuration.                                               |
| `revert`  | Reverts a previous commit.                                                                     |

### 3. Commit Message Examples

| Action                                | Commit Message Example                                       |
|---------------------------------------|---------------------------------------------------------------|
| Adding a feature                      | `feat: add user authentication - John Doe`                    |
| Fixing a bug                          | `fix: resolve login error on homepage - Jane Smith`           |
| Updating documentation                | `docs: add API usage instructions - Sarah Lee`                |
| Code refactoring                      | `refactor: improve query performance - Alice Johnson`         |
| Improving performance                 | `perf: optimize image loading for dashboard - Michael Chen`   |
| Adding tests                          | `test: add unit tests for login component - Emily Davis`      |
| CI configuration update               | `ci: add GitHub Actions workflow - Tom Wilson`                |
| Reverting a commit                    | `revert: undo commit abc123 - Chris White`                    |

---

## Best Practices

### 1. Atomic Commits
Each commit should represent one logical change. Avoid combining unrelated changes in a single commit.

### 2. Commit Frequently
Make small, frequent commits to keep track of your changes easily and allow for better debugging.

### 3. Pull Requests and Code Reviews
- Always open a Pull Request to merge changes into `main`.
- PRs should be reviewed and approved before merging.
- Ensure each PR is small and focused on a specific task or feature.

---

## Workflow Example

1. **Create a new branch**:
   ```bash
   git checkout -b feat/user-authentication

2. **Make changes and commit:**:
   ```bash
   git add .
    git commit -m "feat: add login feature - prince"
3. **Push the branch:**
    ```bash
    git push origin feat/user-authentication
4. **Create a Pull Request:**
     - Open a PR for feat/user-authentication into main.
     - Ensure the PR is reviewed and approved before merging.
     - After approval, merge the PR and delete the branch.

   


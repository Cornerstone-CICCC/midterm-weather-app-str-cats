# Project Naming Conventions

This document outlines the standard naming conventions for this Astro project.

## 1. File & Directory Naming
- **Components (`.astro`):** **PascalCase**.
    - *Example:* `Button.astro`, `NavigationMenu.astro`, `ContactForm.astro`.
- **Pages (`.astro`, `.md`):** **kebab-case** (standard for URLs).
    - *Example:* `about-us.astro`, `privacy-policy.md`.
- **Styles (`.css`, `.scss`):** **kebab-case**.
    - *Example:* `main-layout.css`, `variables.css`.
- **Scripts/Utilities (`.ts`, `.js`):** **kebab-case**.
    - *Example:* `auth-helper.ts`, `format-date.js`.
- **Assets (Images, Icons, Fonts):** **kebab-case**.
    - *Example:* `hero-background.jpg`, `close-icon.svg`.
- **Directories:** **kebab-case**.
    - *Example:* `src/components/`, `src/layouts/`, `public/assets/images/`.

---

## 2. HTML & CSS Naming
- **IDs:** Use **kebab-case**. 
    - *Example:* `<div id="main-content">`
- **Classes:** Use **kebab-case**. 
    - *Example:* `.card`, `.card-title`.
- **Astro Component Props:** **camelCase**.
    - *Example:* `<Button labelText="Click Me" isActive={true} />`

---

## 3. JavaScript / TypeScript Naming
- **Variables & Constants:**
    - **Local Variables:** **camelCase**. (`let userCount = 0;`)
    - **Global Constants:** **UPPER_SNAKE_CASE**. (`const API_BASE_URL = '...';`)
- **Functions:** **camelCase**. Names should be action-oriented.
    - *Example:* `fetchData()`, `handleButtonClick()`, `isValidEmail()`.
- **Interfaces & Types:** **PascalCase**.
    - *Example:* `interface UserProfile { ... }`
- **Boolean Variables:** Prefix with `is`, `has`, or `should` for clarity.
    - *Example:* `isLoading`, `hasPermission`, `shouldRender`.

---

## 4. Assets & Images
- **Icons:** Prefix with `icon-`.
    - *Example:* `icon-search.svg`, `icon-facebook.svg`.
- **Images:** Use descriptive names ending with the content type.
    - *Example:* `bg-dark-pattern.webp`, `profile-avatar-placeholder.png`.

---


## 6. Git Branching & Commits
- **Branches:** `feature/description`, `bugfix/description`, `hotfix/description`.
#### Commit Types
- `feat` → New feature
- `fix` → Bug fix
- `refactor` → Code refactor
- `style` → Styling/UI updates
- `perf` → Performance improvements
- `docs` → Documentation changes
- `chore` → Maintenance/config updates
- `deps` → Dependency updates
- `api` → Weather API integration changes
- `assets` → Icons/images/resources
- `routing` → Route/navigation updates
- `wip` → Work in progress
##### Examples
`feat: add weather forecast card`
`fix: resolve city search issue`
`api: integrate OpenWeather API`
`style: improve mobile forecast layout` 
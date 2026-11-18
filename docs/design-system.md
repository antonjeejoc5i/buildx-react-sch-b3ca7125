# Design system

Every screen uses the company design system. BuildX rejects a change that breaks rules 1 to 4.

The variables are in `src/design-system/tokens.css`, already loaded on every page. Never edit that folder.

## Rules

1. Colours only through these variables: no hex, `rgb()`, `hsl()` or colour names.
2. Font families and font sizes only through these variables.
3. Only variables that exist. Never invent a token. A value with no token is a decision for the design team, so report it in your summary.
4. No palette classes from a CSS framework, such as `bg-blue-500`. Write `bg-[var(--component-...)]`, and theme any component library from these variables.
5. Choose in this order: the matching component token, then a semantic token for the role, then a primitive. Use spacing and radius variables for all spacing and corners.
6. Line heights go with the font size of the same name. Set weights with care: the design system gives only labels, so never use a label as `font-weight`.
7. Light is the default. Dark applies with `data-theme="dark"` on the root element, so never hard-code a colour for one theme.
8. Do not repair the source's oddities: keep the spelling `diasabled`. `Brand/600` is brighter than `Brand/500`, and that is intended.

## Decisions still open with the design team

Do not work around these. If a story needs one, say so in your summary.

- The tooltip pair is white on white in Light. Avoid tooltips built from these tokens until this is decided.
- `--component-surface-modal-overlay` is opaque. Do not add opacity to it.
- `--semantic-color-border-default-subtle` is the same light colour in both themes.
- Card description and label text is pale on a white card in Light, and hard to read. Do not use them for text a user must read: use the Subtle or Secondary text tokens.
- In Dark, primary and secondary button text has low contrast. Report it if a project needs Dark.

## Typography

- `var(--primitives-type-font-family-primary)`: "Degular"
- `var(--primitives-type-font-family-secondary)`: "Segoe UI"
- `var(--primitives-type-font-size-heading-1)`: 46px
- `var(--primitives-type-font-size-heading-2)`: 41px
- `var(--primitives-type-font-size-heading-3)`: 36px
- `var(--primitives-type-font-size-heading-4)`: 32px
- `var(--primitives-type-font-size-heading-5)`: 29px
- `var(--primitives-type-font-size-heading-6)`: 26px
- `var(--primitives-type-font-size-title-large)`: 23px
- `var(--primitives-type-font-size-title-medium)`: 20px
- `var(--primitives-type-font-size-title-small)`: 18px
- `var(--primitives-type-font-size-body-large)`: 16px
- `var(--primitives-type-font-size-body-medium)`: 14px
- `var(--primitives-type-font-size-body-small)`: 13px
- `var(--primitives-type-font-size-caption)`: 12px
- `var(--primitives-type-line-height-heading-1)`: 56px
- `var(--primitives-type-line-height-heading-2)`: 52px
- `var(--primitives-type-line-height-heading-3)`: 44px
- `var(--primitives-type-line-height-heading-4)`: 40px
- `var(--primitives-type-line-height-heading-5)`: 36px
- `var(--primitives-type-line-height-heading-6)`: 32px
- `var(--primitives-type-line-height-title-large)`: 32px
- `var(--primitives-type-line-height-title-medium)`: 28px
- `var(--primitives-type-line-height-title-small)`: 24px
- `var(--primitives-type-line-height-body-large)`: 24px
- `var(--primitives-type-line-height-body-medium)`: 20px
- `var(--primitives-type-line-height-body-small)`: 20px
- `var(--primitives-type-line-height-caption)`: 16px

## Spacing

- `var(--primitives-spacing-1)`: 4px
- `var(--primitives-spacing-2)`: 8px
- `var(--primitives-spacing-3)`: 12px
- `var(--primitives-spacing-4)`: 16px
- `var(--primitives-spacing-5)`: 20px
- `var(--primitives-spacing-6)`: 24px
- `var(--primitives-spacing-7)`: 32px
- `var(--primitives-spacing-10)`: 40px
- `var(--primitives-spacing-12)`: 48px
- `var(--primitives-spacing-16)`: 64px
- `var(--primitives-spacing-20)`: 80px
- `var(--primitives-spacing-24)`: 96px
- `var(--primitives-spacing-32)`: 128px
- `var(--primitives-spacing-40)`: 160px
- `var(--primitives-spacing-48)`: 192px
- `var(--primitives-spacing-56)`: 224px
- `var(--primitives-spacing-64)`: 256px

## Radius

- `var(--primitives-radius-xs)`: 2px
- `var(--primitives-radius-sm)`: 4px
- `var(--primitives-radius-md)`: 8px
- `var(--primitives-radius-lg)`: 12px
- `var(--primitives-radius-xl)`: 16px

## Semantic colours

- `--semantic-color-background-default-primary`
- `--semantic-color-background-default-secondary`
- `--semantic-color-background-default-disabled`
- `--semantic-color-background-default-subtle`
- `--semantic-color-background-default-inverse`
- `--semantic-color-text-default-primary`
- `--semantic-color-text-default-secondary`
- `--semantic-color-text-default-subtle`
- `--semantic-color-text-default-disabled`
- `--semantic-color-text-default-inverse`
- `--semantic-color-border-default-primary`
- `--semantic-color-border-default-strong`
- `--semantic-color-border-default-subtle`
- `--semantic-color-border-default-disabled`
- `--semantic-color-icon-primary`
- `--semantic-color-icon-secondary`
- `--semantic-color-icon-disabled`
- `--semantic-color-icon-inverse`
- `--semantic-color-primary-default`
- `--semantic-color-primary-hover`
- `--semantic-color-primary-selected`
- `--semantic-color-primary-light`
- `--semantic-color-primary-subtle`
- `--semantic-color-status-success`
- `--semantic-color-status-warning`
- `--semantic-color-status-error`
- `--semantic-color-status-info`
- `--semantic-color-status-status-light-success`
- `--semantic-color-status-status-light-warning`
- `--semantic-color-status-status-light-error`
- `--semantic-color-status-status-light-info`
- `--semantic-color-background-brand-primary`
- `--semantic-color-background-brand-secondary`
- `--semantic-color-background-brand-subtle`
- `--semantic-color-background-brand-strong`
- `--semantic-color-text-brand-primary`
- `--semantic-color-text-brand-secondary`
- `--semantic-color-text-brand-subtle`
- `--semantic-color-text-brand-strong`
- `--semantic-color-border-brand-primary`
- `--semantic-color-border-brand-strong`
- `--semantic-color-border-brand-subtle`

## Component colours

- **Button:** `--component-button-primary-default-background`, `--component-button-primary-default-text`, `--component-button-primary-hover-background`, `--component-button-primary-hover-text`, `--component-button-primary-selected-background`, `--component-button-primary-selected-text`, `--component-button-primary-disabled-background`, `--component-button-primary-disabled-text`, `--component-button-secondary-default-background`, `--component-button-secondary-default-border`, `--component-button-secondary-default-text`, `--component-button-secondary-hover-background`, `--component-button-secondary-hover-border`, `--component-button-secondary-hover-text`, `--component-button-secondary-selected-background`, `--component-button-secondary-selected-border`, `--component-button-secondary-selected-text`, `--component-button-secondary-disabled-background`, `--component-button-secondary-disabled-border`, `--component-button-secondary-disabled-text`, `--component-button-link-default`, `--component-button-link-hover`, `--component-button-link-selected`, `--component-button-link-disabled`, `--component-button-subtle-default-background`, `--component-button-subtle-default-text`, `--component-button-subtle-hover-background`, `--component-button-subtle-hover-text`, `--component-button-subtle-selected-background`, `--component-button-subtle-selected-text`, `--component-button-subtle-diasabled-background`, `--component-button-subtle-diasabled-text`
- **Input:** `--component-input-background-default`, `--component-input-background-disabled`, `--component-input-border-default`, `--component-input-border-hover`, `--component-input-border-selected`, `--component-input-border-disabled`, `--component-input-border-error`, `--component-input-text-value`, `--component-input-text-placeholder`, `--component-input-text-disabled`, `--component-input-text-help-default`, `--component-input-text-help-error`, `--component-input-label`, `--component-input-icon-default`, `--component-input-icon-focus`, `--component-input-icon-disabled`, `--component-input-divider`
- **Dropdown:** `--component-dropdown-background-default`, `--component-dropdown-background-disabled`, `--component-dropdown-border-default`, `--component-dropdown-border-hover`, `--component-dropdown-border-selected`, `--component-dropdown-border-disabled`, `--component-dropdown-placeholder`, `--component-dropdown-option-background-default`, `--component-dropdown-option-background-hover`, `--component-dropdown-option-background-selected`, `--component-dropdown-option-background-disabled`, `--component-dropdown-option-text-default`, `--component-dropdown-option-text-hover`, `--component-dropdown-option-text-selected`, `--component-dropdown-option-text-disabled`, `--component-dropdown-option-text-secondary`, `--component-dropdown-option-icon-default`, `--component-dropdown-option-icon-hover`, `--component-dropdown-option-icon-selected`, `--component-dropdown-option-icon-disabled`
- **Surface:** `--component-surface-card-bg`, `--component-surface-card-border`, `--component-surface-card-value`, `--component-surface-card-description`, `--component-surface-card-label`, `--component-surface-modal-bg`, `--component-surface-modal-overlay`, `--component-surface-tooltip-bg`, `--component-surface-tooltip-text`
- **Control:** `--component-control-background-unselected`, `--component-control-background-selected`, `--component-control-border-unselected`, `--component-control-border-selected`, `--component-control-icon-checked`, `--component-control-toggle-handle`, `--component-control-toggle-track-off`, `--component-control-toggle-track-on`
- **Nav:** `--component-nav-sidebar-bg`, `--component-nav-item-text`, `--component-nav-item-active-bg`, `--component-nav-item-active-text`, `--component-nav-item-hover-bg`
- **Nav Aids:** `--component-nav-aids-tab-text-active`, `--component-nav-aids-tab-text-inactive`, `--component-nav-aids-tab-border-active`, `--component-nav-aids-tab-border-inactive`, `--component-nav-aids-tab-bg-hover`, `--component-nav-aids-breadcrumb-link`, `--component-nav-aids-breadcrumb-current`, `--component-nav-aids-breadcrumb-separator`
- **Table:** `--component-table-header-bg`, `--component-table-row-border`, `--component-table-row-bg-hover`, `--component-table-text-header`, `--component-table-text-cell`
- **Progress:** `--component-progress-track`, `--component-progress-indicator`
- **Stepper:** `--component-stepper-completed-bg`, `--component-stepper-active-border`, `--component-stepper-inactive-border`, `--component-stepper-line`
- **Loader:** `--component-loader-spinner`
- **Accordion:** `--component-accordion-bg-default`, `--component-accordion-bg-expanded`, `--component-accordion-border`, `--component-accordion-icon`
- **Calendar:** `--component-calendar-bg`, `--component-calendar-date-default-text`, `--component-calendar-date-selected-bg`, `--component-calendar-date-selected-text`, `--component-calendar-date-hover-bg`, `--component-calendar-date-disabled-text`
- **Toast:** `--component-toast-bg`, `--component-toast-border`, `--component-toast-icon-success`, `--component-toast-icon-error`, `--component-toast-icon-warning`, `--component-toast-icon-info`, `--component-toast-text-title`, `--component-toast-text-body`
- **Badges:** `--component-badges-grey-background`, `--component-badges-grey-text`, `--component-badges-brand-background`, `--component-badges-brand-text`, `--component-badges-error-background`, `--component-badges-error-text`, `--component-badges-warning-background`, `--component-badges-warning-text`, `--component-badges-success-background`, `--component-badges-success-text`
- **Slider:** `--component-slider-track-inactive`, `--component-slider-track-active`, `--component-slider-track-disabled`, `--component-slider-handle-background-default`, `--component-slider-handle-background-disabled`, `--component-slider-handle-border-default`, `--component-slider-handle-border-disabled`, `--component-slider-popup-background`, `--component-slider-popup-border`, `--component-slider-popup-text`

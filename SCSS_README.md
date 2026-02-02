# SCSS Configuration for PCF Project

This project is configured to use **Dart Sass** for styling.

## Setup

### Installed Packages
- `sass` (Dart Sass implementation)
- `sass-loader` (Webpack loader for Sass)
- `css-loader` (Webpack loader for CSS)
- `style-loader` (Injects CSS into DOM)

## How It Works

1. **SCSS Files**: Write your styles in `.scss` files (e.g., `CustomTable.scss`)
2. **Compilation**: SCSS is automatically compiled to CSS before building
3. **Import**: Import the compiled `.css` file in your TypeScript/React files

## NPM Scripts

### Build SCSS
```bash
npm run build:scss
```
Compiles all SCSS files to CSS (compressed, no source maps)

### Watch SCSS
```bash
npm run watch:scss
```
Watches SCSS files and automatically recompiles on changes

### Build Project
```bash
npm run build
```
Automatically compiles SCSS and then builds the PCF control

### Start Development
```bash
npm start
```
Compiles SCSS and starts the development server

## File Structure

```
TableGrid/
  ├── CustomTable.tsx     # React component
  ├── CustomTable.scss    # Source SCSS file (edit this)
  └── CustomTable.css     # Compiled CSS (auto-generated, do not edit)
```

## SCSS Features Available

### Variables
```scss
$primary-color: #0078d4;
$spacing: 8px;
```

### Nesting
```scss
.table {
  &-header {
    font-weight: bold;
  }
  &-cell {
    padding: $spacing;
  }
}
```

### Mixins
```scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  @include flex-center;
}
```

### Functions
```scss
@function calculate-rem($px) {
  @return $px / 16 * 1rem;
}

.text {
  font-size: calculate-rem(14);
}
```

### Imports
```scss
@import './variables';
@import './mixins';
```

## Best Practices

1. **Edit SCSS Only**: Always edit `.scss` files, never edit the compiled `.css` files
2. **Run Build**: The `.css` files are automatically generated when you run `npm run build`
3. **Git Ignore**: The compiled `.css` files are ignored in git (only source `.scss` files are tracked)
4. **Organization**: Use partials and imports to organize your styles
5. **Variables**: Define colors, spacing, and other values as variables for consistency

## Example Usage

### In CustomTable.scss
```scss
$primary: #0078d4;

.my-component {
  color: $primary;
  
  &:hover {
    color: darken($primary, 10%);
  }
}
```

### In CustomTable.tsx
```tsx
import "./CustomTable.css"; // Import compiled CSS

export const MyComponent = () => {
  return <div className="my-component">Hello</div>;
};
```

## Troubleshooting

### SCSS not compiling?
Run manually: `npm run build:scss`

### Changes not reflecting?
1. Make sure you saved the `.scss` file
2. Run `npm run build:scss` to recompile
3. Restart the development server

### Build errors?
Check SCSS syntax in your `.scss` files. Sass will show detailed error messages.

## Resources

- [Sass Documentation](https://sass-lang.com/documentation)
- [Dart Sass](https://sass-lang.com/dart-sass)
- [SCSS Syntax Guide](https://sass-lang.com/guide)

# Patch Hunk Editor

A GUI tool designed to edit `.patch` and `.diff` files, allowing you to easily split and manage git hunks.

## Features

- **Hunk Splitting**: Granularly split large git hunks into smaller ones by selecting specific lines.
- **Drag & Drop opening**: Simply drag and drop your patch file into the window to open it.
- **Visual Editor**: Syntax highlighting for added/removed lines.
- **Safe Editing**: Use the visual interface to modify patches without breaking the file format.
- **Project Safety**: Prompts to save changes before closing the application to prevent data loss.

## Installation & Development

This project is built with Electron + Vue 3 + Vite.

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Setup

```bash
npm install
# or
yarn install
```

### Running Locally

```bash
npm run start
# or
yarn run start
```

### Build for Production

```bash
npm run make
# or
yarn run make
```

The output application will be in the `out` directory.

## License

MIT

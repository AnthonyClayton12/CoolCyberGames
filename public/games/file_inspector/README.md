# Malicious File Finder Game

## Overview
The Malicious File Finder is a static web game designed to help users identify potentially malicious files based on various heuristics and a database of known file types. This project is built using React and Vite, providing a fast and modern development experience.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd malicious-file-finder-vite
   ```

2. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm run dev
```
This will start the Vite development server, and you can view the application in your browser at `http://localhost:3000`.

### Building for Production
To create a production build of the application, run:
```
npm run build
```
The built files will be output to the `dist` directory.

## Project Structure
- `index.html`: Main HTML entry point.
- `package.json`: Configuration file for npm.
- `tsconfig.json`: TypeScript configuration file.
- `vite.config.ts`: Vite configuration file.
- `.gitignore`: Specifies files to ignore in Git.
- `README.md`: Documentation for the project.
- `src/`: Contains all source code for the application.
  - `main.tsx`: Entry point for the React application.
  - `App.tsx`: Main application component.
  - `data/`: Contains default files and database entries.
  - `components/`: Contains React components for the game UI.
  - `hooks/`: Custom hooks for managing state and side effects.
  - `utils/`: Utility functions for database interactions and heuristics.
  - `types/`: TypeScript types and interfaces.
  - `styles/`: Global CSS styles.
  - `assets/`: Contains icons and other assets.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
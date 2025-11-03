# ChronoTask

A modern, modular todo application built with React, TypeScript, and Tailwind CSS. Designed with a clean architecture that makes it easy to expand and customize.

## Features

- ✅ Create, read, update, and delete tasks
- 📝 Task descriptions and priorities
- 🏷️ Tags and categorization support
- 💾 LocalStorage persistence
- 🎨 Modern, responsive UI
- 🏗️ Modular architecture for easy expansion

## Technology Stack

- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons

## Architecture

This project follows a modular, feature-based architecture:

```
src/
├── core/              # Core business logic (entities, services, repositories)
├── features/          # Feature modules (tasks, projects, etc.)
├── shared/            # Shared components and utilities
└── infrastructure/    # Technical implementations (storage, state)
```

### Key Design Patterns

- **Repository Pattern**: Abstract data access for easy storage swapping
- **Service Layer**: Business logic separated from UI and data
- **Dependency Injection**: Easy to swap implementations
- **Feature Modules**: Self-contained, plugin-style features

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ChronoTask
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

- **Core**: Domain entities, business logic, and data access interfaces
- **Features**: Self-contained feature modules (tasks, projects, etc.)
- **Shared**: Reusable UI components and utilities
- **Infrastructure**: Technical implementations (state management, storage)

## Expanding the App

The architecture is designed for easy expansion:

1. **Add a new feature**: Create a new folder in `src/features/` following the same pattern
2. **Change storage**: Implement `ITaskRepository` interface and swap via dependency injection
3. **Add new views**: Extend existing feature modules or create new ones
4. **Add filters**: Extend the filter feature module

## License

MIT


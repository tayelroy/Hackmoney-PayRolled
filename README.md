# PayRolled 💸

PayRolled is a modern Web3 payroll management system designed for seamless automation of crypto payments, employee management, and financial reporting.

## 🚀 Tech Stack

- **Frontend**: Vite, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend/DB**: Supabase
- **Visuals**: Framer Motion, Recharts
- **State Management**: Zustand
- **API**: TanStack Query (React Query)

## 📁 Project Structure

- `src/api`: API definitions and Supabase integration
- `src/components`: Reusable UI components
- `src/pages`: Main application views (Dashboard, Employees, History, etc.)
- `src/hooks`: Custom React hooks
- `src/lib`: Utility functions and shared logic
- `supabase/`: Database migrations and Edge Functions

## 🛠 Development Workflow

1.  **Installation**:
    ```bash
    pnpm install
    ```

2.  **Run Locally**:
    ```bash
    npm run dev
    ```

3.  **Linting & Type Checking**:
    ```bash
    npm run lint
    npx tsc --noEmit -p tsconfig.app.json --strict
    ```

## 🔗 Integration Guidelines

### Backend & API
- All new API or Supabase operations should be placed in `src/api`.
- Always export data types along with your API functions (refer to `src/demo.ts` for examples).
- Strictly adhere to established data types when implementing Supabase features.

### Designing UI
- Follow the theme defined in `src/index.css` and `tailwind.config.ts`.
- Complex pages should be broken down into smaller components within their respective `pages/` subdirectories.

---

*Built with ❤️ for the HackMoney Hackathon.*

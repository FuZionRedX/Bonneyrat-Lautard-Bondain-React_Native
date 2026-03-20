# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Health/fitness meal planning app built with **Expo SDK 54** and **Expo Router** (file-based routing). Features user authentication, personalized nutrition recommendations (BMI/BMR), meal planning, and grocery management. Backend is a PHP API.

## Commands

- `npm start` — Launch Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — Platform-specific start
- `npm run lint` — ESLint via `expo lint`
- `npm run reset-project` — Reset to blank Expo template

No test runner is configured.

## Architecture

### Routing (Expo Router — file-based)

`app/` directory defines all routes. `app/(tabs)/` contains the four main tabs: Planner (`index.tsx`), Recipes (`recipes.tsx`), Groceries (`groceries.tsx`), Profile (`profile.tsx`). Additional stack screens live at `app/` root level (profile-setup, health-overview, settings, legal, help-support).

### State Management

Two React Contexts, both wrapped in `app/_layout.tsx`:

- **`ProfileContext`** (`contexts/profile-context.tsx`): Holds user data (email, password, fullName, age, gender, height, weight, goal). Provides `updateProfile()`, `connectProfileByEmail()`, and `logout()`.
- **`MealPlanContext`** (`contexts/meal-plan-context.tsx`): Holds selected meal IDs by category (`selectedByCategory`) and the derived `selectedMeals` list. Shared across Recipes, Planner, and Groceries screens.

### API Layer

`constants/api.ts` defines the base URL (`http://10.0.2.2/health_app` — Android emulator localhost) and typed fetch functions for profile CRUD and login. All endpoints hit a PHP backend.

### Data

`data/meals.json` contains 30+ meals with categories, calories, and ingredient breakdowns. Health calculations (BMI, BMR, caloric needs) are computed inline in `app/(tabs)/recipes.tsx` and `app/(tabs)/index.tsx` (Planner). Groceries page (`app/(tabs)/groceries.tsx`) derives its ingredient list from the selected meals.

### Theming

Light/dark mode support via `constants/theme.ts`, `hooks/use-color-scheme.ts`, and `hooks/use-theme-color.ts`. Theme preference stored in AsyncStorage.

## DÉMARRAGE DE SESSION
1. Lire tasks/lessons.md — appliquer toutes les leçons avant de toucher quoi que ce soit
2. Lire tasks/todo.md — comprendre l'état actuel
3. Si aucun des deux n'existe, les créer avant de commencer

## WORKFLOW

### 1. Planifier d'abord
- Passer en mode plan pour toute tâche non triviale (3+ étapes)
- Écrire le plan dans tasks/todo.md avant d'implémenter
- Si quelque chose ne va pas, STOP et re-planifier — ne jamais forcer

### 2. Boucle d'auto-amélioration
- Après toute correction : mettre à jour tasks/lessons.md
- Format : [date] | ce qui a mal tourné | règle pour l'éviter
- Relire les leçons à chaque démarrage de session

### 3. Standard de vérification
- Ne jamais marquer comme terminé sans preuve que ça fonctionne
- Lancer les tests, vérifier les logs, comparer le comportement
- Se demander : « Est-ce qu'un staff engineer validerait ça ? »

### 4. Exiger l'élégance
- Pour les changements non triviaux : existe-t-il une solution plus élégante ?
- Si un fix semble bricolé : le reconstruire proprement
- Ne pas sur-ingénieriser les choses simples

### 5. Correction de bugs autonome
- Quand on reçoit un bug : le corriger directement
- Aller dans les logs, trouver la cause racine, résoudre
- Pas besoin d'être guidé étape par étape

## PRINCIPES FONDAMENTAUX
- Simplicité d'abord — toucher un minimum de code
- Pas de paresse — causes racines uniquement, pas de fixes temporaires
- Ne jamais supposer — vérifier chemins, APIs, variables avant utilisation
- Demander une seule fois — une question en amont si nécessaire, ne jamais interrompre en cours de tâche

## GESTION DES TÂCHES
1. Planifier → tasks/todo.md
2. Vérifier → confirmer avant d'implémenter
3. Suivre → marquer comme terminé au fur et à mesure
4. Expliquer → résumé de haut niveau à chaque étape
5. Apprendre → tasks/lessons.md après corrections

## APPRENTISSAGES
(Claude remplit cette section au fil du temps)

## Key Conventions

- **TypeScript strict mode** with `@/*` path alias (maps to project root)
- **React Compiler** and **typed routes** enabled in Expo config
- **Inline `StyleSheet.create()`** per component — no shared style files
- **Primary color**: green `#4CAF50`
- **Platform variants**: `.ios.tsx` / `.web.ts` suffixes for platform-specific implementations
- **Safe area**: `react-native-safe-area-context` used for edge-to-edge layouts

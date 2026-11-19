<p align="center">
  <img src="https://img.shields.io/badge/Expo-58-blue?logo=expo" alt="Expo SDK 58" />
  <img src="https://img.shields.io/badge/React_Native-0.88-61DAFB?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-green" alt="Platforms" />
</p>

# VitalSync - Meal Planning App

A health and fitness meal planning app that provides **personalized nutrition recommendations** based on BMI & BMR calculations. Plan your meals, manage your groceries, and track your weekly eating habits — all in one place.

---

## Features

| Feature | Description |
|---------|-------------|
| **Planner** | Plan today or any of the next 6 days, with calorie tracking and over-limit alerts |
| **Recipes** | Smart meal suggestions based on your health profile (BMI/BMR) |
| **Groceries** | Shopping list for the planned day, one line per ingredient across all meals |
| **Profile** | Personal health data, goals, and app settings |
| **Meal History** | Weekly history of planned and past meals |
| **Week Planning** | Apply a suggested combo for the entire week in one tap |
| **Dark Mode** | Full light/dark theme support with persistent preference |

## Tech Stack

- **Framework:** [Expo SDK 58](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Language:** TypeScript (strict mode)
- **State:** React Context API (`ProfileContext`, `MealPlanContext`)
- **Backend:** PHP REST API with MySQL
- **Storage:** AsyncStorage for local preferences
- **Styling:** Inline `StyleSheet.create()` with theme system

## Project Structure

```
📁 app/
├── 📂 (tabs)/
│   ├── index.tsx              # Planner screen
│   ├── recipes.tsx            # Recipes & meal suggestions
│   ├── groceries.tsx          # Grocery list
│   └── profile.tsx            # User profile
├── meal-history.tsx           # Weekly meal history
├── profile-setup.tsx          # Onboarding flow
├── settings.tsx               # App settings
├── help-support.tsx           # Help & support
└── legal.tsx                  # Legal information
📁 contexts/
├── profile-context.tsx        # User data & auth state
└── meal-plan-context.tsx      # Shared meal selections
📁 constants/
├── meals.ts                   # Meal categories, labels, emoji
└── theme.ts                   # Light & dark color tokens
📁 lib/
├── api.ts                     # API layer (PHP backend)
├── nutrition.ts               # BMI / BMR / daily calorie target (tested: npm test)
└── suggest.ts                 # Meal-combo suggestions (tested: npm test)
📁 data/
└── meals.json                 # 30+ meals with ingredients & calories
📁 PHP/
├── save_meal_history.php      # Save daily/weekly plans
├── get_meal_history.php       # Fetch meal history
├── save_profile.php           # Save user profile
├── get_profile.php            # Fetch user profile
├── delete_account.php         # Account deletion
├── change_password.php        # Password change (needs the current password)
├── config.php                 # Headers, CORS, database connection
├── auth.php                   # Password checks for user endpoints
└── health_app.sql             # Database schema (users + meal_history)
```

## Checks

`npm test` runs the unit tests in `lib/` (calorie maths, meal suggestions, meal data). GitHub Actions (`.github/workflows/ci.yml`) runs `tsc`, `expo lint`, `npm test` and a PHP syntax check on every push.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- PHP server with MySQL (e.g. XAMPP) for the backend

### Installation

```bash
# Clone the repository
git clone https://github.com/FuZionRedX/Bonneyrat-Lautard-Bondain-React_Native.git
cd Bonneyrat-Lautard-Bondain-React_Native

# Install dependencies
npm install

# Start the dev server
npm start
```

### Running on a specific platform

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # Browser
```

### Backend Setup

1. Import `PHP/health_app.sql` into your MySQL database
2. Place the `PHP/` files in your web server's document root (e.g. `htdocs/health_app/`)
3. Update `PHP/config.php` with your database credentials

Already imported the database before the language setting existed? Run this once,
or every login fails with "Connection failed":

```sql
ALTER TABLE users ADD COLUMN language varchar(2) DEFAULT NULL;
```

## Team

| Name | GitHub |
|------|--------|
| Olivier Bonneyrat | [@FuZionRedX](https://github.com/FuZionRedX) |
| Victor Bondain | [@VictorB](https://github.com/VictorB) |
| Romain Lautard | [@rominou007](https://github.com/rominou007) |

---

<p align="center">
  Built with <b>Expo</b> & <b>React Native</b> for the ECE Paris Application Development course.
</p>

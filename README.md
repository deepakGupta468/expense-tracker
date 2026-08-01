# 💰 SpendWise — Expense Tracker

Track your daily expenses with budgets, categories, reports, and admin user management.

## Tech Stack
- **Backend:** Spring Boot 3.2, Java 17, Spring Security + JWT, Spring Data JPA, MySQL
- **Frontend:** React 19 (Create React App)

## Project Structure
```
├── src/          # Spring Boot backend
└── spendwise/    # React frontend
```

## Setup

### 1. Database (MySQL)
```sql
CREATE DATABASE expense_tracker_db;
```

### 2. Backend (`/`)
Configure DB credentials in `src/main/resources/application.properties`, then:
```bash
mvn spring-boot:run   # http://localhost:8080
```

### 3. Frontend (`/spendwise`)
```bash
npm install
npm start             # http://localhost:3000
```

## Features
- ✅ JWT register / login
- ✅ Add, edit, delete expenses
- ✅ Categories & monthly budgets (over-budget alerts)
- ✅ Daily / monthly / date-range reports
- ✅ **Admin panel:** view all users, activate/deactivate, delete users

### Create Admin User
Insert directly into MySQL (BCrypt-hash your password, e.g. via bcrypt-generator.com):
```sql
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at)
VALUES ('admin@example.com', '<bcrypt-hash>', 'Admin', 'ADMIN', TRUE, NOW(), NOW());
```

## Tests
```bash
mvn test
```

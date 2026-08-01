# 💰 SpendWise — Expense Tracker

Full-stack personal expense tracker with JWT auth, budgets, reports, and an admin panel for user management.

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2, Java 17, Maven |
| Security | Spring Security + JWT (JJWT 0.11.5) |
| Persistence | Spring Data JPA + Hibernate |
| Database | MySQL 8 (H2 for tests) |
| Frontend | React 19 (Create React App) |
| Utils | Lombok |

## 📁 Project Structure

```
expense-tracker/
├── src/                    # Spring Boot backend
│   ├── main/java/com/expensetracker/
│   │   ├── config/         # Security, CORS
│   │   ├── controller/     # Auth, Expense, Category, Budget, Report, Admin
│   │   ├── dto/            # Request/Response DTOs
│   │   ├── entity/         # User, Role, Expense, Category, Budget
│   │   ├── exception/      # Global exception handling
│   │   ├── repository/     # JPA repositories
│   │   ├── security/       # JWT util + filter
│   │   └── service/        # Business logic
│   └── main/resources/     # application.properties
├── spendwise/              # React frontend
│   └── src/App.js          # Entire SPA (auth, dashboard, admin...)
├── pom.xml
└── README.md
```

## 🚀 Setup & Run

### 1. Prerequisites
- Java 17+, Maven 3.8+
- Node 18+
- MySQL 8+

### 2. Database
```sql
CREATE DATABASE expense_tracker_db;
```

### 3. Backend config
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

# JWT (default values are fine)
app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.expiration=86400000
```

### 4. Run backend
```bash
mvn spring-boot:run    # http://localhost:8080
```

### 5. Run frontend
```bash
cd spendwise
npm install
npm start              # http://localhost:3000
```

## 🔐 Authentication

All endpoints except `/api/auth/**` require a JWT:
```
Authorization: Bearer <token>
```
JWT has **24h expiry**. When a user is deactivated by an admin, their existing tokens stop working immediately.

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → returns JWT |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses` | List all (own) |
| GET | `/api/expenses/{id}` | Get by ID |
| PUT | `/api/expenses/{id}` | Update |
| DELETE | `/api/expenses/{id}` | Delete |
| GET | `/api/expenses/category/{id}` | Filter by category |
| GET | `/api/expenses/date?date=` | Filter by date |
| GET | `/api/expenses/range?startDate=&endDate=` | Date range |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/categories` | Create |
| GET | `/api/categories` | List (own) |
| GET | `/api/categories/{id}` | Get by ID |
| PUT | `/api/categories/{id}` | Update |
| DELETE | `/api/categories/{id}` | Delete |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/budgets` | Set budget |
| GET | `/api/budgets` | List (own) |
| GET | `/api/budgets/monthly?month=&year=` | Budgets for month |
| PUT | `/api/budgets/{id}` | Update |
| DELETE | `/api/budgets/{id}` | Delete |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/daily?date=` | Daily report |
| GET | `/api/reports/monthly?month=&year=` | Monthly report |
| GET | `/api/reports/range?startDate=&endDate=` | Date range report |

### Admin (ADMIN role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/{id}/deactivate` | Deactivate user |
| PUT | `/api/admin/users/{id}/activate` | Activate user |
| DELETE | `/api/admin/users/{id}` | Delete user + their data |

## 🛡️ Roles & Admin

- All new users register as **USER**.
- The **Admin** tab appears in the sidebar only for users with role `ADMIN`.
- Admin can: view all users, activate/deactivate, delete any user (removes their expenses/budgets/categories).

### Create an admin user
Insert directly in MySQL (BCrypt-hash your password first, e.g. at bcrypt-generator.com):
```sql
INSERT INTO users (email, password, full_name, role, is_active, created_at, updated_at)
VALUES ('admin@example.com', '<bcrypt-hash>', 'Admin', 'ADMIN', TRUE, NOW(), NOW());
```

## 🧪 Testing
```bash
mvn test
```

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| Admin tab not visible | DB `role` must be exactly `ADMIN`; restart backend |
| "Cannot login" after admin changes | Ensure `is_active` is `TRUE` in DB |
| Port 8080 already in use | Stop old process, then `mvn spring-boot:run` |
| Frontend shows blank / old UI | `npm start` from `spendwise/`, hard refresh `Ctrl+Shift+R` |
| Deleted user's login still works | Stop — JWT filter blocks deactivated users |

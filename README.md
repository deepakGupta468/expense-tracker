# 💰 Expense Tracker — Spring Boot REST API

A fully-featured RESTful backend for managing personal daily expenses, built with Spring Boot, Spring Security, JWT, and Spring Data JPA.

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Language     | Java 17                             |
| Framework    | Spring Boot 3.2                     |
| Security     | Spring Security + JWT (JJWT 0.11)  |
| Persistence  | Spring Data JPA + Hibernate         |
| Database     | MySQL 8 (H2 for tests)              |
| Build Tool   | Maven                               |
| Utilities    | Lombok                              |

---

## 📁 Project Structure

```
src/main/java/com/expensetracker/
├── ExpenseTrackerApplication.java
├── config/
│   └── SecurityConfig.java
├── controller/
│   ├── AuthController.java
│   ├── ExpenseController.java
│   ├── CategoryController.java
│   ├── BudgetController.java
│   └── ReportController.java
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── ExpenseRequest.java
│   │   ├── CategoryRequest.java
│   │   └── BudgetRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── ExpenseResponse.java
│       ├── CategoryResponse.java
│       ├── BudgetResponse.java
│       └── ReportResponse.java
├── entity/
│   ├── User.java
│   ├── Role.java
│   ├── Expense.java
│   ├── Category.java
│   └── Budget.java
├── exception/
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   └── GlobalExceptionHandler.java
├── repository/
│   ├── UserRepository.java
│   ├── ExpenseRepository.java
│   ├── CategoryRepository.java
│   └── BudgetRepository.java
├── security/
│   ├── JwtUtil.java
│   └── JwtAuthenticationFilter.java
└── service/
    ├── AuthService.java
    ├── ExpenseService.java
    ├── CategoryService.java
    ├── BudgetService.java
    ├── ReportService.java
    └── impl/
        ├── AuthServiceImpl.java
        ├── ExpenseServiceImpl.java
        ├── CategoryServiceImpl.java
        ├── BudgetServiceImpl.java
        └── ReportServiceImpl.java
```

---

## ⚙️ Setup & Configuration

### 1. Prerequisites
- Java 17+
- MySQL 8.0+
- Maven 3.8+

### 2. Database Setup

```sql
CREATE DATABASE expense_tracker_db;
```

### 3. Configure `application.properties`

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_tracker_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.expiration=86400000
```

### 4. Build & Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The server starts at: `http://localhost:8080`

---

## 🔐 Authentication

All endpoints (except `/api/auth/**`) require a Bearer JWT token.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description        | Auth |
|--------|----------------------|--------------------|------|
| POST   | /api/auth/register   | Register user      | ❌   |
| POST   | /api/auth/login      | Login user         | ❌   |

### Expenses
| Method | Endpoint                          | Description               | Auth |
|--------|----------------------------------|---------------------------|------|
| POST   | /api/expenses                    | Create expense            | ✅   |
| GET    | /api/expenses                    | Get all expenses          | ✅   |
| GET    | /api/expenses/{id}               | Get expense by ID         | ✅   |
| PUT    | /api/expenses/{id}               | Update expense            | ✅   |
| DELETE | /api/expenses/{id}               | Delete expense            | ✅   |
| GET    | /api/expenses/category/{id}      | Filter by category        | ✅   |
| GET    | /api/expenses/date?date=         | Filter by date            | ✅   |
| GET    | /api/expenses/range?startDate=&endDate= | Filter by date range | ✅ |

### Categories
| Method | Endpoint               | Description           | Auth |
|--------|------------------------|-----------------------|------|
| POST   | /api/categories        | Create category       | ✅   |
| GET    | /api/categories        | Get all categories    | ✅   |
| GET    | /api/categories/{id}   | Get category by ID    | ✅   |
| PUT    | /api/categories/{id}   | Update category       | ✅   |
| DELETE | /api/categories/{id}   | Delete category       | ✅   |

### Budgets
| Method | Endpoint                             | Description          | Auth |
|--------|--------------------------------------|----------------------|------|
| POST   | /api/budgets                         | Create budget        | ✅   |
| GET    | /api/budgets                         | Get all budgets      | ✅   |
| GET    | /api/budgets/monthly?month=&year=    | Budget by month      | ✅   |
| PUT    | /api/budgets/{id}                    | Update budget        | ✅   |
| DELETE | /api/budgets/{id}                    | Delete budget        | ✅   |

### Reports
| Method | Endpoint                                    | Description          | Auth |
|--------|---------------------------------------------|----------------------|------|
| GET    | /api/reports/daily?date=                    | Daily report         | ✅   |
| GET    | /api/reports/monthly?month=&year=           | Monthly report       | ✅   |
| GET    | /api/reports/range?startDate=&endDate=      | Date range report    | ✅   |

---

## 📬 Sample Postman Requests

### Register
```json
POST /api/auth/register
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

### Create Category
```json
POST /api/categories
Authorization: Bearer <token>
{
  "name": "Food",
  "description": "Groceries and dining",
  "icon": "🍔"
}
```

### Add Expense
```json
POST /api/expenses
Authorization: Bearer <token>
{
  "title": "Lunch",
  "description": "Team lunch",
  "amount": 25.50,
  "expenseDate": "2025-03-10",
  "categoryId": 1
}
```

### Set Budget
```json
POST /api/budgets
Authorization: Bearer <token>
{
  "monthlyLimit": 500.00,
  "month": 3,
  "year": 2025,
  "categoryId": 1
}
```

---

## 🧪 Running Tests

```bash
mvn test
```

---

## 🏗️ Key Design Decisions

- **Layered Architecture**: Controller → Service → Repository
- **DTO Pattern**: Request/Response DTOs prevent direct entity exposure
- **JWT Stateless Auth**: No server-side sessions
- **BCrypt Encryption**: Passwords are never stored in plain text
- **User Scoping**: All queries are scoped to the authenticated user
- **Global Exception Handling**: Consistent error responses via `@RestControllerAdvice`
- **Budget Alerts**: `BudgetResponse.exceeded` field signals overspending

🎁 GiftMatch

GiftMatch is a backend API for organizing gift exchanges between participants.

This project is a TypeScript rewrite of the original GiftMatch backend, rebuilt with PostgreSQL and Prisma ORM while maintaining and improving the core functionality of the application.

The project provides authentication, event management, participant management, gift matching, and special requests.

---

🚀 Features

- 🔐 Admin authentication
- 📧 OTP verification (registration)
- 🔄 Refresh token authentication
- 🔑 Password hashing with bcrypt
- 🎫 Event creation and management
- 👥 Participant management
- 🎁 Gift matching/pick functionality
- 📝 Special requests
- ✅ Request validation with Zod
- 🗄️ PostgreSQL database
- 🔗 Prisma ORM
- 🛡️ Authentication and authorization middleware
- ⚠️ Centralized error handling
- 🧩 Type-safe backend with TypeScript

---

🛠️ Tech Stack

Technology | Purpose
--- | ---
TypeScript | Programming language
Node.js | Runtime environment
Express.js | Backend framework
PostgreSQL | Relational database
Prisma | ORM
Zod | Data validation
JWT | Authentication
bcrypt | Password hashing
Vitest / Supertest | Testing

---

📁 Project Structure

```
giftmatch-ts/
│
├── src/
│   ├── config/          # Prisma client setup
│   ├── controllers/     # Route handlers
│   ├── exceptions/      # Legacy error classes (see src/utils/AppError.ts for the one in active use)
│   ├── generated/        # Prisma client output (git-ignored, created by `npx prisma generate`)
│   ├── middlewares/      # Auth guard, request validation, error handler
│   ├── routes/           # Express routers
│   ├── schemas/          # Zod validation schemas
│   ├── services/         # Email + OTP helpers
│   ├── types/            # Ambient/express type augmentation
│   ├── utils/             # AppError, JWT helpers
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/                # Vitest + Supertest integration tests
├── .env                  # Not committed — see below
├── package.json
├── tsconfig.json
└── README.md
```

---

⚙️ Getting Started

1. Clone the repository

```
git clone <your-repository-url>
cd giftmatch-ts
```

2. Install dependencies

```
npm install
```

3. Configure environment variables

Create a `.env` file in the root directory with the following keys. **These names must match exactly** — the app reads `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`, not `JWT_SECRET`.

```
PORT=8000
NODE_ENV=development

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/giftmatch?schema=public"

ACCESS_TOKEN_SECRET="your_access_token_secret"
REFRESH_TOKEN_SECRET="your_refresh_token_secret"

GMAIL_USER="your_gmail_address@gmail.com"
GMAIL_PASS="your_gmail_app_password"
```

Notes:
- `GMAIL_USER`/`GMAIL_PASS` are used by Nodemailer to send OTP and notification emails via Gmail. Use a Gmail [App Password](https://support.google.com/accounts/answer/185833), not your regular account password.
- Email sending is skipped automatically when `NODE_ENV=test`, so tests don't require valid Gmail credentials.
- Never commit your `.env` file to GitHub.

---

🗄️ Database Setup

Make sure PostgreSQL is installed and running.

Create the `giftmatch` database, then run the Prisma migrations:

```
npx prisma migrate dev
```

Generate the Prisma Client (required before running the app — the client is git-ignored and won't exist right after `npm install`):

```
npx prisma generate
```

---

▶️ Running the Application

Development

```
npm run dev
```

The server starts on the port set in `.env` (defaults to `3000` if `PORT` is not set; the example above uses `8000`).

Production

Build the project:

```
npm run build
```

Then start the application:

```
npm start
```

---

🧪 Testing

```
npm test
```

Runs the Vitest + Supertest integration suite against your configured `DATABASE_URL`. Email sending is stubbed out when `NODE_ENV=test`.

---

📚 API Documentation

There's no live Swagger/OpenAPI docs endpoint yet. See `GiftMatch-API-Docs.md` for the full endpoint reference (request/response shapes, auth requirements, and known quirks frontend consumers should account for).

---

🔐 Authentication

GiftMatch uses JWT-based authentication.

The authentication flow includes:

1. Admin registration
2. OTP verification (by email)
3. Login → returns an access token in the response body and sets a refresh token as an httpOnly cookie
4. Access token authentication (`Authorization: Bearer <token>`, expires in 30 minutes)
5. Refresh token (`POST /auth/refresh-token`, cookie-based, valid 7 days)
6. Protected routes (`protect` middleware)

> ⚠️ **Known gap:** `POST /auth/forgot-password` sends a password-reset OTP by email, but there is currently no endpoint to submit that OTP and set a new password. The reset flow is not yet complete end-to-end — see Future Improvements.

Example:

```
Authorization: Bearer <access-token>
```

---

📌 Main API Modules

Authentication

Handles account creation and authentication: register, verify OTP, resend OTP, login, refresh token, logout, request a password-reset OTP.

Events

Admins can create and manage gift exchange events: create, list, get one, update, delete. Events are scoped to the admin who created them for update/delete; `GET /event/:id` currently does not check ownership.

Participants

Added when an event is created (as a comma-separated list on the request), used throughout the gift-matching process. Identified by name — there is no separate participant login.

Pick

Handles the gift-matching process: a participant confirms their name is on the list, then submits a pick. Once every participant has picked, the event is auto-closed and the admin gets a completion email.

Special Requests

Participants can submit a note to the event admin about what they'd like to receive.

---

🧪 Validation

Request validation is handled using Zod and runs before requests reach the controller. Note: `PATCH /event/:id` does not currently go through a validation schema — send only the fields you intend to change.

Example:

```ts
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

---

🛡️ Error Handling

The application uses centralized error handling via `src/middlewares/errorHandler.ts`.

- Validation failures (Zod) return `400` with `{ success: false, errors: [{ field, message }] }`.
- Known application errors (`AppError`) return their configured status code with `{ message }`.
- Unexpected errors (including raw database errors, e.g. a foreign-key constraint violation) fall through to a generic `500 { message: "Something went wrong" }` — check the server logs for the real cause.

---

🗃️ Prisma

Prisma is used as the ORM for interacting with PostgreSQL.

The Prisma schema is located at `prisma/schema.prisma`. The generated client outputs to `src/generated/prisma` (git-ignored — run `npx prisma generate` after every `npm install` or schema change).

---

🔄 Database Migrations

To create a new migration during development:

```
npx prisma migrate dev --name <migration-name>
```

To generate Prisma Client:

```
npx prisma generate
```

To inspect the database using Prisma Studio:

```
npx prisma studio
```

---

🧑‍💻 Development

Run TypeScript type checking with:

```
npm run type-check
```

Build the application with:

```
npm run build
```

---

🌱 Learning Goals

This project was also used as a practical exercise in migrating a JavaScript backend to a strongly typed TypeScript architecture.

Through the rewrite, the project provided hands-on experience with:

- TypeScript
- Prisma ORM
- PostgreSQL
- Database migrations
- Relational data modeling
- Type-safe controllers
- Zod validation
- Authentication
- REST API development
- Error handling

---

🔮 Known Issues & Future Improvements

- [ ] Complete the password-reset flow (submit OTP + new password)
- [ ] Add validation schema to `PATCH /event/:id`
- [ ] Handle FK-constraint errors on event delete (e.g. events with special requests) with a clean 400 instead of a 500
- [ ] Validate `deadline` is after `startDate` on event creation
- [ ] Scope `GET /event/:id` to the requesting admin
- [ ] Automated CI pipeline
- [ ] Rate limiting
- [ ] Redis caching
- [ ] Background jobs
- [ ] Docker support
- [ ] Live API documentation (Swagger/OpenAPI)
- [ ] Improved API monitoring and logging

---

👨‍💻 Author

Ayomide Akinniyi

Backend Developer focused on building scalable and reliable APIs with Node.js, TypeScript, PostgreSQL, and related backend technologies.

---

⭐ Acknowledgements

GiftMatch started as a JavaScript/MongoDB backend project and was later rewritten using TypeScript, PostgreSQL, and Prisma to improve type safety, database structure, and maintainability.

If you find the project useful, feel free to ⭐ the repository.

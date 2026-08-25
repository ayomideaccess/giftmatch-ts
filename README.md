🎁 GiftMatch

GiftMatch is a backend API for organizing gift exchanges between participants.

This project is a TypeScript rewrite of the original GiftMatch backend, rebuilt with PostgreSQL and Prisma ORM while maintaining and improving the core functionality of the application.

The project provides authentication, event management, participant management, gift matching, special requests, validation, and API documentation.

---

🚀 Features

- 🔐 Admin authentication
- 📧 OTP verification
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
- 📚 Swagger API documentation
- 🧩 Type-safe backend with TypeScript

---

🛠️ Tech Stack

Technology| Purpose
TypeScript| Programming language
Node.js| Runtime environment
Express.js| Backend framework
PostgreSQL| Relational database
Prisma| ORM
Zod| Data validation
JWT| Authentication
bcrypt| Password hashing
Swagger| API documentation

---

📁 Project Structure

GiftMatchTS/
│
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── schemas/
│   ├── utils/
│   ├── generated/
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md

---

⚙️ Getting Started

1. Clone the repository

git clone <your-repository-url>

Navigate into the project:

cd GiftMatchTS

---

2. Install dependencies

npm install

---

3. Configure environment variables

Create a ".env" file in the root directory:

PORT=8000

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/giftmatch?schema=public"

JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_token_secret"

Add any other environment variables required by the application.

«Never commit your ".env" file to GitHub.»

---

🗄️ Database Setup

Make sure PostgreSQL is installed and running.

Create the "giftmatch" database, then run the Prisma migrations:

npx prisma migrate dev

Generate the Prisma Client:

npx prisma generate

---

▶️ Running the Application

Development

npm run dev

The server should start on:

http://localhost:8000

Production

Build the project:

npm run build

Then start the application:

npm start

---

📚 API Documentation

GiftMatch uses Swagger/OpenAPI for API documentation.

Once the server is running, the Swagger documentation can be accessed at:

http://localhost:8000/api-docs

The documentation provides information about available endpoints, request bodies, authentication requirements, and responses.

---

🔐 Authentication

GiftMatch uses JWT-based authentication.

The authentication flow includes:

1. Admin registration
2. OTP verification
3. Login
4. Access token authentication
5. Refresh token authentication
6. Protected routes

Protected endpoints require a valid access token.

Example:

Authorization: Bearer <access-token>

---

📌 Main API Modules

Authentication

Handles account creation and authentication.

Typical operations include:

- Register
- Verify OTP
- Resend OTP
- Login
- Refresh token
- Logout

---

Events

Admins can create and manage gift exchange events.

Event functionality includes:

- Create event
- Get events
- Get a single event
- Update event
- Delete event

---

Participants

Participants can be associated with events and used in the gift matching process.

---

Pick

The Pick functionality handles the gift-matching process between participants.

It allows participants to be matched with the person they are expected to buy a gift for.

---

Special Requests

Participants can submit special requests related to their gift exchange.

---

🧪 Validation

Request validation is handled using Zod.

Validation is performed before requests reach the relevant controller, helping ensure that invalid data is rejected early.

Example:

const schema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

---

🛡️ Error Handling

The application uses centralized error handling to provide consistent API responses.

Errors are handled through middleware rather than implementing separate error-handling logic in every controller.

---

🗃️ Prisma

Prisma is used as the ORM for interacting with PostgreSQL.

The Prisma schema is located at:

prisma/schema.prisma

Common Prisma operations used throughout the application include:

- Creating records
- Reading records
- Updating records
- Deleting records
- Working with relationships
- Filtering records
- Selecting related data

---

🔄 Database Migrations

To create a new migration during development:

npx prisma migrate dev --name <migration-name>

To generate Prisma Client:

npx prisma generate

To inspect the database using Prisma Studio:

npx prisma studio

---

🧑‍💻 Development

Run TypeScript type checking with:

npm run type-check

Build the application with:

npm run build

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
- API documentation

---

🔮 Future Improvements

Possible future improvements include:

- [ ] Automated unit and integration tests
- [ ] Improved test coverage
- [ ] Rate limiting
- [ ] Redis caching
- [ ] Background jobs
- [ ] Email notification system
- [ ] Docker support
- [ ] CI/CD pipeline
- [ ] Improved API monitoring and logging

---

👨‍💻 Author

Ayomide Akinniyi

Backend Developer focused on building scalable and reliable APIs with Node.js, TypeScript, PostgreSQL, and related backend technologies.

---

⭐ Acknowledgements

GiftMatch started as a JavaScript/MongoDB backend project and was later rewritten using TypeScript, PostgreSQL, and Prisma to improve type safety, database structure, and maintainability.

If you find the project useful, feel free to ⭐ the repository.

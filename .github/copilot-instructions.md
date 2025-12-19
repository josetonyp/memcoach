# Planventure — Copilot instructions

Quick, actionable guidance for coding agents working on this repository.

## Project overview
- Two main parts:
  - `planventure-api` — Flask REST API (SQLite by default) serving endpoints under `/auth` and `/api` (see `app.py` and `routes/`).
  - `planventure-client` — React + Vite frontend calling the API (see `src/services/api.jsx` and `src/services/tripService.jsx`).

## How to run locally (exact commands)
- Backend (from repository root):
  - python -m venv venv && source venv/bin/activate
  - pip install -r planventure-api/requirements.txt
  - copy and edit environment variables: `cp planventure-api/.env.example planventure-api/.env` (set `JWT_SECRET_KEY`, `DATABASE_URL` if needed)
  - initialize DB: `python planventure-api/init_db.py` (creates SQLite DB and tables)
  - start server: either `python planventure-api/app.py` or set `FLASK_APP=app.py && flask run` (server listens on port 5000)

- Frontend:
  - cd planventure-client && npm install
  - (optional) set Vite env: `VITE_API_URL=http://localhost:5000` — note: current code uses a hard-coded `BASE_URL` in `src/services/api.jsx`.
  - start dev server: `npm run dev` (default port 5173)

## Tests & lint
- Backend tests use pytest: run from `planventure-api` directory: `pytest -q`.
- Frontend linting: `cd planventure-client && npm run lint` (ESLint config in `planventure-client/eslint.config.js`).

## Important implementation details & patterns (do not change without tests)
- Authentication
  - JWT tokens are created with `User.generate_auth_token()` using `create_access_token(identity=str(self.id))` (see `models/user.py`).
  - Protected endpoints use a custom `@auth_middleware` (see `middleware/auth.py`) which calls `verify_jwt_in_request()` and checks `User.query.get(get_jwt_identity())`.
  - Client stores token in `localStorage` under key `token` and sends `Authorization: Bearer <token>` (see `src/services/api.jsx`).

- API route layout
  - `routes/auth.py` exposes `/register` and `/login` (payload examples in `planventure-api/README.md`).
  - `routes/trips.py` serves CRUD under `/api/trips` (GET all, POST create, GET/PUT/DELETE `/api/trips/<id>`). GET `/api/trips` returns JSON with `trips: []`. GET `/api/trips/<id>` returns a single trip object.
  - Note: response shapes vary (e.g., create returns `{'message','trip_id'}`; clients handle some inconsistencies in `tripService`).

- Data & DB
  - SQLAlchemy models: `models/user.py` and `models/trip.py`. Trip stores `itinerary` as JSON.
  - Database migration tooling (`Flask-Migrate`) is listed in requirements but no migrations directory is present—database is initialized via `init_db.py`.

- Utility code
  - Passwords hashed with bcrypt in `utils/password.py`.
  - Email/username validation in `utils/validators.py` with unit tests in `utils/test_validators.py`.
  - Default itinerary generator in `utils/itinerary.py` (used when creating/updating trips if `itinerary` not provided).

## Integration points & environment
- Environment: `planventure-api/.env.example` lists `CORS_ORIGINS`, `JWT_SECRET_KEY`, `DATABASE_URL`.
- Client <-> API: front-end expects API base at `http://localhost:5000` and uses `Authorization` header. Update `src/services/api.jsx` to use `import.meta.env.VITE_API_URL` if you want environment-driven URLs.

## Common gotchas & debugging tips
- Token identity is stored as a string in JWT identity — middleware expects an ID it can query with `User.query.get(...)` (type conversion edge cases may appear).
- CORS is configured in `config.py` and individual routes use `@cross_origin(...)` in `routes/trips.py`.
- Use `curl` or Postman to reproduce API flows (example):
  - Register: `curl -X POST http://localhost:5000/auth/register -d '{"email":"x","password":"y"}' -H 'Content-Type: application/json'`
  - Login: `curl -X POST http://localhost:5000/auth/login ...` → use returned token for `Authorization: Bearer <token>` on `/api/trips` requests.

## Where to look for examples & tests
- API endpoints & examples: `planventure-api/routes/*.py` and `planventure-api/README.md`.
- Client API usage: `planventure-client/src/services/api.jsx` and `tripService.jsx`.
- Unit tests: `planventure-api/utils/test_validators.py` (pytest).

---
If any section is unclear or you'd like me to add examples for a specific workflow (e.g., CI, GitHub Actions, or refactor notes), tell me which area to expand. ✅

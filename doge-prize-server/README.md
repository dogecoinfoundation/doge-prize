# Doge Prize Server

A Next.js server application for managing Dogecoin doge prizes and redemption codes.

## Features

- Manage prizes (create, view, update, delete)
- Authentication system with secure session management
- Comprehensive audit logging for all actions
- SQLite database for data persistence
- Real-time prize status updates
- Dogecoin Core wallet integration for prize transfers
- Wallet balance monitoring and required balance calculation

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Dogecoin Core node (for wallet functionality)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
# Generate Prisma client and run migrations
npx prisma migrate dev

# Initialize the database with a user (no password set)
npm run init-db
```

3. Configure environment variables (create `.env`):
```bash
# Database Configuration
DATABASE_URL="file:./prisma/dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3644"

# Dogecoin RPC Configuration
DOGECOIN_RPC_HOST="127.0.0.1"
DOGECOIN_RPC_PORT="22555"
DOGECOIN_RPC_USER="your_rpc_user"
DOGECOIN_RPC_PASSWORD="your_rpc_password"
```

4. Start the development server:
```bash
npm run dev
```

The server will run on [http://localhost:3644](http://localhost:3644).

### Database Management

The server uses SQLite with Prisma as the ORM. Here are some useful commands:

- View database in Prisma Studio:
```bash
npx prisma studio
```

- Reset the admin password (deletes existing user and creates a new one without password):
```bash
npm run reset-password
```

- Initialize a fresh database (if needed):
```bash
npm run init-db
```

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - User login/logout (NextAuth.js endpoint)
- `GET /api/auth/check-password` - Check if password is set
- `POST /api/auth/set-password` - Set or update admin password

### Prizes
- `GET /api/prizes` - List all prizes
- `POST /api/prizes` - Create a new prize
- `GET /api/prizes/required-balance` - Calculate required balance for active prizes

### Redemption
- `POST /api/redeem` - Redeem a prize using a redemption code

### Transfer
- `POST /api/transfer` - Transfer DOGE to a wallet address using a redemption code

### Wallet
- `GET /api/wallet/balance` - Get wallet balance and address information
- `POST /api/wallet/balance` - Get balance for a specific address

### Audit Logs
- `GET /api/audit` - View audit logs (with optional entityType and entityId query params)

### System
- `GET /api/db-status` - Check database status and configuration
- `GET /api/hello` - Simple health check endpoint

## Database Schema

### Models
- `Prize`: Stores prize information including amount, redemption code, and status (Available/Redeemed/Transferred)
- `User`: Manages user authentication
- `AuditLog`: Tracks all system actions

### Prize Status Flow
1. **Available**: Prize is created and ready for redemption
2. **Redeemed**: Prize has been redeemed but not yet transferred
3. **Transferred**: Prize has been transferred to the winner's wallet

### Testing

The project includes Jest testing setup:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
```

This will create an optimized production build in the `.next` directory.
# POS Gereja

A modern, functional Point of Sale (POS) system built specifically for Church administration and cashier needs, utilizing the Next.js App Router, Prisma ORM, Vercel Postgres, NextAuth, Zustand, and Shadcn UI.

## Features

- **Role-Based Access Control**: Admin and Cashier roles with distinct dashboard views and permissions.
- **Product Management**: Track inventory, set buying/selling prices, and receive low-stock alerts.
- **Cashier POS Flow**: Dual-panel POS transaction screen with split payment support (Cash, QRIS, Bank Transfer, E-Wallet).
- **Public Storefront & Purchase Orders**: Publicly accessible catalog for users to submit orders for Admin approval.
- **Reporting & Analytics**: Real-time sales data, Recharts visualizations, and Excel/PDF export capabilities.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (hosted on Vercel Postgres)
- **ORM**: Prisma Client v7
- **Authentication**: NextAuth.js (v4) with JWT
- **State Management**: Zustand
- **Styling & UI**: Tailwind CSS, Shadcn UI, Recharts

## Environment Variables

Create a `.env` file referencing the `.env.example` structure setup:

```env
# Vercel Postgres
DATABASE_URL="postgres://..."
DATABASE_URL_UNPOOLED="postgres://..."

# Next Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Getting Started Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Push Schema to Database:
   ```bash
   npx prisma db push
   ```
4. Seed Initial Data (Admin Account & Categories):
   ```bash
   npx prisma db seed
   ```
5. Start Development Server:
   ```bash
   npm run dev
   ```

Default Admin Account:
- **Email**: `admin@posgereja.com`
- **Password**: `admin123`

## Deployment

The application is configured to be seamlessly deployed on Vercel. 
Ensure your Vercel project environment variables include `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.

```bash
vercel --prod
```

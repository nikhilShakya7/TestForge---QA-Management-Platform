This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Neon database

The project uses Neon Postgres through Prisma. After signing in to the Neon CLI,
initialize and deploy the configured Neon project to pull its connection strings
into the existing `.env` file (or `.env.local` if `.env` does not exist):

```bash
npx neon@latest init -y --org-id org-dry-resonance-57053162 --project-id polished-cloud-16428697 --branch production --services postgres
npx neon@latest deploy
npm run db:push
npm run db:seed
```

Prisma uses the pooled `DATABASE_URL` for application queries and the direct
`DATABASE_URL_UNPOOLED` connection for schema changes. The seed command is
optional and inserts sample QA data.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# TestForge---QA-Management-Platform

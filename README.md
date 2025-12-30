# Coffee Dashboard (Dummy)

A lightweight Next.js (App Router) dashboard for a coffee shop in Libya:
- Track **Money In** and **Money Out**
- Monthly filter + daily totals
- Add / edit / delete entries (local state, dummy)
- Supplier invoices with status (paid / unpaid / partial)
- Export CSV (ledger + suppliers)
- 2 languages: English + Arabic (RTL on Arabic)

## Run locally

```bash
npm install
npm run dev
```

Open:
- http://localhost:3000/en
- http://localhost:3000/ar


## Part 3
- Products + Quick Sale with recipes
- Inventory (ingredients) + receiving stock creates expense entry
- Recipes (BOM) per product
- Profit report (Revenue/COGS/Profit)


## Backend connection (Part 4)
Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
Then run `npm run dev`.
Login at `/{locale}/login`.


## Part 5 (Backend integration)
When logged in, Ingredients/Recipes/Inventory are loaded from the backend and inventory receive/adjust operations call the backend endpoints.


## Part 6
Sales + Ledger + Supplier invoices are connected to backend. Quick Sale will POST /api/sales and refresh data.

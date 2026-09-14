# sms-campaign-dashboard
A responsive web dashboard for launching SMS broadcasts. The merchant can write a campaign and see exactly what it will cost before sending. After sending, they can watch messages move from `Pending` to `Delivered` or `Failed` in real time, and search or filter everything that has gone out.

# Live SMS Campaign Dashboard

A responsive web dashboard for a Ghanaian merchant, **Boakye Yiadom Co.**, launching SMS broadcasts. The merchant can write a campaign and see exactly what it will cost before sending. After sending, they can watch messages move from `Pending` to `Delivered` or `Failed` in real time, and search or filter everything that has gone out.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · lucide-react · Vitest

## Features

### Campaign overview
- **Total Sent**, with how many messages are still pending and a bar showing the delivered, pending and failed split.
- **Delivered** and **Failed**, each with a percentage of total sent.
- **Total Cost** in Ghana cedis, with the calculation shown (e.g. `19 SMS × GH₵0.035`).
- **Wallet balance** in the header, which updates as campaigns are sent and failed messages are refunded.

### Send new campaign
- **Campaign name**, **audience** and **message** fields.
- **Live counter:** `171/640 chars · 2 SMS`, with a progress bar for each SMS part and hints such as *"149 characters left in SMS 2."*
- **Cost estimate** before sending (`1,246 recipients × 2 SMS = GH₵87.22`), plus the balance left after sending.
- **Validation:** required fields, a 640-character limit (4 SMS), and a block on campaigns the balance can't cover.
- **Helpful warnings:**
  - Special characters such as emoji, smart quotes and `—` make real carriers charge more, so the form flags them.
  - The form reminds you to include *"Reply STOP to opt out"*.

### Sent messages
- **Search** by recipient name, message text, campaign name, or phone number. Numbers can be local (`024 490 8132`) or international (`+233 24 490 8132`).
- **Status filter:** All / Delivered / Pending / Failed. Each option shows how many messages match the current search.
- **Pagination:** 10 messages per page.
- **Clear empty states** for "no results" and "no messages yet".
- **Failed messages** show the carrier reason (e.g. *"Invalid number"*) and are marked as not billed.

### Live delivery updates
New messages start as `Pending`. A simulated carrier then sends delivery reports over the next few seconds, and the stat cards, balance and table all update together without a page refresh.

---

## Tech stack

| Tool | Purpose | Why |
|---|---|---|
| **React 19** | UI | Component model, `useReducer`, `useDeferredValue` for smooth search |
| **TypeScript** | Type safety | Typed data model means status values, money and API responses are checked at compile time |
| **Vite** | Dev server and bundler | Fast startup and hot reload, minimal config |
| **Tailwind CSS v4** | Styling | Responsive utilities and container queries built in |
| **shadcn/ui** (Radix) | UI components | Accessible card, select, table, badge, tooltip and toast. Source lives in the repo, so it can be customised. |
| **lucide-react** | Icons | Lightweight, consistent icon set |
| **Sonner** | Toasts | Success and error feedback after sending |
| **Vitest + Testing Library** | Tests | Same config as Vite; tests components the way users use them |
| **oxlint** | Linting | Fast lint checks, including React hooks rules |

---

## Getting started

### Prerequisites
- **Node.js** 20.19+ or 22.12+
- **npm** 10+

### Install and run

```bash
git clone https://github.com/kwadwowiredu/sms-campaign-dashboard
cd sms-campaign-dashboard
npm install
npm run dev
```

## Project structure

```
src/
├── config.ts                    Business rules: 160 chars/SMS, 4-part limit, GH₵0.035/SMS, en-GH locale
├── types.ts                     Message, Campaign, Audience, Account, DashboardStats…
│
├── lib/                         Pure logic with no React. Unit tested.
│   ├── sms.ts                   Character and SMS counting, GSM-7 detection, counter hints
│   ├── billing.ts               Message and campaign cost, what is billable, balance
│   ├── stats.ts                 computeStats(messages)
│   ├── filter-messages.ts       Search and status filtering
│   ├── validation.ts            Campaign validation (shared by the form and the API)
│   └── format.ts                Cedis, numbers, Ghanaian phone numbers, dates
│
├── data/
│   ├── seed.json                Merchant account, 3 past campaigns, 18 sent messages
│   ├── contacts.ts              Generated contact list (~1,300 Ghanaian contacts, same on every load)
│   └── audiences.ts             Audience rules and recipient resolution
│
├── services/
│   ├── campaign-api.ts          Mock backend: fetchDashboard, sendCampaign, subscribeToDeliveryReports
│   └── delivery-simulator.ts    Simulated carrier delivery reports
│
├── hooks/
│   └── use-dashboard.ts         App state (useReducer), derived stats and balance
│
├── components/
│   ├── dashboard/               Header, StatsCards, CampaignForm, SmsCounter, MessagesPanel, StatusBadge…
│   └── ui/                      shadcn/ui components
│
└── test/                        Test setup and data factories
```

## Domain logic

### SMS counting

The count follows the rule given in the brief:

SMS count = ceil(characters / 160)

| Characters | SMS |
|---:|---:|
| 0 | 0 |
| 1 – 160 | 1 |
| 161 – 320 | 2 |
| 321 – 480 | 3 |
| 481 – 640 | 4 |
| 641+ | ❌ over limit |

- Characters are counted by Unicode code point (`Array.from(text).length`). An emoji counts as 1 character, not the 2 that `string.length` returns.
- Spaces and line breaks count as characters.

### Pricing and billing

Campaign cost = recipients × SMS count × GH₵0.035

*Example:* the VIP Early Access message is 221 characters, so 2 SMS. Sending it to 90 VIP members costs 90 × 2 × GH₵0.035 = **GH₵6.30**.

| Status | Billed? | Reason |
|---|:---:|---|
| `Delivered`| Message reached the handset |
| `Pending` (held) | Charged when sent, refunded if it later fails |
| `Failed`| Merchant is not charged for undelivered messages |

- **Money is stored as whole numbers of micro-units** (GH₵1 = 1,000,000), so repeated decimal maths never picks up floating-point errors. For example, GH₵0.035 × 1,000 is exactly GH₵35.00.
- **Balance = wallet top-ups − billed messages.** The balance is never stored separately.

### Stats definitions

| Stat | Formula |
|---|---|
| Total Sent | Delivered + Pending + Failed |
| Delivered % | Delivered ÷ Total Sent |
| Failed % | Failed ÷ Total Sent |
| Total Cost | Sum of the cost of every billable (non-failed) message |

### Audiences

Audiences are **dynamic segments**: rules applied to the contact list at the moment a campaign is sent.

| Audience | Rule |
|---|---|
| All subscribers | Everyone who opted in |
| VIP members | Tagged `vip` |
| Recent buyers | Ordered in the last 30 days |
| Abandoned cart | Left items in their cart in the last 72 hours |
| Win-back | Last order more than 90 days ago |

Whatever the rule, contacts who opted out are always excluded and duplicate numbers are removed. Each message saves the recipient's name and number at send time, so history stays accurate even if the contact changes later.

### Search

- **Case-insensitive**, across recipient name, message, campaign and phone number.
- **Multi-word queries must all match:** `esi school` finds Esi's Back to School message.
- **Phone-style queries are matched as one number:** `024 490 8132` finds that exact number, not every number containing `024` and `490` separately.
- **Local and international forms both work:** `0244908132` and `+233 24 490 8132`.
- **Special characters such as `(`, `[` or `*` are treated as plain text,** so they never break the search.

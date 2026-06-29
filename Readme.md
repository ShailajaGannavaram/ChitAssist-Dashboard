# ANTS Bot Dashboard — Lexa React Admin Panel

The admin dashboard for the ANTS Bot platform. Built on Lexa React v3.0.0 template, customized extensively for bot management, lead tracking, CRM integration, billing, and support tickets.

---

## Project Structure

```
Starterkit/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── VerticalLayout/
│   │       ├── Header.js         # Top navbar
│   │       ├── SidebarContent.js # Navigation sidebar
│   │       └── index.js          # Layout wrapper
│   ├── helpers/
│   │   ├── api_helper.js         # Axios HTTP client
│   │   └── fakebackend_helper.js # API function calls
│   ├── pages/
│   │   ├── BotConfig/
│   │   │   ├── index.js          # Bot configuration (8 tabs)
│   │   │   └── FlowBuilder.jsx   # React Flow visual builder
│   │   ├── Leads/index.js        # Lead management
│   │   ├── Conversations/index.js
│   │   ├── Dashboard/index.js
│   │   ├── Tickets/
│   │   │   ├── index.js          # Support tickets list
│   │   │   └── TicketDetail.jsx  # Ticket thread view
│   │   ├── ActivityLog/index.js
│   │   ├── AccountSettings/index.js
│   │   ├── Billing/index.js
│   │   ├── MyPlan/index.js
│   │   ├── AdminBots/index.js    # Superadmin bot list
│   │   ├── UserManagement/index.js
│   │   └── CreateBot/index.js
│   ├── store/                    # Redux state management
│   └── routes/
│       └── allRoutes.js          # Route definitions
└── package.json
```

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI framework |
| Redux + Redux Saga | — | State management |
| React Router | v6 | Client-side routing |
| Reactstrap | — | Bootstrap UI components |
| @xyflow/react | — | Visual flow builder (drag-drop) |
| Axios | — | HTTP requests |
| Razorpay JS SDK | — | Payment checkout |
| Node.js | 18+ | Required for build |
| npm | 8+ | Package manager |

---

## Prerequisites

- Node.js **18 or higher** (required — lower versions will fail)
- npm 8+
- Backend (ChitAssist Django) running locally or deployed

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/ShailajaGannavaram/ChitAssist-Dashboard.git
cd ChitAssist-Dashboard/Starterkit
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> **Why `--legacy-peer-deps`?** Some packages in the Lexa template have peer dependency conflicts with newer npm versions. This flag resolves them without breaking anything.

### 3. Environment variables

Create a `.env` file in the `Starterkit/` folder:

```env
REACT_APP_API_URL=http://127.0.0.1:8000
```

For production:
```env
REACT_APP_API_URL=https://your-render-backend.onrender.com
```

### 4. Run development server

```bash
npm start
```

Dashboard runs at: `http://localhost:3001`

> Port is 3001 by default if 3000 is already used by the chatbot frontend.

---

## Deployment (Vercel)

### Settings in Vercel dashboard

| Setting | Value |
|---------|-------|
| Framework Preset | Create React App |
| Root Directory | `Starterkit` |
| Build Command | `npm run build` |
| Output Directory | `build` |
| Node.js Version | **18.x** (important — set in Vercel settings) |
| Install Command | `npm install --legacy-peer-deps` |

### Environment variable on Vercel

```
REACT_APP_API_URL = https://your-render-backend.onrender.com
```

---

## Login Credentials

| Role | How to create |
|------|--------------|
| Superadmin | `python manage.py createsuperuser` in backend |
| Client | Created by superadmin via User Management page |

### Login flow
1. Go to `/login`
2. Enter email and password
3. JWT token stored in `localStorage` as `authUser`
4. Token expires in 30 minutes — auto refresh via refresh token (30 days)

---

## Key Pages and Features

### Bot Configuration (`/bot-config`)
8 tabs for managing everything about a bot:
1. **Basic Info** — Name, company, welcome message, completion message
2. **Appearance** — Colors with live preview
3. **Welcome Card** — Stats, buttons, welcome note
4. **Flow Steps** — Visual drag-drop flow builder (React Flow)
5. **Quick Suggestions** — Chat start buttons
6. **Webhook & API** — Webhook URL, external API config
7. **CRM Integration** — Connect to Zoho, HubSpot, Salesforce, Odoo, or generic REST
8. **Embed & Share** — iFrame and floating widget code

### Flow Builder
- Drag and drop nodes to build conversation flow
- Click any node to edit question, options, conditions
- Yellow dashed arrows = conditional routing
- Each step has **Knowledge Base** field — paste product info for Claude to reference
- Each step has **Response Message** field — shown after user answers

### Lead Management (`/leads`)
- View all leads in a table
- Filter by status, date range, search
- Change lead status inline (New / Contacted / Converted / Not Interested)
- Export filtered leads to CSV
- Import leads from CSV file
- Push individual leads to CRM

### CRM Integration
Configure per-bot CRM connection:
- Select CRM type (Zoho, HubSpot, Salesforce, Odoo, Generic REST)
- Paste API key from CRM
- Set field mapping (JSON format)
- Toggle auto-push for new leads
- Test connection button
- Manual push from Leads page

### Support Tickets (`/tickets`)
- Users raise tickets with title, description, priority
- Click any ticket to open full conversation thread
- Admin can reply, add internal notes, update status
- File attachments supported (stored on Cloudinary)
- Email notifications on ticket creation and replies

### Billing (`/billing`)
- View all payment history
- Download PDF invoices with GST breakdown (CGST 9% + SGST 9%)
- Admin sees all client payments

### My Plan (`/my-plan`)
- Upgrade plan with Razorpay payment
- Downgrade plan immediately (test mode)
- Test card: `4111 1111 1111 1111`, any future expiry, CVV `123`

---

## Important Architecture Notes

### Why F and Toggle components are defined OUTSIDE BotConfig
The `F` (field input) and `Toggle` components in `BotConfig/index.js` are intentionally defined **outside** the `BotConfig` component at the top of the file. If defined inside, every keystroke triggers a re-render of `BotConfig`, which recreates these components, causing React to unmount/remount inputs and lose focus (only one character typed per click). Moving them outside with `form` and `set` as props fixes this permanently.

### Why FlowBuilder uses localData state with onBlur save
The `StepEditor` inside `FlowBuilder.jsx` uses local state (`localData`) instead of directly updating parent state on every keystroke. Changes are only pushed to parent when the user leaves a field (`onBlur`). This prevents the Lexa template's global click listener from causing re-renders that lose focus.

### Bot switcher
Clients with multiple bots can switch between them in Bot Config, Leads, and Conversations pages. The `all_user_bots` array in `authUser` localStorage drives this.

---

## Sidebar Navigation

### Superadmin sees
- All Bots
- Create Bot
- User Management
- Activity Log
- Support Tickets
- Account Settings
- Billing
- Change Password
- Logout

### Client sees
- Dashboard
- Leads
- Conversations
- Bot Configuration
- Activity Log
- Support Tickets
- My Plan
- Account Settings
- Billing
- Change Password
- Logout

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `npm install` fails with peer dependency error | Use `npm install --legacy-peer-deps` |
| Build fails on Vercel | Set Node.js to 18.x in Vercel settings |
| Login keeps loading | Check `REACT_APP_API_URL` is correct and backend is running |
| Typing in inputs loses focus after one character | `F` and `Toggle` must be defined OUTSIDE the parent component |
| Flow steps not saving | Check `onBlur={save}` is on all textareas in `FlowBuilder.jsx` |
| CRM push fails | Check API endpoint and key in Bot Config → CRM Integration tab |

---

## File Naming Convention

All new pages are saved as `index.js` inside their own folder under `src/pages/`. Example:
```
src/pages/ActivityLog/index.js
src/pages/Tickets/index.js
src/pages/Tickets/TicketDetail.jsx
```

Routes are defined in `src/routes/allRoutes.js`.
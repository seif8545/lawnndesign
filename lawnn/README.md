# Lawnn — لون | Egyptian Creative Talent Platform

A fully interactive React + Tailwind CSS prototype of the **Lawnn** freelance marketplace for Egyptian creative talent.

## Tech Stack
- **React 18** (Vite)
- **Tailwind CSS 3**
- **Lucide React** icons
- **Google Fonts**: Playfair Display, DM Sans, Noto Naskh Arabic

## Quick Start

```bash
# 1. Unzip the project
unzip lawnn.zip && cd lawnn

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:5173
```

## Views / Pages

| View | Description |
|---|---|
| **Home** | Hero, category filters, trending talent grid, VIP concierge banner |
| **Job Board** | Live job feed, Post a Job modal (with VIP toggle), Apply modal with portfolio sample picker |
| **Talent Directory** | Sidebar filters (university, dept, status), searchable card grid with mini portfolio |
| **Profile** | Full talent profile with CV, masonry portfolio, Hire Full-Time CTA (tooltip for headhunter fee) |
| **Feed** | Social #WIP feed with like/comment/share, video tutorial placeholder |
| **Chat** | Split-screen chat with Secure File Sharing dropdown (Standard / View-Only PDF / Watermark) |

## Backend Notes (in code comments)

- **Graduate 12-month deactivation**: Cron logic documented in `ProfilePage` component
- **VIP Concierge**: +200 EGP fee added automatically in `Post a Job` modal
- **File Security**: Three-tier system (Standard / View-Only / Watermarked) in Chat view
- **Verified Badges**: `VerifiedBadge` component handles Student vs Grad states

## Design System

- **Primary**: Forest Green `#183828` / `#3c8762`
- **Accent**: Terracotta `#c4622d`  
- **Warm**: Sand `#faf0d9` / `#db9630`
- **Typography**: Playfair Display (headings) + DM Sans (body)
- **Aesthetic**: Editorial gallery × marketplace efficiency

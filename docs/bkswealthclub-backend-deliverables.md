# BksWealthClub Backend Deliverables

## 1) Complete Server Folder Structure

```text
server/
  .env.example
  package.json
  src/
    app.js
    server.js
    common/
      constants/
        index.js
      enums/
        index.js
      helpers/
        token.helper.js
      logger/
        logger.js
    config/
      cloudinary.js
      cors.js
      db.js
      env.js
    core/
      ApiError.js
      ApiResponse.js
      asyncHandler.js
    jobs/
      autopool.job.js
      income.job.js
      notification.job.js
    middleware/
      admin.middleware.js
      auth.middleware.js
      error.middleware.js
      rateLimit.middleware.js
      upload.middleware.js
      validate.middleware.js
    modules/
      activation/
        activation.controller.js
        activation.model.js
        activation.repository.js
        activation.routes.js
        activation.service.js
      admin/
        admin.controller.js
        admin.model.js
        admin.repository.js
        admin.routes.js
        admin.service.js
      audit/
        audit.model.js
        audit.service.js
      auth/
        auth.controller.js
        auth.model.js
        auth.repository.js
        auth.routes.js
        auth.service.js
        auth.validation.js
      autopool/
        autopool.controller.js
        autopool.engine.js
        autopool.model.js
        autopool.repository.js
        autopool.routes.js
        autopool.service.js
      cms/
        cms.controller.js
        cms.model.js
        cms.repository.js
        cms.routes.js
        cms.service.js
      dashboard/
        dashboard.controller.js
        dashboard.routes.js
        dashboard.service.js
      deposit/
        deposit.controller.js
        deposit.model.js
        deposit.repository.js
        deposit.routes.js
        deposit.service.js
      income/
        income-rules.service.js
        income.controller.js
        income.model.js
        income.repository.js
        income.routes.js
        income.service.js
      notifications/
        notification.model.js
        notifications.service.js
      referral/
        referral.controller.js
        referral.model.js
        referral.repository.js
        referral.routes.js
        referral.service.js
      settings/
        settings.controller.js
        settings.model.js
        settings.routes.js
        settings.service.js
      support/
        support.controller.js
        support.model.js
        support.repository.js
        support.routes.js
        support.service.js
      team/
        team.controller.js
        team.routes.js
        team.service.js
      uploads/
        uploads.controller.js
        uploads.routes.js
        uploads.service.js
      user/
        user.controller.js
        user.model.js
        user.repository.js
        user.routes.js
        user.service.js
        user.validation.js
        wallet.model.js
      withdrawal/
        withdrawal.controller.js
        withdrawal.model.js
        withdrawal.repository.js
        withdrawal.routes.js
        withdrawal.service.js
        withdrawal.validation.js
    routes/
      index.js
    utils/
      date.js
      generateUsername.js
      pagination.js
      referral.js
      wallet.js
    validations/
      common.validation.js
```

## 2) Backend Module Explanation

- auth: registration/login (user and admin), refresh/logout, sponsor validation, password-reset placeholders.
- user: profile, profile update, change-password placeholder, wallet linkage.
- referral: sponsor relation validation and direct referral stats.
- team: direct team, generation team, hierarchy views.
- autopool: autopool node/cycle persistence and placement engine hook.
- income: income ledger, history, summary, and rules engine access.
- deposit: user deposit requests and admin approve/reject workflow.
- activation: activation requests and activation execution flow.
- withdrawal: withdrawal requests with rule-based min amount and charge calculation.
- support: user ticketing and admin reply workflow.
- cms: website content, FAQ, and contact info management.
- dashboard: member and admin dashboard aggregate data.
- admin: admin summary, user listing, and user-status management with audit logging.
- settings: central configurable business rules (non-hardcoded logic source).
- uploads: protected upload endpoint with Cloudinary support and fallback behavior.
- notifications: notification model and service hooks.
- audit: admin action audit trail persistence.

## 3) API Endpoint Mapping to Frontend Screens

Base prefix is configurable via API_PREFIX and defaults to /api/v1.

### Public + Auth Screens (apps/user-web)

- /login -> POST /api/v1/auth/login
- /register -> POST /api/v1/auth/register
- register sponsor validation -> POST /api/v1/auth/validate-sponsor or POST /api/v1/referrals/validate-sponsor
- logout action -> POST /api/v1/auth/logout
- token refresh -> POST /api/v1/auth/refresh

### Member Panel Screens (apps/user-web)

- /member/dashboard -> GET /api/v1/dashboard/member
- /member/account -> GET /api/v1/users/me, PATCH /api/v1/users/me, POST /api/v1/users/me/change-password
- /member/deposit -> POST /api/v1/deposits, GET /api/v1/deposits/mine
- /member/activation -> POST /api/v1/activations/request, POST /api/v1/activations/execute
- /member/team/direct -> GET /api/v1/team/direct
- /member/team/generation -> GET /api/v1/team/generation
- /member/team/autopool -> GET /api/v1/autopool/community-tree
- /member/income/sponsor -> GET /api/v1/income/history?type=sponsor
- /member/income/representative -> GET /api/v1/income/history?type=representative
- /member/withdrawal/make -> POST /api/v1/withdrawals
- /member/withdrawal/history -> GET /api/v1/withdrawals/mine
- /member/support -> POST /api/v1/support, GET /api/v1/support/mine

### Admin Login + Panel Screens (apps/admin-web)

- /login (admin app) -> POST /api/v1/auth/admin/login
- /admin/dashboard -> GET /api/v1/dashboard/admin and GET /api/v1/admin/summary
- /admin/users -> GET /api/v1/admin/users
- /admin/users/:id -> GET /api/v1/admin/users (current list endpoint) and PATCH /api/v1/admin/users/:id/status
- /admin/team/referrals -> GET /api/v1/team/hierarchy
- /admin/team/autopool -> POST /api/v1/autopool/place, GET /api/v1/autopool/community-tree
- /admin/deposits -> GET /api/v1/deposits/admin/pending, POST /api/v1/deposits/admin/:id/approve, POST /api/v1/deposits/admin/:id/reject
- /admin/withdrawals -> GET /api/v1/withdrawals/admin/pending, POST /api/v1/withdrawals/admin/:id/approve, POST /api/v1/withdrawals/admin/:id/reject
- /admin/income/logs -> GET /api/v1/income/history
- /admin/income/rules -> GET /api/v1/settings/public-rules and PUT /api/v1/settings
- /admin/support -> GET /api/v1/support/admin/all, POST /api/v1/support/admin/:id/reply
- /admin/cms/site -> GET /api/v1/cms/website, PUT /api/v1/cms/sections/:key
- /admin/cms/banners -> PUT /api/v1/cms/sections/banners
- /admin/cms/faq -> GET /api/v1/cms/faqs, PUT /api/v1/cms/faqs
- /admin/cms/contact -> GET /api/v1/cms/contact, PUT /api/v1/cms/contact
- /admin/settings/general -> GET /api/v1/settings, PUT /api/v1/settings
- /admin/settings/wallet -> GET /api/v1/settings, PUT /api/v1/settings
- /admin/settings/security -> GET /api/v1/settings, PUT /api/v1/settings

### Shared Utility Endpoints

- health -> GET /health
- file uploads (admin protected) -> POST /api/v1/uploads/single

## 4) Setup Order (Recommended)

1. Install workspace dependencies from repository root.
2. Configure server environment variables using server/.env.example.
3. Start MongoDB and optionally Redis.
4. Start backend server.
5. Start user frontend app.
6. Start admin frontend app.
7. Integrate frontend service layers to real endpoints (replace mock handlers).

Suggested commands:

```bash
npm install
cp server/.env.example server/.env
npm --workspace server run dev
npm --workspace apps/user-web run dev
npm --workspace apps/admin-web run dev
```

## 5) Future Integration Notes

- Frontend services in both apps are still mock-based and should be migrated to a shared HTTP client using real API calls.
- Add access/refresh token handling with cookie + in-memory/session strategy and automatic refresh retry.
- Add request DTO typing and response schema guards in frontend to keep contracts strict.
- Add route-level RBAC checks in frontend based on decoded role and permissions from token/session state.
- Add background queue workers for heavy jobs (income calculation, autopool rebalancing, notifications) using BullMQ + Redis.
- Add tests: module unit tests for services, API integration tests for route contracts, and e2e smoke tests for login + dashboard paths.
- Add observability: structured logs, request IDs, metrics, and alerting hooks for payment workflows.

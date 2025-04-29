# Laravel User Management Backend with Advanced RBAC

## Setup Instructions

1. Install dependencies:

```bash
composer install
npm install
npm run dev
```

2. Configure your `.env` file with database and other settings.

3. Run migrations:

```bash
php artisan migrate
```

4. Install spatie/laravel-permission package (if not already installed):

```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

5. Seed default roles and permissions if needed.

## Features

-   User Management with CRUD, soft deletes (Recycle Bin), restore, and force delete.
-   Role Management with CRUD, soft deletes, restore, and force delete.
-   Permission Management with CRUD.
-   Manual assignment of permissions to users and roles.
-   RBAC enforced via middleware and policies.
-   API Resource Controllers with JSON responses.
-   Proper validation and error handling.

## API Endpoints (examples)

-   `GET /api/users` - List users
-   `POST /api/users` - Create user
-   `GET /api/users/deleted` - List soft deleted users
-   `POST /api/users/{id}/restore` - Restore user
-   `DELETE /api/users/{id}/force` - Permanently delete user
-   `POST /api/users/{user}/permissions` - Assign permissions to user

-   `GET /api/roles` - List roles
-   `POST /api/roles` - Create role
-   `GET /api/roles/deleted` - List soft deleted roles
-   `POST /api/roles/{id}/restore` - Restore role
-   `DELETE /api/roles/{id}/force` - Permanently delete role
-   `POST /api/roles/{role}/permissions` - Assign permissions to role

-   `GET /api/permissions` - List permissions
-   `POST /api/permissions` - Create permission

## Notes

-   Admin can manually assign permissions to users and roles.
-   Soft deletes enable a recycle bin system for users and roles.
-   Middleware `RolePermissionMiddleware` enforces access control.
-   Use JWT authentication for API security.

## Next Steps

-   Add policies/gates for finer access control if needed.
-   Implement activity logging for user and role changes.
-   Add search and pagination enhancements.
-   Build frontend UI to consume these APIs.

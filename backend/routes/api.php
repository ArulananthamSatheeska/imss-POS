<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    DashboardController,
    UnitController,
    ProductController,
    CategoryController,
    SupplierController,
    StoreLocationController,
    CustomerController,
    SaleController,
    UserController,
    StockReportController,
    AuthController,
    CompanyController,
    DiscountSchemeController,
    RoleController,
    PermissionController,
    ProductionCategoryController,
    ProductionItemController,
    PurchaseController,
    PurchaseOrderController,
    PurchaseReturnController,
    RawMaterialController,
    SalesInvoiceController,
    SalesReturnController,
    RegisterController,
    OutstandingController
};

use App\Http\Middleware\EnsureRegisterIsOpen;

// Authentication routes
Route::middleware(['api'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// Global OPTIONS route for CORS
Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

// Auth test route
Route::middleware('auth:api')->get('/test-auth', function () {
    try {
        $user = auth()->user();
        return response()->json([
            'success' => true,
            'user' => $user,
            'token_valid' => true
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 401);
    }
});


// Authenticated routes with role-permission middleware
Route::middleware(['api', 'auth:api', \App\Http\Middleware\RolePermissionMiddleware::class])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/add-default-user', [AuthController::class, 'addDefaultUser']);
    Route::get('/verify-token', [AuthController::class, 'verifyToken']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);

    // Register
    Route::get('/register/status', [RegisterController::class, 'getStatus']);
    Route::post('/register/open', [RegisterController::class, 'openShift']);
    Route::post('/register/close', [RegisterController::class, 'closeShift']);
    Route::post('/register/cash-in', [RegisterController::class, 'addCash'])->middleware(EnsureRegisterIsOpen::class);
    Route::post('/register/cash-out', [RegisterController::class, 'removeCash'])->middleware(EnsureRegisterIsOpen::class);
    Route::get('/register/current', [RegisterController::class, 'getCurrentRegistry'])->middleware(EnsureRegisterIsOpen::class);
    Route::get('/register/report', [RegisterController::class, 'getRegistryReport'])->middleware(EnsureRegisterIsOpen::class);

    // Roles & Permissions
    Route::apiResource('permissions', PermissionController::class)->except(['update']);
    Route::apiResource('roles', RoleController::class);
    Route::post('/roles/{role}/permissions', [RoleController::class, 'assignPermissions']);

    // Users
    Route::apiResource('users', UserController::class)->except(['create', 'edit']);
    Route::get('users/deleted', [UserController::class, 'getDeletedUsers']);
    Route::post('users/{id}/restore', [UserController::class, 'restoreUser']);
    Route::delete('users/{id}/force', [UserController::class, 'forceDeleteUser']);
    Route::post('users/{user}/permissions', [UserController::class, 'assignPermissions']);
    Route::post('users/change-password', [UserController::class, 'changePassword']);
    Route::put('users/update-profile', [UserController::class, 'updateProfile']);
    Route::get('users/{user}/activity-log', [UserController::class, 'activityLog']);
    Route::post('users/{user}/enable-2fa', [UserController::class, 'enable2FA']);
    Route::post('users/{user}/activate', [UserController::class, 'activateUser']);
    Route::patch('users/{user}/status', [UserController::class, 'updateStatus']);

    // Outstanding
});

    Route::get('/outstanding', [OutstandingController::class, 'index']);
    Route::patch('/outstanding/{id}', [OutstandingController::class, 'update']);

    // Discount Schemes
    Route::prefix('discount-schemes')->group(function () {
        Route::get('/', [DiscountSchemeController::class, 'index']);
        Route::post('/', [DiscountSchemeController::class, 'store']);
        Route::get('/{scheme}', [DiscountSchemeController::class, 'show']);
        Route::put('/{scheme}', [DiscountSchemeController::class, 'update']);
        Route::delete('/{scheme}', [DiscountSchemeController::class, 'destroy']);
    });
    
    // Master data
    Route::apiResource('products', ProductController::class);
    Route::post('/products/import', [ProductController::class, 'import']);
    Route::get('/products/check-names', [ProductController::class, 'checkNames']);
    Route::get('/product/{id}', [ProductController::class, 'barcode']);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('store-locations', StoreLocationController::class);
    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('units', UnitController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('production-categories', ProductionCategoryController::class);
    Route::apiResource('production-items', ProductionItemController::class);
    Route::apiResource('raw-materials', RawMaterialController::class);
    Route::get('suppliers', [RawMaterialController::class, 'getSuppliers']);
    Route::get('units', [RawMaterialController::class, 'getUnits']);

    // Sales
    Route::get('/next-bill-number', [SaleController::class, 'getLastBillNumber']);
    Route::get('/sales/daily-profit-report', [SaleController::class, 'getcombinedDailyProfitReport']);
    Route::get('/sales/bill-wise-profit-report', [SaleController::class, 'getCombinedBillWiseProfitReport']);
    Route::get('/sales/company-wise-profit-report', [SaleController::class, 'getCompanyWiseProfitReport']);
    Route::get('/sales/supplier-wise-profit-report', [SaleController::class, 'getSupplierWiseProfitReport']);
    Route::get('/sales/category-wise-profit-report', [SaleController::class, 'getCategoryWiseProfitReport']);
    Route::apiResource('sales', SaleController::class);

    // Stock reports
    Route::get('/stock-reports', [StockReportController::class, 'index']);
    Route::get('/detailed-stock-reports', [StockReportController::class, 'detailedReport']);

    // Held Sales
    Route::prefix('holds')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\HeldSaleController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\HeldSaleController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\HeldSaleController::class, 'show']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\HeldSaleController::class, 'destroy']);
        Route::post('/{id}/recall', [\App\Http\Controllers\Api\HeldSaleController::class, 'recall']);
    });

    // Purchases
    Route::apiResource('purchases', PurchaseController::class);

    // Purchase Returns
    Route::post('/purchase-returns', [PurchaseReturnController::class, 'createPurchaseReturn']);
    Route::get('/purchase-returns', [PurchaseReturnController::class, 'getPurchaseReturns']);
    Route::get('/purchase-returns/{id}', [PurchaseReturnController::class, 'show']);
    Route::put('/purchase-returns/{id}', [PurchaseReturnController::class, 'update']);
    Route::delete('/purchase-returns/{id}', [PurchaseReturnController::class, 'destroy']);

    // Purchase Orders
    Route::apiResource('purchase-orders', PurchaseOrderController::class);

    // Companies
    Route::prefix('companies')->group(function () {
        Route::get('/', [CompanyController::class, 'index']);
        Route::post('/', [CompanyController::class, 'store']);
        Route::get('/{company_name}', [CompanyController::class, 'show']);
        Route::put('/{company_name}', [CompanyController::class, 'update']);
        Route::delete('/{company_name}', [CompanyController::class, 'destroy']);
    });

    // Sales Invoice
    Route::apiResource('invoices', SalesInvoiceController::class);
    Route::get('/invoices/check-invoice-no', [SalesInvoiceController::class, 'checkInvoiceNo']);

    // Sales Returns
    Route::resource('sales-returns', SalesReturnController::class)->except(['create', 'edit']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'dashboard']);

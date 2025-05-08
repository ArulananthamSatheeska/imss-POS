<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        try {
            $today = Carbon::today();
            $thirtyDaysLater = $today->copy()->addDays(30);

            // Today's financial calculations
            $todayFinancials = $this->calculateDailyFinancials($today);
            
            // Total financial calculations
            $totalFinancials = $this->calculateTotalFinancials();
            
            // Payment dues
            $paymentDues = $this->calculatePaymentDues();
            
            // Expiry tracking
            $expiryTracking = [
                'itemsGoingToExpire' => Product::whereBetween('expiry_date', [$today, $thirtyDaysLater])->count(),
                'alreadyExpiredItems' => Product::whereDate('expiry_date', '<', $today)->count(),
            ];
            
            // Charts and reports
            $reports = $this->generateReports($today);

            return response()->json([
                'summaryCards' => [
                    'totalTodaysSales' => round($todayFinancials['revenue'], 2),
                    'todaysProfit' => round($todayFinancials['profit'], 2),
                    'totalItems' => Product::count(),
                    'totalProfit' => round($totalFinancials['profit'], 2),
                ],
                'financialStatus' => [
                    'salesPaymentDue' => round($paymentDues['sales'], 2),
                    'purchasePaymentDue' => round($paymentDues['purchases'], 2),
                ],
                'expiryTracking' => $expiryTracking,
                'chartsAndReports' => $reports,
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['error' => 'Internal Server Error', 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        }
    }

    protected function calculateDailyFinancials(Carbon $date)
    {
        // Today's sales revenue and profit (POS)
        $salesData = SaleItem::with('product')
            ->whereHas('sale', fn($q) => $q->whereDate('created_at', $date))
            ->selectRaw('SUM(unit_price * quantity) as revenue, 
                         SUM((unit_price - COALESCE(products.buying_cost, 0)) * quantity) as profit')
            ->join('products', 'sale_items.product_id', '=', 'products.product_id')
            ->first();

        // Today's invoice revenue and profit
        $invoiceData = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereDate('invoices.invoice_date', $date)
            ->selectRaw('SUM(sales_price * quantity) as revenue,
                        SUM((sales_price * quantity) - total_buying_cost) as profit')
            ->first();

        return [
            'revenue' => ($salesData->revenue ?? 0) + ($invoiceData->revenue ?? 0),
            'profit' => ($salesData->profit ?? 0) + ($invoiceData->profit ?? 0)
        ];
    }

    protected function calculateTotalFinancials()
    {
        $salesData = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.product_id')
            ->selectRaw('SUM(unit_price * quantity) as revenue, 
                         SUM((unit_price - COALESCE(products.buying_cost, 0)) * quantity) as profit')
            ->first();

        $invoiceData = DB::table('invoice_items')
            ->selectRaw('SUM(sales_price * quantity) as revenue,
                        SUM((sales_price * quantity) - total_buying_cost) as profit')
            ->first();

        return [
            'revenue' => ($salesData->revenue ?? 0) + ($invoiceData->revenue ?? 0),
            'profit' => ($salesData->profit ?? 0) + ($invoiceData->profit ?? 0)
        ];
    }

    protected function calculatePaymentDues()
    {
        return [
            'sales' => DB::table('invoices')->where('balance', '>', 0)->sum('balance'),
            'purchases' => DB::table('purchases')
                ->whereRaw('paid_amount < total')
                ->selectRaw('SUM(total - paid_amount) as due')
                ->value('due') ?? 0
        ];
    }

    protected function generateReports(Carbon $today)
    {
        // Get monthly sales from POS sales
        $posMonthlySales = Sale::query()
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('SUM(total) as total_sales')
            )
            ->where('created_at', '>=', $today->copy()->subMonths(11)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        // Get monthly sales from invoices
        $invoiceMonthlySales = DB::table('invoices')
            ->select(
                DB::raw("DATE_FORMAT(invoice_date, '%Y-%m') as month"),
                DB::raw('SUM(total_amount) as total_sales')
            )
            ->where('invoice_date', '>=', $today->copy()->subMonths(11)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        // Combine POS and invoice monthly sales
        $combinedMonthlySales = [];

        $allMonths = $posMonthlySales->keys()->merge($invoiceMonthlySales->keys())->unique()->sort();

        foreach ($allMonths as $month) {
            $posSales = $posMonthlySales->has($month) ? $posMonthlySales[$month]->total_sales : 0;
            $invoiceSales = $invoiceMonthlySales->has($month) ? $invoiceMonthlySales[$month]->total_sales : 0;
            $combinedMonthlySales[] = [
                'month' => $month,
                'total_sales' => $posSales + $invoiceSales,
            ];
        }

        return [
            'monthlySales' => $combinedMonthlySales,
            'topSellingProducts' => SaleItem::query()
                ->with('product')
                ->select('product_id', 
                    DB::raw('MAX(product_name) as product_name'),
                    DB::raw('SUM(quantity) as total_quantity_sold')
                )
                ->groupBy('product_id')
                ->orderByDesc('total_quantity_sold')
                ->limit(10)
                ->get()
        ];
    }
}

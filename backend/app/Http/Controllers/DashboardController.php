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

            // Total Sales: sum of POS sales for today (fully paid)
            $posSalesTotal = Sale::whereDate('created_at', $today)
                ->where('balance_amount', 0)
                ->sum('total');

            // Total Sales from invoices for today (fully paid)
            $invoiceSalesTotal = DB::table('invoices')
                ->whereDate('created_at', $today)
                ->where('balance', '<=', 0) // fully paid or overpaid
                ->sum('total_amount');

            $totalTodaysSales = $posSalesTotal + $invoiceSalesTotal;

            // Total Items (count of active products)
            $totalItems = Product::count();

            // Today's Total Costs: sum of buying_cost * quantity sold today (POS sales only)
            $todaySalesItems = SaleItem::whereHas('sale', function ($query) use ($today) {
                $query->whereDate('created_at', $today)
                    ->where('balance_amount', 0);
            })->get();

            $todaysTotalCosts = 0;
            foreach ($todaySalesItems as $item) {
                $buyingCost = $item->product ? $item->product->buying_cost : 0;
                $todaysTotalCosts += $buyingCost * $item->quantity;
            }

            // Total Profit: calculate as total sales minus total costs
            $totalProfit = $totalTodaysSales - $todaysTotalCosts;

            // Financial Status
            // Sales Payment Due: sum of due amounts from invoices only (exclude POS sales)
            $salesPaymentDue = DB::table('invoices')
                ->where('balance', '>', 0)
                ->sum('balance');

            // Purchase Payment Due (sum of total - paid_amount for unpaid/partially paid purchases)
            $purchasePaymentDue = Purchase::whereColumn('paid_amount', '<', 'total')
                ->sum(DB::raw('total - paid_amount'));

            // Expiry Tracking
            $thirtyDaysLater = $today->copy()->addDays(30);
            $itemsGoingToExpire = Product::whereBetween('expiry_date', [$today, $thirtyDaysLater])->count();
            $alreadyExpiredItems = Product::whereDate('expiry_date', '<', $today)->count();

            // Charts and Reports
            $monthlySales = Sale::select(
                    DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                    DB::raw('SUM(total) as total_sales')
                )
                ->where('created_at', '>=', $today->copy()->subMonths(11)->startOfMonth())
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            $topSellingProducts = SaleItem::select('product_id', 'product_name', DB::raw('SUM(quantity) as total_quantity_sold'))
                ->groupBy('product_id', 'product_name')
                ->orderByDesc('total_quantity_sold')
                ->limit(10)
                ->get();

            return response()->json([
                'summaryCards' => [
                    'totalTodaysSales' => round($totalTodaysSales, 2),
                    'totalItems' => $totalItems,
                    'todaysTotalCosts' => round($todaysTotalCosts, 2),
                    'todaysProfit' => round($totalProfit, 2),
                ],
                'financialStatus' => [
                    'salesPaymentDue' => round($salesPaymentDue, 2),
                    'purchasePaymentDue' => round($purchasePaymentDue, 2),
                ],
                'expiryTracking' => [
                    'itemsGoingToExpire' => $itemsGoingToExpire,
                    'alreadyExpiredItems' => $alreadyExpiredItems,
                ],
                'chartsAndReports' => [
                    'monthlySales' => $monthlySales,
                    'topSellingProducts' => $topSellingProducts,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error in DashboardController@dashboard: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }
}

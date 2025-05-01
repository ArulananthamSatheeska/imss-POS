<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Validator;

class ProductController extends Controller
{
    public function index()
    {
        try {
            $products = Product::all();
            return response()->json(['message' => 'Products fetched successfully', 'data' => $products], 200);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error fetching products');
        }
    }

    // public function store(Request $request)
    // {
    //     Log::info('Creating new product:', $request->all());

    //     try {
    //         $validatedData = $request->validate($this->storeRules());
    //         $product = Product::create($validatedData);

    //         return response()->json(['message' => 'Product created successfully', 'data' => $product], 201);
    //     } catch (\Illuminate\Validation\ValidationException $e) {
    //         return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
    //     } catch (\Exception $e) {
    //         return $this->handleException($e, 'Error creating product');
    //     }
    // }


    public function store(Request $request)
    {
        Log::info('Creating new product:', $request->all());
        if ($request->has('product_id') || $request->has('id')) {
            Log::warning('Unexpected product_id or id in store request', [
                'product_id' => $request->input('product_id'),
                'id' => $request->input('id'),
            ]);
        }
        try {
            $validatedData = $request->validate($this->storeRules());

            // Check if product with same product_name exists
            $existingProduct = Product::where('product_name', $validatedData['product_name'])->first();
            if ($existingProduct) {
                return response()->json(['message' => 'Product with this name already exists', 'data' => $existingProduct], 200);
            }

            $product = Product::create($validatedData);
            return response()->json(['message' => 'Product created successfully', 'data' => $product], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error creating product');
        }
    }

    public function show($id)
    {
        try {
            $product = Product::findOrFail($id);
            return response()->json(['message' => 'Product fetched successfully', 'data' => $product], 200);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Product not found', 404);
        }
    }

    public function update(Request $request, $id)
    {
        Log::info("Updating product ID: $id", $request->all());
        try {
            Log::info("Finding product with ID: $id");
            $product = Product::findOrFail($id);
            Log::info("Validating request data");
            $validatedData = $request->validate($this->updateRules($id));
            Log::info("Validated data:", $validatedData);
            Log::info("Updating product");
            $product->update($validatedData);
            Log::info("Product updated successfully");
            return response()->json(['message' => 'Product updated successfully', 'data' => $product], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning("Validation failed for product ID: $id", ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error updating product');
        }
    }

    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);
            $product->delete();

            return response()->json(['message' => 'Product deleted successfully'], 200);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error deleting product');
        }
    }

    public function import(Request $request)
    {
        Log::info('Import method called with request data: ', $request->all());

        try {
            Log::info('Validating file...');
            $request->validate([
                'file' => 'required|mimes:xlsx,xls,csv',
            ]);

            if (!$request->hasFile('file')) {
                Log::warning('No file uploaded.');
                return response()->json([
                    'message' => 'No file uploaded',
                ], 400);
            }

            $file = $request->file('file');
            Log::info('File uploaded:', ['file' => $file->getClientOriginalName()]);

            Log::info('Loading spreadsheet...');
            $spreadsheet = IOFactory::load($file->getPathname());

            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            Log::info('Rows data:', ['rows' => $rows]);

            $header = array_shift($rows);
            Log::info('Excel header:', ['header' => $header]);

            DB::beginTransaction();

            $importedProducts = [];
            $rowCount = count($rows);
            Log::info('Total rows to process: ' . $rowCount);

            foreach ($rows as $index => $row) {
                Log::info("Processing row: $index", ['row' => $row]);

                if (empty($row[0])) {
                    Log::warning('Skipping row due to missing product_name:', ['index' => $index]);
                    continue;
                }

                $productData = [
                    'product_name' => $row[0] ?? null,
                    'item_code' => $row[1] ?? null,
                    'expiry_date' => $row[3] ?? null,
                    'buying_cost' => $row[4] ?? 0,
                    'sales_price' => $row[5] ?? 0,
                    'minimum_price' => $row[6] ?? 0,
                    'wholesale_price' => $row[7] ?? 0,
                    'barcode' => $row[8] ?? null,
                    'mrp' => $row[9] ?? 0,
                    'minimum_stock_quantity' => $row[10] ?? 0,
                    'opening_stock_quantity' => $row[11] ?? 0,
                    'opening_stock_value' => $row[12] ?? 0,
                    'category' => $row[13] ?? null,
                    'supplier' => $row[14] ?? null,
                    'unit_type' => $row[15] ?? null,
                    'store_location' => $row[16] ?? null,
                    'cabinet' => $row[17] ?? null,
                    'row' => $row[18] ?? null,
                    'extra_fields' => json_encode([
                        'extra_field_name' => $row[19] ?? null,
                        'extra_field_value' => $row[20] ?? null,
                    ]),
                ];

                Log::info('Mapped product data:', ['product_data' => $productData]);

                $validator = Validator::make($productData, $this->importRules());

                if ($validator->fails()) {
                    Log::warning('Validation failed for row: ' . $index, ['errors' => $validator->errors()->all()]);
                    continue;
                }

                try {
                    $product = Product::create($productData);
                    $importedProducts[] = $product;
                    Log::info("Product created for row: $index", ['product' => $product]);
                } catch (\Exception $e) {
                    Log::error("Error creating product for row $index:", ['error' => $e->getMessage()]);
                }
            }

            DB::commit();

            Log::info('Import process completed. Total products imported: ' . count($importedProducts));

            return response()->json([
                'message' => 'Products imported successfully',
                'imported_products' => $importedProducts,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error importing products:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Error importing products',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function checkNames(Request $request)
{
    try {
        \Log::info('checkNames called', ['names' => $request->query('names')]);
        $names = $request->query('names', []);
        if (!is_array($names) || empty($names)) {
            \Log::warning('Invalid names parameter', ['names' => $names]);
            return response()->json(['message' => 'Names must be an array and cannot be empty'], 400);
        }

        $existingProducts = Product::whereIn('product_name', $names)
            ->pluck('product_name')
            ->toArray();

        \Log::info('checkNames response', ['existing' => $existingProducts]);
        return response()->json(['existing' => $existingProducts], 200);
    } catch (\Exception $e) {
        \Log::error('checkNames error', ['message' => $e->getMessage()]);
        return $this->handleException($e, 'Error checking product names');
    }
}

    private function storeRules()
    {
        return [
            'product_name' => 'required|string|max:255',
            'item_code' => 'nullable|string|unique:products,item_code',
            'batch_number' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'buying_cost' => 'nullable|numeric|min:0', // Changed to nullable
            'sales_price' => 'required|numeric|min:0',
            'minimum_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'barcode' => 'nullable|string|unique:products,barcode',
            'mrp' => 'required|numeric|min:0',
            'minimum_stock_quantity' => 'nullable|integer|min:0',
            'opening_stock_quantity' => 'nullable|integer|min:0',
            'opening_stock_value' => 'nullable|numeric|min:0',
            'category' => 'nullable|string',
            'supplier' => 'nullable|string',
            'unit_type' => 'nullable|string',
            'store_location' => 'nullable|string',
            'cabinet' => 'nullable|string',
            'row' => 'nullable|string',
            'extra_fields' => 'nullable|json',
        ];
    }

    private function updateRules($id)
    {
        return array_merge($this->storeRules(), [
            'item_code' => ['nullable', 'string', Rule::unique('products', 'item_code')->ignore($id, 'product_id')],
            'barcode' => ['nullable', 'string', Rule::unique('products', 'barcode')->ignore($id, 'product_id')],
        ]);
    }

    private function importRules()
    {
        return $this->storeRules();
    }

    private function handleException($e, $message, $status = 500)
    {
        Log::error($message . ': ' . $e->getMessage(), [
            'exception' => $e,
            'stack_trace' => $e->getTraceAsString(),
        ]);
        return response()->json([
            'message' => $message,
            'error' => $e->getMessage(),
            'details' => $e instanceof \Illuminate\Validation\ValidationException
                ? $e->errors()
                : null,
        ], $status);
    }
}
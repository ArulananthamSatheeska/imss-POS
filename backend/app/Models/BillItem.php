<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillItem extends Model
{
    use HasFactory;

    protected $fillable = ['bill_id', 'product_id', 'product_name', 'qty', 'price', 'discount', 'total'];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id'); // Corrected foreign key to product_id
    }

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }
}
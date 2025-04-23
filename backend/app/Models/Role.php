<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Traits\HasRoles;

class Role extends Model
{
    use HasRoles;
    
    protected $fillable = ['name', 'description'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public static function defaultRoles(): array
    {
        return [
            'admin',
            'manager', 
            'cashier',
            'storekeeper'
        ];
    }
}

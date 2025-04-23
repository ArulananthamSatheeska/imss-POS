<?php
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUnitsTable extends Migration
{
    public function up()
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();  // Auto-incrementing ID field
            $table->string('unit_name');  // unit_name field
            $table->timestamps();  // created_at and updated_at fields
        });
    }

    public function down()
    {
        Schema::dropIfExists('units');
    }
}


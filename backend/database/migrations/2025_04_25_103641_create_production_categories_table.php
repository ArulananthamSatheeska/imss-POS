<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductionCategoriesTable extends Migration
{
    public function up()
    {
        Schema::create('production_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('batch_number')->unique();
            $table->date('production_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('production_categories');
    }
}
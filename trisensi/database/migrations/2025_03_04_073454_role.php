<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();  
        });

        // Insert predefined roles
        DB::table('roles')->insert([
            ['name' => 'staff', 'description' => 'Regular staff account', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'student', 'description' => 'Student account', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'super_admin', 'description' => 'Administrator with main access', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
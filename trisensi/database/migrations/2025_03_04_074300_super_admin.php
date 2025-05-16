<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('super_admins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->string('admin_code')->unique();
            $table->timestamp('last_login')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Check if super admin user exists
        $existingUser = DB::table('users')->where('email', 'admin@example.com')->first();
        if (!$existingUser) {
            // Add super_admin account to users table
            $superAdminId = DB::table('users')->insertGetId([
                'name' => 'Super Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'), // Change password as needed
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Get role_id for super_admin from roles table
            $roleId = DB::table('roles')->where('name', 'super_admin')->value('id');
            
            // Add super_admin account to super_admins table
            DB::table('super_admins')->insert([
                'user_id' => $superAdminId,
                'role_id' => $roleId,
                'admin_code' => 'SA001',
                'last_login' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admins');
    }
};
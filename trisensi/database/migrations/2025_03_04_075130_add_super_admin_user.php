<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tambahkan akun super_admin ke tabel users
        $superAdminId = DB::table('users')->insertGetId([
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'), // Ganti password sesuai kebutuhan
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Dapatkan role_id untuk super_admin dari tabel roles
        $roleId = DB::table('roles')->where('name', 'super_admin')->value('id');

        // Tambahkan akun super_admin ke tabel super_admins
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')->where('email', 'admin@example.com')->delete();
        DB::table('super_admins')->where('admin_code', 'SA001')->delete();
    }
};
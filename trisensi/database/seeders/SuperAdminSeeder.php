<?php

// namespace Database\Seeders;

// use Illuminate\Database\Seeder;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Hash;

// class SuperAdminSeeder extends Seeder
// {
    /**
     * Run the database seeds.
     */
    // public function run(): void
    // {
    //     $existingUser = DB::table('users')->where('email', 'admin@example.com')->first();

    //     if (!$existingUser) {
    //         // Tambahkan akun super_admin ke tabel users
    //         $superAdminId = DB::table('users')->insertGetId([
    //             'name' => 'Super Admin',
    //             'email' => 'admin@example.com',
    //             'password' => Hash::make('password123'), // Ganti password sesuai kebutuhan
    //             'created_at' => now(),
    //             'updated_at' => now(),
    //         ]);

    //         // Dapatkan role_id untuk super_admin dari tabel roles
    //         $roleId = DB::table('roles')->where('name', 'super_admin')->value('id');

    //         // Tambahkan akun super_admin ke tabel super_admins
    //         DB::table('super_admins')->insert([
    //             'user_id' => $superAdminId,
    //             'role_id' => $roleId,
    //             'admin_code' => 'SA001',
    //             'last_login' => null,
    //             'is_active' => true,
    //             'created_at' => now(),
    //             'updated_at' => now(),
    //         ]);
    //     }
    // }
// }
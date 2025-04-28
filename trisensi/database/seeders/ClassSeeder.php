<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;    
use Illuminate\Database\Seeder;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $grades = ['X', 'XI', 'XII'];
        $majors = [
            'IPA' => 6,
            'IPS' => 4,
        ];

        foreach ($grades as $grade) {
            foreach ($majors as $major => $count) {
                for ($i = 1; $i <= $count; $i++) {
                    DB::table('classes')->insert([
                        'name' => "$grade $major $i",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
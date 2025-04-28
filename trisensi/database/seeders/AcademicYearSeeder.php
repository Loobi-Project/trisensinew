<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        for ($year = 2015; $year <= 2025; $year++) {
            AcademicYear::create([
                'batch' => $year,
                'description' => "{$year}/" . ($year + 1),
                'is_active' => 1,
            ]);
        }
    }
}
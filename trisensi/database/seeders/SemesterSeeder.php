<?php

namespace Database\Seeders;

use App\Models\Semester;
use Illuminate\Database\Seeder;

class SemesterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        for ($semester = 1; $semester <= 8; $semester++) {
            Semester::create([
                'batch' => "$semester",
            ]);
        }
    }
}
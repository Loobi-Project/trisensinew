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
        Schema::create('presence_status', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('absence_letter_id')->nullable();
            $table->string('name'); // Hadir, Izin, Sakit, Alfa
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('absence_letter_id')->references('id')->on('absence_letters')->onDelete('set null');
        });

        DB::table('presence_status')->insert([
            ['name' => 'Hadir', 'description' => 'Masuk tanpa surat', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Izin', 'description' => 'Izin dengan surat', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sakit', 'description' => 'Sakit dengan surat', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Alfa', 'description' => 'Tanpa keterangan', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presence_status');
    }
};
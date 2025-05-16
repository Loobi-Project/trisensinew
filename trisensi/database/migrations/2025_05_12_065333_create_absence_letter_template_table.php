<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAbsenceLetterTemplateTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('absence_letter_template', function (Blueprint $table) {
            $table->id(); // primary key 'id' (auto-increment)
            $table->string('name', 255);
            $table->string('file_path', 255);
            $table->timestamp('timestamp')->useCurrent(); // default to current timestamp
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absence_letter_template');
    }
}
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('presence_recaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presence_id')->constrained('presence')->onDelete('cascade');
            $table->foreignId('presence_status_id')->constrained('presence_status')->onDelete('cascade');
            $table->boolean('status');
            $table->timestamp('timestamp')->useCurrent();
        });
    }
    
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presence_recaps');
    }
};
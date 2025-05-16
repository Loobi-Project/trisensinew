<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */ public function up()
    {
        Schema::table('presence_recaps', function (Blueprint $table) {
            // Add created_at and updated_at columns if they don't exist
            if (!Schema::hasColumn('presence_recaps', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }
            if (!Schema::hasColumn('presence_recaps', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('presence_recaps', function (Blueprint $table) {
            $table->dropColumn(['created_at', 'updated_at']);
        });
    }
};
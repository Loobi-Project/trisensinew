<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubjectPresenceRecapsTable extends Migration
{
    public function up(): void
    {
        Schema::create('subject_presence_recaps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('presence_recap_id');
            $table->unsignedBigInteger('subject_id');
            $table->timestamp('timestamp')->useCurrent();
            $table->foreign('presence_recap_id')->references('id')->on('presence_recaps')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_presence_recaps');
    }
}
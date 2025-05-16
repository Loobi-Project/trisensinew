<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbsenceLetterTemplate extends Model
{
    protected $table = 'absence_letter_template';

    protected $fillable = [
        'name',
        'file_path',
        'timestamp' 
    ];

    public $timestamps = false;
}
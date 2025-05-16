<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $table = 'subjects';

    protected $fillable = [
        'teacher_id',
        'presence_recaps_id',
        'name',
        'is_active',
        'timestamp',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'timestamp' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id')->with('staff.user');
    }
}
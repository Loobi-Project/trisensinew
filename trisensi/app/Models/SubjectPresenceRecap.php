<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectPresenceRecap extends Model
{
    use HasFactory;

    protected $table = 'subject_presence_recaps';

    protected $fillable = [
        'presence_recap_id',
        'subject_id',
        'timestamp',
    ];

    public $timestamps = false;

    /**
     * Relasi ke PresenceRecap
     */
    public function presenceRecap()
    {
        return $this->belongsTo(PresenceRecap::class);
    }

    /**
     * Relasi ke Subject
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
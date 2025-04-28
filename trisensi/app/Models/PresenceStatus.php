<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PresenceStatus extends Model
{
    public $timestamps = false;
    
    protected $table = 'presence_status';
    
    protected $fillable = [
        'name',
        'description',
        'absence_letter_id',
        'is_active',
        'timestamp'
    ];

    public function presences()
    {
        return $this->hasMany(Presence::class, 'presence_status_id');
    }

    public function absenceLetter()
    {
        return $this->belongsTo(AbsenceLetter::class, 'absence_letter_id');
    }
}
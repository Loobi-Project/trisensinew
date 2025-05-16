<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PresenceRecap extends Model
{
    use HasFactory;

    protected $table = 'presence_recaps';

    protected $fillable = [
        'presence_id',
        'presence_status_id',
        'status',
        'timestamp',
    ];

    public $timestamps = false;

    public function presence()
    {
        return $this->belongsTo(Presence::class);
    }

    public function presenceStatus()
    {
        return $this->belongsTo(PresenceStatus::class, 'presence_status_id');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
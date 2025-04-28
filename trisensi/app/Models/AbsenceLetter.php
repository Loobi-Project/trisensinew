<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AbsenceLetter extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'file_path',
    ];

    public function presenceStatuses()
    {
        return $this->hasMany(PresenceStatus::class);
    }
}
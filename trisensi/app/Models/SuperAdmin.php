<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuperAdmin extends Model
{
    use HasFactory;

    protected $table = 'super_admins';

    protected $fillable = [
        'user_id',
        'role_id',
        'admin_code',
        'last_login',
        'is_active',
    ];

    protected $casts = [
        'last_login' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relasi ke User
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relasi ke Role
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
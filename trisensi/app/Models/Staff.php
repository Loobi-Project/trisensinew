<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use HasFactory;

    protected $table = 'staffs'; 

    protected $fillable = [
        'user_id',
        'role_id',
        'nip',
        'nuptk',
    ];

    /**
     * Relasi ke model User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function adminStaff()
    {
        return $this->hasOne(AdminStaff::class, 'staff_id', 'id');
    }

    public function teacher()
    {
        return $this->hasOne(Teacher::class, 'staff_id', 'id');
    }
}
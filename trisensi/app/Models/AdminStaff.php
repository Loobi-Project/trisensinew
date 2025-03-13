<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminStaff extends Model
{
    use HasFactory;

    protected $table = 'admin_staff';

    protected $fillable = [
        'staff_id',
        'name',
        'is_active',
    ];
    
    public function staff(){
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id'); 
    }
}
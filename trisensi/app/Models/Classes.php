<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Classes extends Model
{
    public $timestamps = false;
    
    protected $table = 'classes';
    
    protected $fillable = [
        'name',
    ];

    public function presences()
    {
        return $this->hasMany(Presence::class, 'classes_id');
    }
}
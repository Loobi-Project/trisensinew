<?php
// app/Models/Presence.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presence extends Model
{
    public $timestamps = false;
    
    protected $table = 'presence';
    
    protected $fillable = [
        'classes_id',
        'semester_id',
        'student_id',
        'is_active',
        'expiration_date',
        'timestamp'
    ];

    public function classes()
    {
        return $this->belongsTo(Classes::class, 'classes_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }
}
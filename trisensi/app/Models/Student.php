<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Student extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'role_id',
        'academic_year_id',
        'nis',
        'last_login',
        'is_active',
        'timestamp'
    ];
    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
    /**
     * Custom check method to check if a student exists by NIS (Student ID).
     *
     * @param string $nis
     * @return bool
     */
    public static function check($nis)
    {
        return self::where('nis', $nis)->exists();
    }
}
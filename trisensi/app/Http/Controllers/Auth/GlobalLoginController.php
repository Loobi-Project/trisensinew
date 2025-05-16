<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GlobalLoginController extends Controller
{
    /**
     * Display a login form or redirect to specific login route.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        // Default to redirect to student login as fallback
        $redirectRoute = 'student.login';
        
        // Get current URL and check for prefixes to determine user type
        $url = request()->url();
        
        if (Str::contains($url, '/superadmin')) {
            $redirectRoute = 'superadmin.login';
        } elseif (Str::contains($url, '/staffadmin')) {
            $redirectRoute = 'staffadmin.login';
        } elseif (Str::contains($url, '/staffteacher')) {
            $redirectRoute = 'staffteacher.login';
        } elseif (Str::contains($url, '/student')) {
            $redirectRoute = 'student.login';
        }
        
        // Redirect to the appropriate login page
        return redirect()->route($redirectRoute);
    }

    /**
     * Process the login attempt and redirect to appropriate controller.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // Determine which login handler to use based on the request path or a userType field
        $userType = $request->input('user_type', 'student'); // Default to student
        
        // Get current URL path and check for prefix
        $path = $request->path();
        
        if (Str::contains($path, 'superadmin')) {
            $userType = 'superadmin';
        } elseif (Str::contains($path, 'staffadmin')) {
            $userType = 'staffadmin';
        } elseif (Str::contains($path, 'staffteacher')) {
            $userType = 'staffteacher';
        } elseif (Str::contains($path, 'student')) {
            $userType = 'student';
        }
        
        // Redirect to the appropriate controller
        switch ($userType) {
            case 'superadmin':
                return app(SuperAdmin\SuperAdminAuthController::class)->login($request);
            case 'staffadmin':
                return app(StaffAdmin\StaffAdminAuthController::class)->login($request);
            case 'staffteacher':
                return app(Teacher\StaffTeacherAuthController::class)->login($request);
            case 'student':
            default:
                return app(Student\AuthenticatedSessionStudentController::class)->store($request);
        }
    }
}
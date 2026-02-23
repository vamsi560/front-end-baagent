import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Default credentials
  const defaultCredentials = {
    username: 'admin',
    password: 'ba_agent_2024'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate login delay
    setTimeout(() => {
      if (credentials.username === defaultCredentials.username && 
          credentials.password === defaultCredentials.password) {
        onLogin(true);
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Screen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/login-hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      
      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex">
        
        {/* Left Side - Hero Text Content (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 items-center justify-start pl-12 xl:pl-20">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6 drop-shadow-lg">
              Turn Ideas into
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Blueprints
              </span>
              with BA Agent AI
            </h1>
            
            
            {/* Feature Text */}
            <div className="space-y-3 mb-8">
              <p className="text-white/90 text-lg">✓ AI-Powered Document Generation</p>
              <p className="text-white/90 text-lg">✓ Instant Technical Requirements</p>
              <p className="text-white/90 text-lg">✓ Professional Architecture Diagrams</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-2/5 xl:w-1/3 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Professional Login Card with Glass Effect */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-16 mb-4">
                  <img 
                    src="/images/ValueMomentumlogo_12021110205095020211102051808.png" 
                    alt="ValueMomentum Logo" 
                    className="w-32 h-16 object-contain"
                    onError={(e) => {
                      console.log('Logo failed to load, trying fallback');
                      e.target.src = '/images/ValueMomentumlogo_12021110205095020211102051808.png';
                    }}
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                <p className="text-gray-600">Sign in to your BA Agent Portal</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={credentials.username}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-blue-900 font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Default Credentials Info */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Demo Credentials
                </h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="font-mono font-semibold">admin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Password:</span>
                    <span className="font-mono font-semibold">ba_agent_2024</span>
                  </div>
                </div>
              </div>

              {/* Additional Features */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 mb-3">Powered by ValueMomentum TSC</p>
                <p className="text-xs text-gray-600">TRD • HLD/LLD • Backlog Generation</p>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-500 text-sm">
                  © 2025 BA Agent AI • Secure Business Analysis Platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Title Overlay */}
      <div className="lg:hidden absolute top-8 left-0 right-0 z-20 px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
            BA Agent AI
          </h1>
          <p className="text-white/90 text-sm drop-shadow-md">
            Turn Ideas into Blueprints
          </p>
        </div>
      </div>

      {/* Fallback Background for Image Loading */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 -z-10"></div>
    </div>
  );
};

export default LoginPage;



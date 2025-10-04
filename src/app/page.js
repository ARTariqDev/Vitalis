
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-4 sm:mb-6 tracking-tight animate-fade-in">
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Vitalis
          </span>
        </h1>
        
        {/* Tagline */}
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-600 mb-8 sm:mb-12 font-light leading-relaxed max-w-2xl mx-auto px-4 animate-fade-in-delay-1">
          An all-in-one space biology knowledge engine
        </h2>
        
        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-500 mb-12 sm:mb-16 max-w-xl mx-auto leading-relaxed px-4 animate-fade-in-delay-2">
          Explore the fascinating intersection of life and space with cutting-edge research, 
          interactive tools, and comprehensive biological databases.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto px-4 animate-fade-in-delay-3">
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-teal-500/25 active:scale-95">
            Login
          </button>
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-teal-500 text-teal-600 font-semibold rounded-xl hover:bg-teal-500 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95">
            Sign Up
          </button>
        </div>
        
        {/* Decorative Elements */}
        <div className="mt-16 sm:mt-20 relative animate-fade-in-delay-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-r from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center max-w-4xl mx-auto">
              <div className="p-4 sm:p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Biological Data</span>
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Comprehensive space biology research and data</p>
              </div>
              
              <div className="p-4 sm:p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Space Research</span>
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Latest discoveries in astrobiology and space science</p>
              </div>
              
              <div className="p-4 sm:p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 md:col-span-1">
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Machine Learning</span>
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Intelligent analysis and insights for researchers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

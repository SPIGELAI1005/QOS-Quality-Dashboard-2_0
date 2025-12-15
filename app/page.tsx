"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Target, BarChart3, Sparkles, Shield } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showButton, setShowButton] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAccessClick = () => {
    const video = videoRef.current;
    if (!video) return;

    setShowButton(false);
    setIsPlaying(true);

    // Play the video
    video.play();

    // When video ends, show last frame for 1 second, then navigate
    video.onended = () => {
      // Seek to last frame
      video.currentTime = video.duration - 0.1;
      video.pause();

      // Wait 1 second, then navigate to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    };
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col relative overflow-hidden">
      {/* Dark overlay for better text readability */}
      <div className="fixed inset-0 bg-black/40 z-[1] pointer-events-none" />

      {/* Animated Background Lines */}
      <div className="animated-lines-bg z-[2]" />
      
      {/* Glass overlay for depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-background/60 via-background/40 to-primary/10 backdrop-blur-[1px] z-[3] pointer-events-none" />

      {/* Full Screen Video - in front of background layers */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-auto object-contain z-[4]"
        preload="auto"
        style={{ 
          display: 'block',
          width: '50%'
        }}
        onError={(e) => {
          console.error('Video failed to load:', e);
        }}
        onLoadedMetadata={(e) => {
          const video = e.target as HTMLVideoElement;
          // Freeze on first frame
          video.currentTime = 0;
          video.pause();
        }}
      >
        <source src="/Media/QOS Logo Intro.MP4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
      {/* Main Title - Top of page */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center space-y-2 animate-fade-in z-20 w-full max-w-5xl px-4">
        <h1 className="text-xl md:text-2xl font-bold text-[#00FF00] mx-auto leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,255,0,0.3)]">
          Empowering Excellence Through
          <span className="block mt-1 bg-gradient-to-r from-[#00FF00] via-[#00FF88] to-[#00FF00] bg-clip-text text-transparent">
            Data-Driven Quality Management
          </span>
        </h1>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
        <div className="w-full max-w-[1600px] flex items-center justify-center relative mx-auto">
          
          {/* Left Side Boxes - positioned 10% more towards center, may overlap with video */}
          <div className="absolute left-[35%] flex flex-col gap-6 -translate-x-full pr-10 w-full max-w-[400px]">
            <div className="group relative flex flex-col items-center text-center space-y-4 p-8 rounded-2xl bg-gradient-to-br from-card/35 via-card/25 to-card/35 border-2 border-[#00FF00]/40 backdrop-blur-2xl hover:border-[#00FF00]/60 hover:shadow-[0_10px_40px_0_rgba(0,255,0,0.25)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full overflow-hidden">
              {/* Glass shine effect - diagonal green highlight */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00FF00]/30 to-transparent -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform ease-in-out" style={{ width: '200%', height: '200%', transitionDuration: '1333ms' }}></div>
              </div>
              <div className="p-4 rounded-full bg-gradient-to-br from-[#00FF00]/25 via-[#00FF00]/15 to-[#00FF00]/25 backdrop-blur-md border-2 border-[#00FF00]/40 group-hover:scale-105 group-hover:border-[#00FF00]/60 transition-all duration-300 relative z-10">
                <TrendingUp className="h-9 w-9 text-[#00FF00] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-[#00FF00] group-hover:text-[#00FF88] transition-colors duration-300 leading-tight relative z-10">
                Real-Time<br />PPM Tracking
              </h3>
              <p className="text-[0.95rem] text-[#00FF00]/85 leading-relaxed px-3 relative z-10">
                Monitor Parts Per Million and defects related metrics across all sites with instant updates.
              </p>
            </div>

            <div className="group relative flex flex-col items-center text-center space-y-4 p-8 rounded-2xl bg-gradient-to-br from-card/35 via-card/25 to-card/35 border-2 border-[#00FF00]/40 backdrop-blur-2xl hover:border-[#00FF00]/60 hover:shadow-[0_10px_40px_0_rgba(0,255,0,0.25)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full overflow-hidden">
              {/* Glass shine effect - diagonal green highlight */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00FF00]/30 to-transparent -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform ease-in-out" style={{ width: '200%', height: '200%', transitionDuration: '1333ms' }}></div>
              </div>
              <div className="p-4 rounded-full bg-gradient-to-br from-[#00FF00]/25 via-[#00FF00]/15 to-[#00FF00]/25 backdrop-blur-md border-2 border-[#00FF00]/40 group-hover:scale-105 group-hover:border-[#00FF00]/60 transition-all duration-300 relative z-10">
                <Target className="h-9 w-9 text-[#00FF00] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-[#00FF00] group-hover:text-[#00FF88] transition-colors duration-300 leading-tight relative z-10">
                Comprehensive<br />Analysis
              </h3>
              <p className="text-[0.95rem] text-[#00FF00]/85 leading-relaxed px-3 relative z-10">
                Deep insights into customer, supplier, and internal quality performance.
              </p>
            </div>
          </div>

          {/* Center - Video is in background, centered at 50% width */}
          {/* The video is already positioned at left-1/2 -translate-x-1/2 with 50% width, so it's centered */}

          {/* Right Side Boxes - positioned 10% more towards center, may overlap with video */}
          <div className="absolute right-[35%] flex flex-col gap-6 translate-x-full pl-10 w-full max-w-[400px]">
            <div className="group relative flex flex-col items-center text-center space-y-4 p-8 rounded-2xl bg-gradient-to-br from-card/35 via-card/25 to-card/35 border-2 border-[#00FF00]/40 backdrop-blur-2xl hover:border-[#00FF00]/60 hover:shadow-[0_10px_40px_0_rgba(0,255,0,0.25)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full overflow-hidden">
              {/* Glass shine effect - diagonal green highlight */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00FF00]/30 to-transparent -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform ease-in-out" style={{ width: '200%', height: '200%', transitionDuration: '1333ms' }}></div>
              </div>
              <div className="p-4 rounded-full bg-gradient-to-br from-[#00FF00]/25 via-[#00FF00]/15 to-[#00FF00]/25 backdrop-blur-md border-2 border-[#00FF00]/40 group-hover:scale-105 group-hover:border-[#00FF00]/60 transition-all duration-300 relative z-10">
                <Sparkles className="h-9 w-9 text-[#00FF00] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-[#00FF00] group-hover:text-[#00FF88] transition-colors duration-300 leading-tight relative z-10">
                AI-Powered<br />Insights
              </h3>
              <p className="text-[0.95rem] text-[#00FF00]/85 leading-relaxed px-3 relative z-10">
                Get actionable recommendations powered by advanced machine data interpretation.
              </p>
            </div>

            <div className="group relative flex flex-col items-center text-center space-y-4 p-8 rounded-2xl bg-gradient-to-br from-card/35 via-card/25 to-card/35 border-2 border-[#00FF00]/40 backdrop-blur-2xl hover:border-[#00FF00]/60 hover:shadow-[0_10px_40px_0_rgba(0,255,0,0.25)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full overflow-hidden">
              {/* Glass shine effect - diagonal green highlight */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00FF00]/30 to-transparent -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform ease-in-out" style={{ width: '200%', height: '200%', transitionDuration: '1333ms' }}></div>
              </div>
              <div className="p-4 rounded-full bg-gradient-to-br from-[#00FF00]/25 via-[#00FF00]/15 to-[#00FF00]/25 backdrop-blur-md border-2 border-[#00FF00]/40 group-hover:scale-105 group-hover:border-[#00FF00]/60 transition-all duration-300 relative z-10">
                <Shield className="h-9 w-9 text-[#00FF00] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-[#00FF00] group-hover:text-[#00FF88] transition-colors duration-300 leading-tight relative z-10">
                Quality<br />AI-ssurance
              </h3>
              <p className="text-[0.95rem] text-[#00FF00]/85 leading-relaxed px-3 relative z-10">
                Comprehensive quality control and assurance across all operations using AI.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button - Bottom of page */}
        {showButton && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={handleAccessClick}
              className="group relative px-10 py-4 rounded-xl font-semibold text-base text-[#00FF00] 
                       bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-xl 
                       border-2 border-[#00FF00]/60 shadow-[0_4px_20px_0_rgba(0,255,0,0.3)] 
                       hover:bg-gradient-to-br hover:from-white/30 hover:via-white/25 hover:to-white/20 
                       hover:border-[#00FF00]/80 hover:shadow-[0_6px_30px_0_rgba(0,255,0,0.4)]
                       transition-all duration-300 ease-out
                       flex items-center gap-2
                       before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-[#00FF00]/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
            >
              <span className="relative z-10 tracking-wide font-medium">Generate QOS Report ET</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-[#00FF00]/40 bg-gradient-to-br from-background/90 via-background/70 to-background/90 backdrop-blur-xl py-3 px-6 mt-auto z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <p className="text-xs text-[#00FF00]/95 font-semibold tracking-wide">
            © 2025 QOS ET Report. Driving Excellence in Operations and Quality.
          </p>
          <div className="flex items-center space-x-2.5">
            <BarChart3 className="h-4 w-4 text-[#00FF00] animate-pulse" />
            <span className="text-xs text-[#00FF00]/95 font-semibold tracking-wide">Quality Management System</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

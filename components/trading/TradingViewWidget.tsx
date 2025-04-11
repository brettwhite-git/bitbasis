import React, { useEffect, useRef, memo, useState } from 'react';

declare global {
  interface Window {
    TradingView: any; // Define TradingView type on window
  }
}

function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Effect to load the TradingView script
  useEffect(() => {
    const scriptId = 'tradingview-tv-script';
    if (document.getElementById(scriptId)) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => console.error("TradingView script failed to load.");
    document.head.appendChild(script);

    // Cleanup script tag on component unmount
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Effect to initialize the widget once script is loaded and container is available
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.TradingView) {
      return;
    }

    // Ensure container is empty before initializing
    containerRef.current.innerHTML = '';

    const widgetOptions = {
      // Basic options
      width: "100%",
      height: "100%",
      symbol: "BITSTAMP:BTCUSD",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "3", // Style 3 from original config
      locale: "en",

      // Toolbar customization
      toolbar_bg: "#f1f3f6", // This might be overridden by dark theme
      hide_top_toolbar: false, // Show top toolbar
      // hide_legend: true, // Example: Optionally hide legend
      enable_publishing: false,
      allow_symbol_change: true,
      
      // Data and features
      withdateranges: true, // Show date ranges
      save_image: false,

      // Colors (use defaults from dark theme for stability, can try originals later)
      // backgroundColor: "rgba(18, 18, 18, 1)", 
      // gridColor: "rgba(255, 255, 255, 0.05)",

      // *** Studies ***
      studies: [
        "STD;Bollinger_Bands"
      ],
      
      // Container ID - must match the div id
      container_id: "tradingview-widget-container-div"
    };

    // Create the widget
    new window.TradingView.widget(widgetOptions);

  }, [isScriptLoaded]); // Re-run when script is loaded

  return (
    // The container div that TradingView will target
    <div 
      id="tradingview-widget-container-div" 
      ref={containerRef} 
      style={{ height: '100%', width: '100%' }}
    />
    // No separate copyright div needed, TradingView widget adds its own if applicable
  );
}

export default memo(TradingViewWidget); 
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

interface MempoolAnimationProps {
  height?: number;
  opacity?: number;
  blockCount?: number;
  fullPage?: boolean;
  blockSize?: { min: number; max: number };
  dropInterval?: number;
}

export function MempoolAnimation({ 
  height = 400, 
  opacity = 0.15,
  blockCount = 50,
  fullPage = false,
  blockSize = { min: 30, max: 55 },
  dropInterval = 300
}: MempoolAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? (fullPage ? document.body.scrollHeight : height) : height,
  });

  useEffect(() => {
    // Early return if SSR or canvas not available
    if (typeof window === 'undefined' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const { Engine, Render, World, Bodies, Body, Runner, Common } = Matter;

    // Create engine with improved settings
    const engine = Engine.create({
      enableSleeping: true,
      constraintIterations: 2,  // Reduce physics iterations for performance
    });

    engineRef.current = engine;
    
    // Calculate canvas dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = fullPage ? Math.max(window.innerHeight, document.body.scrollHeight) : height;
    setDimensions({ width: canvasWidth, height: canvasHeight });
    
    // Create renderer with optimized settings
    const render = Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: canvasWidth,
        height: canvasHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: Math.min(window.devicePixelRatio, 2), // Limit pixelRatio for performance
        hasBounds: true,
      }
    });

    // Create invisible boundaries
    const wallOptions = { 
      isStatic: true, 
      render: { visible: false },
      collisionFilter: { group: 1 }
    };

    // Create boundaries (ground and walls)
    const ground = Bodies.rectangle(
      canvasWidth / 2, 
      canvasHeight + 50, 
      canvasWidth * 2, 
      100, 
      wallOptions
    );
    
    const leftWall = Bodies.rectangle(
      -50, 
      canvasHeight / 2, 
      100, 
      canvasHeight * 2, 
      wallOptions
    );
    
    const rightWall = Bodies.rectangle(
      canvasWidth + 50, 
      canvasHeight / 2, 
      100, 
      canvasHeight * 2, 
      wallOptions
    );
    
    World.add(engine.world, [ground, leftWall, rightWall]);

    // Create and add a new block
    const addNewBlock = () => {
      if (!engineRef.current) return;
      
      // Randomize block size within the specified range
      const size = blockSize.min + Math.random() * (blockSize.max - blockSize.min);
      
      // Determine block color (Bitcoin orange or dark gray)
      const isOrangeBlock = Math.random() > 0.7;
      const orangeColor = '#F7931A';
      const darkColor = '#171923';
      
      // Calculate random starting position
      const xPos = Math.random() * (canvasWidth - size);
      
      // Create block with appropriate styling
      const block = Bodies.rectangle(
        xPos, 
        -size, // Start above the viewport
        size, 
        size, 
        {
          render: {
            fillStyle: isOrangeBlock ? orangeColor : darkColor,
            strokeStyle: orangeColor,
            lineWidth: isOrangeBlock ? 0 : 1,
            opacity: isOrangeBlock ? Math.min(opacity + 0.1, 1) : opacity,
          },
          chamfer: { radius: size / 10 }, // Rounded corners
          friction: 0.3,
          restitution: 0.2, // Slight bounce
          density: 0.001, // Lower density for better performance
          sleepThreshold: 60, // Allow blocks to go to sleep quickly
        }
      );
      
      World.add(engine.world, block);
      
      // Remove blocks that are out of view to improve performance
      const bodies = engine.world.bodies;
      if (bodies.length > blockCount + 3) { // +3 for the walls and ground
        // Remove oldest blocks (skipping the first 3 which are our walls and ground)
        for (let i = 3; i < bodies.length - blockCount; i++) {
          World.remove(engine.world, bodies[i]);
        }
      }
    };

    // Start the engine with Runner (recommended approach)
    const runner = Runner.create({
      isFixed: true, // Fixed time step for consistent simulation
      delta: 1000 / 60, // Target 60 FPS
    });
    Runner.run(runner, engine);
    runnerRef.current = runner;
    
    // Start the renderer
    Render.run(render);
    
    // Add blocks on interval
    const interval = setInterval(addNewBlock, dropInterval);
    
    // Handle resize for responsive canvas
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = fullPage ? Math.max(window.innerHeight, document.body.scrollHeight) : height;
      
      // Update dimensions state
      setDimensions({ width: newWidth, height: newHeight });
      
      // Update render bounds
      render.options.width = newWidth;
      render.options.height = newHeight;
      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      
      // Update boundary positions
      Body.setPosition(ground, { 
        x: newWidth / 2, 
        y: newHeight + 50
      });
      
      Body.setPosition(rightWall, {
        x: newWidth + 50,
        y: newHeight / 2
      });
    };
    
    window.addEventListener('resize', handleResize);

    // Add initial blocks to make it visually interesting immediately
    for (let i = 0; i < 10; i++) {
      setTimeout(addNewBlock, i * 100);
    }

    // Cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      
      // Properly cleanup Matter.js resources
      if (render) Render.stop(render);
      if (runnerRef.current) Runner.stop(runnerRef.current);
      if (engine.world) World.clear(engine.world);
      if (engine) Engine.clear(engine);
      
      engineRef.current = null;
      runnerRef.current = null;
    };
  }, [height, opacity, blockCount, fullPage, blockSize, dropInterval]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none" 
      style={{ 
        height: dimensions.height,
        width: dimensions.width,
        minHeight: fullPage ? '100vh' : undefined,
        position: 'fixed',
        top: 0,
        left: 0
      }}
      aria-hidden="true"
    />
  );
} 
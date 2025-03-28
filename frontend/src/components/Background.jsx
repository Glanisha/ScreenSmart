import React, { useState } from "react";
import {
  useMotionValue,
  motion,
  useMotionTemplate,
  useSpring,
} from "framer-motion";

export default function Background ({
  children,
  className = "",
  containerClassName = "",
  dotOpacity = 0.5,
  hoverScale = 1.2,
  dotSpacing = 20,
}) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);

  const springConfig = { stiffness: 150, damping: 15 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  const getDotsPattern = (color, opacity, scale = 1) => {
    const circleRadius = 1.75 * scale;
    const circleX = 10;
    const circleY = 10;

    return `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='${
      dotSpacing * scale
    }' height='${
      dotSpacing * scale
    }' fill='none'%3E%3Ccircle fill='${color}' opacity='${opacity}' id='pattern-circle' cx='${circleX}' cy='${circleY}' r='${circleRadius}'%3E%3C/circle%3E%3C/svg%3E")`;
  };

  const patterns = {
    light: {
      default: getDotsPattern("%23d4d4d4", dotOpacity),
      hover: getDotsPattern("%236366f1", dotOpacity * 1.5, hoverScale),
    },
    dark: {
      default: getDotsPattern("%23404040", dotOpacity),
      hover: getDotsPattern("%238183f4", dotOpacity * 1.5, hoverScale),
    },
  };

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    if (!currentTarget) return;
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    if (!isHovering) setIsHovering(true);
  }

  function handleMouseLeave() {
    setIsHovering(false);
  }

  const hoverSize = isHovering ? "250px" : "200px";

  return (
    <div
      className={`group relative flex w-full items-center justify-center bg-white dark:bg-black ${containerClassName}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Default dot patterns */}
      <div
        className="pointer-events-none absolute inset-0 dark:hidden transition-opacity duration-300"
        style={{
          backgroundImage: patterns.light.default,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block transition-opacity duration-300"
        style={{
          backgroundImage: patterns.dark.default,
        }}
      />

      {/* Hover effect dot patterns without 3D transforms */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:hidden"
          style={{
            backgroundImage: patterns.light.hover,
            backgroundSize: isHovering
              ? `${hoverScale * 16}px ${hoverScale * 16}px`
              : "16px 16px",
            backgroundPosition: `${mouseXSpring.get() % 16}px ${
              mouseYSpring.get() % 16
            }px`,
            WebkitMaskImage: useMotionTemplate`
              radial-gradient(
                ${hoverSize} circle at ${mouseXSpring}px ${mouseYSpring}px,
                black 0%,
                transparent 100%
              )
            `,
            maskImage: useMotionTemplate`
              radial-gradient(
                ${hoverSize} circle at ${mouseXSpring}px ${mouseYSpring}px,
                black 0%,
                transparent 100%
              )
            `,
            transition: "background-size 0.3s ease-out",
          }}
        />

        <motion.div
          className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:block"
          style={{
            backgroundImage: patterns.dark.hover,
            backgroundSize: isHovering
              ? `${hoverScale * 16}px ${hoverScale * 16}px`
              : "16px 16px",
            backgroundPosition: `${mouseXSpring.get() % 16}px ${
              mouseYSpring.get() % 16
            }px`,
            WebkitMaskImage: useMotionTemplate`
              radial-gradient(
                ${hoverSize} circle at ${mouseXSpring}px ${mouseYSpring}px,
                black 0%,
                transparent 100%
              )
            `,
            maskImage: useMotionTemplate`
              radial-gradient(
                ${hoverSize} circle at ${mouseXSpring}px ${mouseYSpring}px,
                black 0%,
                transparent 100%
              )
            `,
            transition: "background-size 0.3s ease-out",
          }}
        />
      </div>

      <div className={`relative z-20 ${className}`}>{children}</div>
    </div>
  );
};
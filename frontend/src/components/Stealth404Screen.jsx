import React, { useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../config';

export const Stealth404Screen = ({ onUnlock }) => {
  const containerRef = useRef(null);
  const inlineZeroRef = useRef(null);
  const titleRef = useRef(null);
  const flyingZeroRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const timeoutIdRef = useRef(null);

  const apiBase = getApiBaseUrl();

  // Physics animation engine identical to VGS Punch
  useEffect(() => {
    const inlineZero = inlineZeroRef.current;
    const titleEl = titleRef.current;
    const flyEl = flyingZeroRef.current;
    const container = containerRef.current;

    if (!inlineZero || !titleEl || !flyEl || !container) return;

    let isRunning = true;

    function runCycle() {
      if (!isRunning) return;

      inlineZero.style.visibility = 'hidden';
      flyEl.style.opacity = '1';
      flyEl.style.display = 'block';

      const targetRect = inlineZero.getBoundingClientRect();
      const titleRect = titleEl.getBoundingClientRect();

      const zeroW = targetRect.width > 0 ? targetRect.width : 44;
      const zeroH = targetRect.height > 0 ? targetRect.height : 68;

      const bounceSurfaceY = titleRect.top - 2;

      // Waypoints
      const p0 = { x: titleRect.left + 15, y: -90 };
      const p1 = { x: titleRect.left + titleRect.width * 0.22, y: bounceSurfaceY };
      const p2 = { x: titleRect.left + titleRect.width * 0.74, y: bounceSurfaceY };
      const p3 = { x: targetRect.left + targetRect.width / 2, y: targetRect.bottom };

      // Phase durations
      const tDrop = 0.50;
      const tSquash1 = 0.08;
      const tArc1 = 0.42;
      const tSquash2 = 0.08;
      const tLaunch = 0.70;
      const tSettle = 0.52;

      let startTime = null;

      function renderFrame(ts) {
        if (!isRunning) return;
        if (!startTime) startTime = ts;
        const elapsed = (ts - startTime) / 1000;

        let currentX = p0.x;
        let currentY = p0.y;
        let scaleX = 1;
        let scaleY = 1;
        let rotate = 0;
        let textGlow = false;

        if (elapsed < tDrop) {
          const u = elapsed / tDrop;
          currentX = p0.x + (p1.x - p0.x) * u;
          currentY = p0.y + (p1.y - p0.y) * (u * u);
          const stretch = 0.16 * u;
          scaleX = 1 - stretch * 0.5;
          scaleY = 1 + stretch;
          rotate = -12 * (1 - u);
        } else if (elapsed < tDrop + tSquash1) {
          const u = (elapsed - tDrop) / tSquash1;
          currentX = p1.x;
          currentY = p1.y;
          const sq = Math.sin(u * Math.PI) * 0.30;
          scaleX = 1 + sq;
          scaleY = 1 - sq;
          rotate = -3;
          textGlow = true;
        } else if (elapsed < tDrop + tSquash1 + tArc1) {
          const u = (elapsed - (tDrop + tSquash1)) / tArc1;
          currentX = p1.x + (p2.x - p1.x) * u;
          const arcOffset = 4 * 75 * u * (1 - u);
          currentY = p1.y + (p2.y - p1.y) * u - arcOffset;
          const vy = (1 - 2 * u);
          scaleX = 1 - 0.08 * Math.abs(vy);
          scaleY = 1 + 0.08 * Math.abs(vy);
          rotate = -3 + 12 * u;
        } else if (elapsed < tDrop + tSquash1 + tArc1 + tSquash2) {
          const u = (elapsed - (tDrop + tSquash1 + tArc1)) / tSquash2;
          currentX = p2.x;
          currentY = p2.y;
          const sq = Math.sin(u * Math.PI) * 0.25;
          scaleX = 1 + sq;
          scaleY = 1 - sq;
          rotate = 6;
          textGlow = true;
        } else if (elapsed < tDrop + tSquash1 + tArc1 + tSquash2 + tLaunch) {
          const u = (elapsed - (tDrop + tSquash1 + tArc1 + tSquash2)) / tLaunch;
          currentX = p2.x + (p3.x - p2.x) * u;
          const arcOffset = 4 * 130 * u * (1 - u);
          currentY = (1 - u) * p2.y + u * p3.y - arcOffset;
          const vy = (1 - 2 * u);
          scaleX = 1 - 0.12 * Math.abs(vy);
          scaleY = 1 + 0.12 * Math.abs(vy);
          rotate = 6 * (1 - u);
        } else if (elapsed < tDrop + tSquash1 + tArc1 + tSquash2 + tLaunch + tSettle) {
          const u = (elapsed - (tDrop + tSquash1 + tArc1 + tSquash2 + tLaunch)) / tSettle;
          currentX = p3.x;
          const decay = Math.exp(-u * 5.5);
          const bounceDist = 18 * decay * Math.abs(Math.cos(u * Math.PI * 3.5));
          currentY = p3.y - bounceDist;
          const sq = 0.22 * decay * Math.sin(u * Math.PI * 3.5);
          scaleX = 1 + sq;
          scaleY = 1 - sq;
          rotate = 0;
          if (u < 0.25) textGlow = true;
        } else {
          currentX = p3.x;
          currentY = p3.y;
          scaleX = 1;
          scaleY = 1;
          rotate = 0;

          flyEl.style.left = (currentX - zeroW / 2) + 'px';
          flyEl.style.top = (currentY - zeroH) + 'px';
          flyEl.style.transform = 'scale(1) rotate(0deg)';
          flyEl.style.textShadow = 'none';

          timeoutIdRef.current = setTimeout(() => {
            if (!isRunning) return;
            inlineZero.style.visibility = 'visible';
            flyEl.style.opacity = '0';
          }, 120);

          timeoutIdRef.current = setTimeout(runCycle, 3800);
          return;
        }

        flyEl.style.left = (currentX - zeroW / 2) + 'px';
        flyEl.style.top = (currentY - zeroH) + 'px';
        flyEl.style.transform = `scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) rotate(${rotate.toFixed(1)}deg)`;
        flyEl.style.textShadow = textGlow ? '0 0 25px rgba(220, 38, 38, 0.6)' : 'none';

        animFrameIdRef.current = requestAnimationFrame(renderFrame);
      }

      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    }

    runCycle();

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  const clickSequenceRef = useRef([]);
  const clickTimeoutRef = useRef(null);

  const handleLetterClick = (letterId, e) => {
    e.stopPropagation();
    clickSequenceRef.current.push(letterId);
    if (clickSequenceRef.current.length > 8) {
      clickSequenceRef.current.shift();
    }

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      clickSequenceRef.current = [];
    }, 6000);

    const seq = clickSequenceRef.current.join('-');
    // Pattern: 1st R (1) -> O (2) -> E (3) -> last R (4)
    if (
      seq.includes('r1-o-e-r3') ||
      seq.includes('r1-o-e-r2') ||
      seq.includes('r-o-e-r')
    ) {
      clickSequenceRef.current = [];
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      onUnlock();
    }
  };

  // Relaxed & Forgiving Shortcut Detector (Generous 6-second window)
  useEffect(() => {
    let lastCtrlYTime = 0;
    let keySequenceBuffer = [];
    let sequenceTimeout = null;

    const triggerUnlock = () => {
      lastCtrlYTime = 0;
      keySequenceBuffer = [];
      if (sequenceTimeout) clearTimeout(sequenceTimeout);
      onUnlock();
    };

    const handleKeyDown = (e) => {
      const keyLow = (e.key || '').toLowerCase();
      if (['control', 'alt', 'shift', 'meta'].includes(keyLow)) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;

      // 1. Check Step 1: User presses Ctrl+Y (or Ctrl+Alt+Y)
      if (isCtrl && keyLow === 'y') {
        e.preventDefault();
        lastCtrlYTime = Date.now();
      }

      // 2. Check Step 2: User presses Alt+S (or Ctrl+Alt+S) within 6 seconds of Step 1!
      if (isAlt && keyLow === 's') {
        e.preventDefault();
        const now = Date.now();
        // If Ctrl+Y was pressed anytime in the last 6 seconds, UNLOCK IMMEDIATELY!
        if (now - lastCtrlYTime <= 6000 && lastCtrlYTime > 0) {
          triggerUnlock();
          return;
        }
      }

      // 3. Fallback Sliding Window Buffer for custom sequences & full safety
      const mods = [];
      if (isCtrl) mods.push('Ctrl');
      if (isAlt) mods.push('Alt');
      if (e.shiftKey) mods.push('Shift');

      const combo = (mods.length > 0 ? mods.join('+') + '+' : '') + keyLow;
      keySequenceBuffer.push(combo);
      if (keySequenceBuffer.length > 6) keySequenceBuffer.shift();

      if (sequenceTimeout) clearTimeout(sequenceTimeout);
      sequenceTimeout = setTimeout(() => {
        keySequenceBuffer = [];
        lastCtrlYTime = 0;
      }, 6000); // 6-second generous timeout

      const joined = keySequenceBuffer.join('->').toLowerCase().replace(/\s+/g, '');
      if (joined.includes('ctrl+y->alt+s')) {
        triggerUnlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock]);

  return (
    <div
      ref={containerRef}
      className="login-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: '100vw',
        height: '100vh',
        background: '#ffffff',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#000000',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        boxSizing: 'border-box',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      <div
        className="fake-error-box"
        style={{
          maxWidth: '960px',
          width: '92%',
          background: '#ffffff',
          padding: '1.5rem'
        }}
      >
        <div
          className="fake-error-content-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '3.5rem'
          }}
        >
          {/* Left Error Info */}
          <div className="fake-error-left" style={{ flex: 1, maxWidth: '520px' }}>
            <div
              ref={titleRef}
              className="fake-error-title"
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '1.25rem',
                letterSpacing: '-0.5px',
                lineHeight: 1.25
              }}
            >
              HTTP 404 - Page Not Found
            </div>

            <div
              className="fake-error-desc"
              style={{
                fontSize: '0.95rem',
                color: '#334155',
                lineHeight: 1.65,
                marginBottom: '1.75rem'
              }}
            >
              The requested URL /index.php?api_service=call_notify was not found on this server.
              <br /><br />
              Unable to load page data or establish connection to backend service.
            </div>

            <div
              className="fake-error-footer"
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                fontFamily: "'JetBrains Mono', Consolas, monospace",
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1.25rem'
              }}
            >
              <span>Server: Apache/2.4.58 (Unix)</span>
              <span>Error: ERR_HTTP2_PROTOCOL_ERROR</span>
            </div>
          </div>

          {/* Right Big Red 4 0 4 ERROR */}
          <div
            className="fake-error-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: '3.5rem',
              borderLeft: '2px solid #e2e8f0',
              whiteSpace: 'nowrap'
            }}
          >
            <div
              className="fake-error-big-red"
              style={{
                fontSize: '4.8rem',
                fontWeight: 900,
                color: '#dc2626',
                lineHeight: 1,
                letterSpacing: '-2px',
                fontFamily: "'JetBrains Mono', Consolas, monospace",
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'baseline'
              }}
            >
              <span>4</span>
              <span
                ref={inlineZeroRef}
                className="bounce-zero"
                style={{
                  display: 'inline-block',
                  width: '0.62em',
                  textAlign: 'center',
                  visibility: 'hidden'
                }}
              >
                0
              </span>
              <span>4</span>
              <span>&nbsp;&nbsp;</span>
              <span style={{ display: 'inline-flex', cursor: 'default', userSelect: 'none' }}>
                <span onClick={(e) => handleLetterClick('e', e)} style={{ cursor: 'default' }}>E</span>
                <span onClick={(e) => handleLetterClick('r1', e)} style={{ cursor: 'default' }}>R</span>
                <span onClick={(e) => handleLetterClick('r2', e)} style={{ cursor: 'default' }}>R</span>
                <span onClick={(e) => handleLetterClick('o', e)} style={{ cursor: 'default' }}>O</span>
                <span onClick={(e) => handleLetterClick('r3', e)} style={{ cursor: 'default' }}>R</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Physics Flying Zero Element */}
      <div
        ref={flyingZeroRef}
        id="flyingZero"
        style={{
          position: 'fixed',
          fontSize: '4.8rem',
          fontWeight: 900,
          color: '#dc2626',
          lineHeight: 1,
          letterSpacing: '-2px',
          fontFamily: "'JetBrains Mono', Consolas, monospace",
          pointerEvents: 'none',
          zIndex: 1000000,
          display: 'inline-block',
          transformOrigin: '50% 100%',
          willChange: 'transform, left, top',
          margin: 0,
          padding: 0
        }}
      >
        0
      </div>
    </div>
  );
};

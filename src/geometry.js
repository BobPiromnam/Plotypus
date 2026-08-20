(function (global) {
  "use strict";

  function rectCenter(rect) {
    return { x: (rect.x0 + rect.x1) / 2, y: (rect.y0 + rect.y1) / 2 };
  }

  function rectFromPosition(position, dimensions) {
    return {
      x0: position.x,
      y0: position.y,
      x1: position.x + dimensions.width,
      y1: position.y + dimensions.height
    };
  }

  function inflateRect(rect, pad) {
    return {
      x0: rect.x0 - pad,
      y0: rect.y0 - pad,
      x1: rect.x1 + pad,
      y1: rect.y1 + pad
    };
  }

  function rectArea(rect) {
    return Math.max(0, rect.x1 - rect.x0) * Math.max(0, rect.y1 - rect.y0);
  }

  function rectsOverlap(a, b) {
    return !(a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0);
  }

  function rectOverlapArea(a, b) {
    const width = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const height = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return width > 0 && height > 0 ? width * height : 0;
  }

  function outsideRectArea(rect, bounds) {
    return rectArea(rect) - rectOverlapArea(rect, bounds);
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x0 && point.x <= rect.x1 && point.y >= rect.y0 && point.y <= rect.y1;
  }

  function segmentsCross(a, b, c, d) {
    function ccw(p1, p2, p3) {
      return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    }
    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  }

  function segmentIntersectsRect(start, end, rect) {
    if (pointInRect(start, rect) || pointInRect(end, rect)) return true;
    const corners = [
      { x: rect.x0, y: rect.y0 },
      { x: rect.x1, y: rect.y0 },
      { x: rect.x1, y: rect.y1 },
      { x: rect.x0, y: rect.y1 }
    ];
    return corners.some((corner, index) => {
      const next = corners[(index + 1) % corners.length];
      return segmentsCross(start, end, corner, next);
    });
  }

  global.PLOTYPUS_GEOMETRY = Object.freeze({
    inflateRect,
    outsideRectArea,
    pointInRect,
    rectArea,
    rectCenter,
    rectFromPosition,
    rectOverlapArea,
    rectsOverlap,
    segmentIntersectsRect,
    segmentsCross
  });
})(window);

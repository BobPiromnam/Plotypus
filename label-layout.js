(function (global) {
  "use strict";

  const weights = Object.freeze({
    labelOverlapBase: 24000,
    labelOverlapArea: 44,
    mapOverlapBase: 12000,
    mapOverlapArea: 22,
    outsideCanvasArea: 1600,
    leaderLineLength: 3.5,
    leaderLineSoftMaxRatio: 0.2,
    leaderLineSoftMaxMin: 155,
    leaderLineExcessArea: 1.2,
    sideChange: 110,
    leaderLineCrossing: 42000,
    leaderLabelCrossing: 52000,
    boxObstacleBase: 36000,
    boxObstacleArea: 95,
    leaderBoxCrossing: 9500,
    markerOverlapBase: 9000,
    markerOverlapArea: 90,
    leaderMarkerCrossing: 2600,
    sameSideCrowding: 90,
    leaderDirection: 900,
    verticalOrderInversion: 18000,
    offMapBonus: 4200,
    outsideMapBoundsBonus: 900,
    nearMapCenterPenalty: 1200,
    adjacentSideChange: 90000,
    oppositeSideChange: 160000,
    radialSideMismatch: 38000
  });

  function create(dependencies) {
    const {
      clamp,
      clampLabelBaseline,
      comparePlacementOrder,
      createSlots,
      getDesignerHorizontalOffset,
      getDesignerLineOffset,
      getDesignerVerticalOffset,
      getBoundary,
      getCategory,
      getCategoryMarkerSize,
      getLabelKey,
      labelBackgroundRect,
      labelBaselineForCenter,
      labelFontSize,
      labelKeyText,
      labelRect,
      labelVisualHeight,
      lineEnd,
      makeLabelBox,
      mapBoundsRect,
      outsideRectArea,
      preferredSide,
      rectOverlapArea,
      rectsOverlap,
      referenceSideOptions,
      segmentIntersectsRect,
      segmentsCross
    } = dependencies || {};
    const required = {
      clamp,
      clampLabelBaseline,
      comparePlacementOrder,
      createSlots,
      getDesignerHorizontalOffset,
      getDesignerLineOffset,
      getDesignerVerticalOffset,
      getBoundary,
      getCategory,
      getCategoryMarkerSize,
      getLabelKey,
      labelBackgroundRect,
      labelBaselineForCenter,
      labelFontSize,
      labelKeyText,
      labelRect,
      labelVisualHeight,
      lineEnd,
      makeLabelBox,
      mapBoundsRect,
      outsideRectArea,
      preferredSide,
      rectOverlapArea,
      rectsOverlap,
      referenceSideOptions,
      segmentIntersectsRect,
      segmentsCross
    };
    const missing = Object.keys(required).filter(key => typeof required[key] !== "function");
    if (missing.length) throw new TypeError(`Plotypus label layout is missing dependencies: ${missing.join(", ")}.`);

    function oppositeSide(side) {
      if (side === "left") return "right";
      if (side === "right") return "left";
      if (side === "top") return "bottom";
      return "top";
    }

    function compatibleSideOrder(preferred) {
      const adjacent = {
        left: ["top", "bottom"],
        right: ["top", "bottom"],
        top: ["left", "right"],
        bottom: ["left", "right"]
      };
      return [preferred].concat(adjacent[preferred] || ["left", "right"]);
    }

    function candidateSideOrder(preferred) {
      return compatibleSideOrder(preferred).concat(oppositeSide(preferred));
    }

    function makeLabelPlacement(item, candidate) {
      return {
        ...item,
        labelSide: candidate.side,
        labelX: candidate.x,
        labelY: candidate.y,
        lines: candidate.box.lines,
        lineHeight: candidate.box.lineHeight,
        textWidth: candidate.box.textWidth,
        textHeight: candidate.box.textHeight,
        footnote: candidate.box.footnote,
        collisionPaddingScale: candidate.box.collisionPaddingScale || 1,
        candidateKind: candidate.kind || "radial",
        candidateBand: candidate.band || "",
        anchor: candidate.side === "left" ? "end" : "start"
      };
    }

    function createCandidateForSide(item, side, box, settings, distance, offset, mapBounds) {
      const margin = Math.max(22, settings.labelSize * 1.4);
      const minX = margin;
      const maxX = Math.max(minX, settings.width - box.textWidth - margin);
      const minY = margin + labelFontSize(box);
      const maxY = settings.height - margin;
      const sideGap = Math.max(24, settings.labelSize * 1.5);
      const mapRect = mapBoundsRect(mapBounds);

      if (side === "left") {
        const labelRightMin = margin + box.textWidth;
        const labelRightMax = settings.width - margin;
        const preferredMax = mapRect.x0 - sideGap;
        const x = preferredMax >= labelRightMin
          ? clamp(item.x - distance, labelRightMin, preferredMax)
          : clamp(item.x - distance, labelRightMin, labelRightMax);
        const y = clampLabelBaseline(labelBaselineForCenter(item.y + offset, box), box, minY, maxY);
        return { side, x, y, box, kind: "radial" };
      }

      if (side === "right") {
        const preferredMin = mapRect.x1 + sideGap;
        const x = preferredMin <= maxX
          ? clamp(item.x + distance, preferredMin, maxX)
          : clamp(item.x + distance, minX, maxX);
        const y = clampLabelBaseline(labelBaselineForCenter(item.y + offset, box), box, minY, maxY);
        return { side, x, y, box, kind: "radial" };
      }

      const x = clamp(item.x - box.textWidth / 2 + offset, minX, maxX);
      if (side === "top") {
        const outsideBottom = mapRect.y0 - sideGap;
        const desiredBottom = Math.min(item.y - distance, outsideBottom);
        const y = clamp(desiredBottom - labelVisualHeight(box) + labelFontSize(box), minY, maxY - labelVisualHeight(box) + labelFontSize(box));
        return { side, x, y, box, kind: "radial" };
      }

      const outsideTop = mapRect.y1 + sideGap;
      const desiredTop = Math.max(item.y + distance, outsideTop);
      const y = clamp(desiredTop + labelFontSize(box), minY, maxY - labelVisualHeight(box) + labelFontSize(box));
      return { side, x, y, box, kind: "radial" };
    }

    // The geographic extent is not a solid rectangular obstacle. Canada in
    // particular has large ocean and northern voids inside its bounds, and the
    // reference layout uses those spaces to keep the basemap large. These
    // candidates stay close to the marker and deliberately do not force the
    // label beyond the map's bounding rectangle. Polygon-aware validation in
    // the rendered smoke test remains the final guard against covering land.
    function createInsetCandidateForSide(item, side, box, settings, distance, offset, band) {
      const margin = Math.max(22, settings.labelSize * 1.4);
      const minX = margin;
      const maxX = Math.max(minX, settings.width - box.textWidth - margin);
      const minY = margin + labelFontSize(box);
      const maxY = settings.height - margin;

      if (side === "left") {
        const labelRightMin = margin + box.textWidth;
        const labelRightMax = settings.width - margin;
        return {
          side,
          x: clamp(item.x - distance, labelRightMin, labelRightMax),
          y: clampLabelBaseline(labelBaselineForCenter(item.y + offset, box), box, minY, maxY),
          box,
          kind: "inset",
          band
        };
      }

      if (side === "right") {
        return {
          side,
          x: clamp(item.x + distance, minX, maxX),
          y: clampLabelBaseline(labelBaselineForCenter(item.y + offset, box), box, minY, maxY),
          box,
          kind: "inset",
          band
        };
      }

      const x = clamp(item.x - box.textWidth / 2 + offset, minX, maxX);
      if (side === "top") {
        const desiredBottom = item.y - distance;
        return {
          side,
          x,
          y: clamp(
            desiredBottom - labelVisualHeight(box) + labelFontSize(box),
            minY,
            maxY - labelVisualHeight(box) + labelFontSize(box)
          ),
          box,
          kind: "inset",
          band
        };
      }

      const desiredTop = item.y + distance;
      return {
        side,
        x,
        y: clamp(
          desiredTop + labelFontSize(box),
          minY,
          maxY - labelVisualHeight(box) + labelFontSize(box)
        ),
        box,
        kind: "inset",
        band
      };
    }

    function createLabelCandidates(item, settings, mapBounds, perimeterCandidates = []) {
      const preferred = preferredSide(item, settings, mapBounds);
      const distanceFactors = [0.7, 1, 1.35, 1.75, 2.2];
      const offsetSteps = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
      const candidates = [];
      const seen = new Set();
      const addCandidate = candidate => {
        if (!candidate) return;
        const key = `${candidate.side}:${Math.round(candidate.x)}:${Math.round(candidate.y)}`;
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push(candidate);
      };

      perimeterCandidates.forEach(addCandidate);
      const hardSides = referenceSideOptions(item, settings);
      const candidateSides = hardSides.length ? hardSides : candidateSideOrder(preferred);
      candidateSides.forEach(side => {
        const box = makeLabelBox(item, side, settings, mapBounds);
        const baseDistance = getDesignerLineOffset(item, side, settings);
        const baseOffset = side === "left" || side === "right"
          ? getDesignerVerticalOffset(item, side, settings)
          : getDesignerHorizontalOffset(item, side, settings);
        const offsetUnit = side === "left" || side === "right"
          ? Math.max(26, settings.labelSize * 1.8)
          : Math.max(34, settings.labelSize * 2.2);

        distanceFactors.forEach(distanceFactor => {
          offsetSteps.forEach(step => {
            addCandidate(createCandidateForSide(
              item,
              side,
              box,
              settings,
              Math.max(34, baseDistance * distanceFactor),
              baseOffset + step * offsetUnit,
              mapBounds
            ));
          });
        });
      });

      const insetSides = hardSides.length ? hardSides : [preferred];
      const insetDistanceFractions = [0.03, 0.08, 0.14, 0.22, 0.32, 0.4];
      const insetOffsetSteps = [-3, -2, -1, 0, 1, 2, 3];
      insetSides.forEach(side => {
        const box = makeLabelBox(item, side, settings, mapBounds);
        const baseOffset = side === "left" || side === "right"
          ? getDesignerVerticalOffset(item, side, settings)
          : getDesignerHorizontalOffset(item, side, settings);
        const offsetUnit = side === "left" || side === "right"
          ? Math.max(20, settings.labelSize * 1.35)
          : Math.max(24, settings.labelSize * 1.6);
        const distanceSpan = side === "left" || side === "right" ? settings.width : settings.height;
        insetDistanceFractions.forEach((fraction, bandIndex) => {
          const distance = Math.max(settings.labelSize, distanceSpan * fraction);
          insetOffsetSteps.forEach(step => {
            addCandidate(createInsetCandidateForSide(
              item,
              side,
              box,
              settings,
              distance,
              baseOffset + step * offsetUnit,
              `band-${bandIndex}`
            ));
          });
        });
      });
      return candidates;
    }

    function createPerimeterCandidateMap(points, settings, mapBounds) {
      const byKey = new Map(points.map(point => [getLabelKey(point), []]));
      ["left", "right", "top", "bottom"].forEach(side => {
        const sideItems = points.filter(point => {
          const requiredSides = referenceSideOptions(point, settings);
          return !requiredSides.length || requiredSides.includes(side);
        }).sort((a, b) => {
          if (side === "left" || side === "right") return a.y - b.y || a.x - b.x;
          return a.x - b.x || a.y - b.y;
        });
        const boxes = sideItems.map(item => makeLabelBox(item, side, settings, mapBounds));
        createSlots(sideItems, side, settings, mapBounds).forEach((slot, index) => {
          if (!slot) return;
          const item = sideItems[index];
          const list = byKey.get(getLabelKey(item));
          if (!list) return;
          list.push({ side, x: slot.x, y: slot.y, box: boxes[index], kind: "perimeter" });
        });
      });
      return byKey;
    }

    function makeSeededRandom(seed) {
      let state = Math.floor(seed) % 2147483647;
      if (state <= 0) state += 2147483646;
      return () => {
        state = state * 16807 % 2147483647;
        return (state - 1) / 2147483646;
      };
    }

    function layoutSeed(points, settings) {
      return points.reduce((seed, point) => {
        const x = Math.round(point.x * 10);
        const y = Math.round(point.y * 10);
        return (seed + x * 31 + y * 17 + String(point.name || "").length * 13) % 2147483647;
      }, Math.round(settings.width * 7 + settings.height * 11 + settings.mapScale * 19));
    }

    function compactPathPoints(points) {
      return points.filter((point, index) => {
        if (index === 0) return true;
        const previous = points[index - 1];
        return Math.hypot(point.x - previous.x, point.y - previous.y) > 0.5;
      });
    }

    function maxAllowedLeaderLength(settings) {
      return Math.max(150, settings.width * 0.34);
    }

    function placementQualityAcceptable(quality) {
      return !quality || (quality.hardProblems === 0 && quality.sideRuleViolations === 0 && quality.excessLeaderLength <= 0);
    }

    function isBetterScaleFallback(candidate, fallback) {
      if (!candidate) return false;
      if (!fallback) return true;
      if (candidate.feasibility.placed !== fallback.feasibility.placed) {
        return candidate.feasibility.placed > fallback.feasibility.placed;
      }
      const candidateProblems = candidate.placementQuality ? candidate.placementQuality.hardProblems : Number.MAX_SAFE_INTEGER;
      const fallbackProblems = fallback.placementQuality ? fallback.placementQuality.hardProblems : Number.MAX_SAFE_INTEGER;
      if (candidateProblems !== fallbackProblems) return candidateProblems < fallbackProblems;
      const candidateSideViolations = candidate.placementQuality ? candidate.placementQuality.sideRuleViolations : Number.MAX_SAFE_INTEGER;
      const fallbackSideViolations = fallback.placementQuality ? fallback.placementQuality.sideRuleViolations : Number.MAX_SAFE_INTEGER;
      if (candidateSideViolations !== fallbackSideViolations) return candidateSideViolations < fallbackSideViolations;
      const candidateLeaderExcess = candidate.placementQuality ? candidate.placementQuality.excessLeaderLength : Number.MAX_SAFE_INTEGER;
      const fallbackLeaderExcess = fallback.placementQuality ? fallback.placementQuality.excessLeaderLength : Number.MAX_SAFE_INTEGER;
      if (Math.round(candidateLeaderExcess) !== Math.round(fallbackLeaderExcess)) {
        return candidateLeaderExcess < fallbackLeaderExcess;
      }
      const candidateMaxLeader = candidate.placementQuality ? candidate.placementQuality.maxLeaderLength : Number.MAX_SAFE_INTEGER;
      const fallbackMaxLeader = fallback.placementQuality ? fallback.placementQuality.maxLeaderLength : Number.MAX_SAFE_INTEGER;
      if (Math.round(candidateMaxLeader) !== Math.round(fallbackMaxLeader)) return candidateMaxLeader < fallbackMaxLeader;
      return candidate.settings.mapScale > fallback.settings.mapScale;
    }

    function countSideOrderInversions(placed) {
      return ["left", "right", "top", "bottom"].reduce((total, side) => {
        const labels = placed.filter(label => label.labelSide === side);
        let inversions = 0;
        for (let i = 0; i < labels.length; i += 1) {
          for (let j = i + 1; j < labels.length; j += 1) {
            const anchorOrder = side === "left" || side === "right"
              ? Math.sign(labels[i].y - labels[j].y)
              : Math.sign(labels[i].x - labels[j].x);
            const labelOrder = side === "left" || side === "right"
              ? Math.sign(labels[i].labelY - labels[j].labelY)
              : Math.sign(lineEnd(labels[i]).x - lineEnd(labels[j]).x);
            if (anchorOrder && labelOrder && anchorOrder !== labelOrder) inversions += 1;
          }
        }
        return total + inversions;
      }, 0);
    }

    function sameLabelPlacement(a, b) {
      return a
        && b
        && getLabelKey(a) === getLabelKey(b)
        && a.labelSide === b.labelSide
        && Math.abs(a.labelX - b.labelX) < 0.1
        && Math.abs(a.labelY - b.labelY) < 0.1;
    }

    function markerObstacleRect(point, settings) {
      const category = getCategory(point.type);
      const markerSize = getCategoryMarkerSize(category, settings);
      const pad = Math.max(5, markerSize * 0.75);
      const radius = markerSize / 2 + pad;
      return {
        x0: point.x - radius,
        y0: point.y - radius,
        x1: point.x + radius,
        y1: point.y + radius
      };
    }

    function lineSegmentForLabel(label) {
      return {
        start: { x: label.x, y: label.y },
        end: lineEnd(label)
      };
    }

    function leaderLineHidden(label, settings) {
      return Boolean(settings && settings.hideLeaderLines) || Boolean(label && label.hideLine);
    }

    function countCandidateCrossings(candidateLabel, placed, settings) {
      if (leaderLineHidden(candidateLabel, settings)) return 0;
      const candidateSegments = leaderSegmentsForLabel(candidateLabel, settings);
      return placed.filter(label => {
        if (leaderLineHidden(label, settings)) return false;
        const otherSegments = leaderSegmentsForLabel(label, settings);
        return candidateSegments.some(candidateSegment => otherSegments.some(otherSegment => (
          segmentsCross(candidateSegment.start, candidateSegment.end, otherSegment.start, otherSegment.end)
        )));
      }).length;
    }

    function leaderIntersectsLabel(leaderLabel, targetLabel, settings) {
      if (!leaderLabel || leaderLineHidden(leaderLabel, settings) || !targetLabel) return false;
      const targetRect = labelBackgroundRect(targetLabel);
      return leaderSegmentsForLabel(leaderLabel, settings).some(segment => (
        segmentIntersectsRect(segment.start, segment.end, targetRect)
      ));
    }

    function countLeaderLabelCrossings(candidateLabel, placed, settings) {
      return placed.reduce((count, label) => {
        return count
          + (leaderIntersectsLabel(candidateLabel, label, settings) ? 1 : 0)
          + (leaderIntersectsLabel(label, candidateLabel, settings) ? 1 : 0);
      }, 0);
    }

    function countMarkerLineCrossings(candidateLabel, points, settings) {
      if (leaderLineHidden(candidateLabel, settings)) return 0;
      const candidateLine = lineSegmentForLabel(candidateLabel);
      return points.filter(point => {
        if (point.rowId === candidateLabel.rowId) return false;
        return segmentIntersectsRect(candidateLine.start, candidateLine.end, markerObstacleRect(point, settings));
      }).length;
    }

    function leaderDirectionPenalty(label, settings) {
      if (leaderLineHidden(label, settings)) return 0;
      const end = lineEnd(label);
      const dx = end.x - label.x;
      const dy = end.y - label.y;
      if (label.labelSide === "left" && dx > 0) return weights.leaderDirection;
      if (label.labelSide === "right" && dx < 0) return weights.leaderDirection;
      if (label.labelSide === "top" && dy > 0) return weights.leaderDirection;
      if (label.labelSide === "bottom" && dy < 0) return weights.leaderDirection;
      return 0;
    }

    function leaderLengthPenalty(label, settings) {
      if (leaderLineHidden(label, settings)) return 0;
      const end = lineEnd(label);
      const length = Math.hypot(label.x - end.x, label.y - end.y);
      const softMax = Math.max(
        weights.leaderLineSoftMaxMin,
        settings.width * weights.leaderLineSoftMaxRatio
      );
      if (length <= softMax) return 0;
      const excess = length - softMax;
      return excess * excess * weights.leaderLineExcessArea;
    }

    function markerObstaclePenalty(label, points, settings) {
      const rect = labelRect(label);
      return points.reduce((score, point) => {
        if (point.rowId === label.rowId) return score;
        const overlap = rectOverlapArea(rect, markerObstacleRect(point, settings));
        if (!overlap) return score;
        return score + weights.markerOverlapBase + overlap * weights.markerOverlapArea;
      }, 0);
    }

    function layoutBoxObstaclePenalty(label, settings) {
      const obstacles = Array.isArray(settings.layoutObstacles) ? settings.layoutObstacles : [];
      if (!obstacles.length) return 0;
      const rect = labelRect(label);
      const line = lineSegmentForLabel(label);

      return obstacles.reduce((score, obstacle) => {
        const overlap = rectOverlapArea(rect, obstacle.rect);
        const overlapPenalty = overlap
          ? weights.boxObstacleBase + overlap * weights.boxObstacleArea
          : 0;
        const linePenalty = !leaderLineHidden(label, settings) && segmentIntersectsRect(line.start, line.end, obstacle.rect)
          ? weights.leaderBoxCrossing
          : 0;
        return score + overlapPenalty + linePenalty;
      }, 0);
    }

    function sideCrowdingPenalty(candidateLabel, placed, settings) {
      const candidateRect = labelBackgroundRect(candidateLabel);
      const minGap = Math.max(10, settings.labelSize * 0.8);
      return placed.reduce((score, label) => {
        if (label.labelSide !== candidateLabel.labelSide) return score;
        const rect = labelBackgroundRect(label);
        const verticalSide = label.labelSide === "left" || label.labelSide === "right";
        const candidateCenter = verticalSide ? candidateRect.centerY : candidateRect.centerX;
        const labelCenter = verticalSide ? rect.centerY : rect.centerX;
        const candidateSpan = verticalSide
          ? candidateRect.y1 - candidateRect.y0
          : candidateRect.x1 - candidateRect.x0;
        const labelSpan = verticalSide
          ? rect.y1 - rect.y0
          : rect.x1 - rect.x0;
        const distance = Math.abs(labelCenter - candidateCenter);
        const target = (candidateSpan + labelSpan) / 2 + minGap;
        return distance < target ? score + (target - distance) * weights.sameSideCrowding : score;
      }, 0);
    }

    function verticalOrderPenalty(candidateLabel, placed) {
      return placed.reduce((score, label) => {
        if (label.labelSide !== candidateLabel.labelSide) return score;
        if (label.labelSide !== "left" && label.labelSide !== "right") return score;
        const anchorOrder = Math.sign(candidateLabel.y - label.y);
        const labelOrder = Math.sign(candidateLabel.labelY - label.labelY);
        return anchorOrder && labelOrder && anchorOrder !== labelOrder
          ? score + weights.verticalOrderInversion
          : score;
      }, 0);
    }

    function sideCompatibilityPenalty(candidateLabel, preferredSideValue, mapBounds) {
      const name = labelKeyText(candidateLabel);
      const currentBoundary = getBoundary();
      if (candidateLabel.labelSide === preferredSideValue) return 0;
      let score = candidateLabel.labelSide === oppositeSide(preferredSideValue)
        ? weights.oppositeSideChange
        : weights.adjacentSideChange;
      if (currentBoundary === "canada" && name.includes("pathways") && candidateLabel.labelSide === "right") {
        score += weights.oppositeSideChange;
      }
      if (currentBoundary === "canada" && name.includes("pathways") && candidateLabel.labelSide === "left") {
        score += weights.adjacentSideChange;
      }
      if (currentBoundary === "canada" && name.includes("mcilvenna") && candidateLabel.labelSide === "right") {
        score += weights.oppositeSideChange;
      }
      if (currentBoundary === "canada" && name.includes("north coast") && candidateLabel.labelSide !== "left") {
        score += weights.adjacentSideChange;
      }
      if (currentBoundary === "canada" && name.includes("iqaluit") && candidateLabel.labelSide !== "right") {
        score += weights.oppositeSideChange;
      }
      if (currentBoundary === "canada" && name.includes("alto") && candidateLabel.labelSide !== "right") {
        score += weights.oppositeSideChange;
      }
      if (currentBoundary === "canada" && name.includes("northwest critical") && candidateLabel.labelSide !== "left" && candidateLabel.labelSide !== "bottom") {
        score += weights.oppositeSideChange;
      }
      const mapCenterX = (mapBounds.x0 + mapBounds.x1) / 2;
      const mapCenterY = (mapBounds.y0 + mapBounds.y1) / 2;
      if (candidateLabel.labelSide === "left" && candidateLabel.x > mapCenterX) score += weights.radialSideMismatch;
      if (candidateLabel.labelSide === "right" && candidateLabel.x < mapCenterX) score += weights.radialSideMismatch;
      if (candidateLabel.labelSide === "top" && candidateLabel.y > mapCenterY) score += weights.radialSideMismatch;
      if (candidateLabel.labelSide === "bottom" && candidateLabel.y < mapCenterY) score += weights.radialSideMismatch;
      return score;
    }

    function scoreCandidate(candidateLabel, placed, settings, mapBounds, preferredSideValue, points = placed) {
      const rect = labelRect(candidateLabel);
      const canvasRect = { x0: 0, y0: 0, x1: settings.width, y1: settings.height };
      const mapRect = mapBoundsRect(mapBounds);
      const lineEndPoint = lineEnd(candidateLabel);
      const lineLength = Math.hypot(candidateLabel.x - lineEndPoint.x, candidateLabel.y - lineEndPoint.y);
      const shapeAwareMap = typeof settings.labelTouchesLand === "function";
      const mapOverlap = shapeAwareMap
        ? (settings.labelTouchesLand(rect) ? 1 : 0)
        : rectOverlapArea(rect, mapRect);
      const outsideCanvas = outsideRectArea(rect, canvasRect);
      const sidePenalty = sideCompatibilityPenalty(candidateLabel, preferredSideValue, mapBounds);
      const crossingPenalty = countCandidateCrossings(candidateLabel, placed, settings) * weights.leaderLineCrossing;
      const leaderLabelPenalty = countLeaderLabelCrossings(candidateLabel, placed, settings) * weights.leaderLabelCrossing;
      const reducedMapPenaltyFactor = settings.mapScale < 90
        ? 1 + (90 - settings.mapScale) / 20
        : 1;
      const mapOverlapPenalty = mapOverlap
        ? (weights.mapOverlapBase + mapOverlap * weights.mapOverlapArea) * reducedMapPenaltyFactor
        : -weights.offMapBonus;
      let score = sidePenalty
        + crossingPenalty
        + leaderLabelPenalty
        + lineLength * weights.leaderLineLength
        + leaderLengthPenalty(candidateLabel, settings)
        + mapOverlapPenalty
        + outsideCanvas * weights.outsideCanvasArea
        + layoutBoxObstaclePenalty(candidateLabel, settings)
        + markerObstaclePenalty(candidateLabel, points, settings)
        + countMarkerLineCrossings(candidateLabel, points, settings) * weights.leaderMarkerCrossing
        + sideCrowdingPenalty(candidateLabel, placed, settings)
        + verticalOrderPenalty(candidateLabel, placed)
        + leaderDirectionPenalty(candidateLabel, settings);

      placed.forEach(label => {
        const overlap = rectOverlapArea(rect, labelRect(label));
        if (overlap) {
          score += weights.labelOverlapBase + overlap * weights.labelOverlapArea;
        }
      });

      if (!shapeAwareMap) {
        if (rect.centerY < mapRect.y0 || rect.centerY > mapRect.y1) score -= weights.outsideMapBoundsBonus;
        if (rect.centerX < mapRect.x0 || rect.centerX > mapRect.x1) score -= weights.outsideMapBoundsBonus;
        if (rect.centerX > mapRect.x0 && rect.centerX < mapRect.x1 && rect.centerY > mapRect.y0 && rect.centerY < mapRect.y1) {
          score += weights.nearMapCenterPenalty;
        }
      }
      if (getBoundary() === "canada" && labelKeyText(candidateLabel).includes("northwest critical") && candidateLabel.labelSide === "left") {
        const targetY = mapRect.y1 + Math.max(18, settings.labelSize * 1.2);
        if (rect.centerY < targetY) score += (targetY - rect.centerY) * 1500;
      }
      if (getBoundary() === "canada" && labelKeyText(candidateLabel).includes("pathways") && candidateLabel.labelSide === "bottom") {
        const targetX = mapRect.x0 + Math.max(35, settings.labelSize * 3);
        if (rect.x0 < targetX) score += (targetX - rect.x0) * 1200;
      }
      const referenceCanvas = settings.bookSize === "compact" && settings.imageSize === "half";
      if (referenceCanvas && getBoundary() === "canada") {
        const name = labelKeyText(candidateLabel);
        const referenceTargets = [
          ["arctic economic", 0.26, 0.224],
          ["red chris", 0.174, 0.327],
          ["ksi lisims", 0.125, 0.374],
          ["northwest critical", 0.2, 0.767]
        ];
        const target = referenceTargets.find(([needle]) => name.includes(needle));
        if (target) {
          score += (
            Math.abs(rect.centerX - settings.width * target[1])
            + Math.abs(rect.centerY - settings.height * target[2])
          ) * 900;
        }
        if (name.includes("grays bay")) {
          score += Math.abs(rect.centerX - settings.width * 0.286) * 600;
        }
      }
      if (referenceCanvas && getBoundary() === "canada" && labelKeyText(candidateLabel).includes("port of churchill") && candidateLabel.labelSide === "right") {
        const targetY = mapRect.y0 + (mapRect.y1 - mapRect.y0) * 0.34;
        score += Math.abs(rect.centerY - targetY) * 1500;
      }
      if (referenceCanvas && getBoundary() === "canada" && labelKeyText(candidateLabel).includes("alto high-speed") && candidateLabel.labelSide === "right") {
        const targetX = mapRect.x0 + (mapRect.x1 - mapRect.x0) * 0.87;
        const targetY = mapRect.y0 + (mapRect.y1 - mapRect.y0) * 0.35;
        score += (Math.abs(rect.centerX - targetX) + Math.abs(rect.centerY - targetY)) * 1200;
      }
      if (referenceCanvas && getBoundary() === "canada" && labelKeyText(candidateLabel).includes("iqaluit") && candidateLabel.labelSide === "right") {
        const targetX = candidateLabel.x + Math.max(70, settings.width * 0.18);
        const targetY = candidateLabel.y + Math.max(16, settings.height * 0.045);
        score += (Math.abs(rect.centerX - targetX) + Math.abs(rect.centerY - targetY)) * 900;
      }

      return score;
    }

    function createCandidatePlacementMap(points, settings, mapBounds, perimeterCandidateMap = new Map()) {
      return new Map(points.map(item => [
        getLabelKey(item),
        createLabelCandidates(item, settings, mapBounds, perimeterCandidateMap.get(getLabelKey(item)))
          .map(candidate => makeLabelPlacement(item, candidate))
      ]));
    }

    function candidatePlacementsForItem(item, settings, mapBounds, perimeterCandidateMap, candidatePlacementMap) {
      const cached = candidatePlacementMap && candidatePlacementMap.get(getLabelKey(item));
      if (cached) return cached;
      return createLabelCandidates(item, settings, mapBounds, perimeterCandidateMap.get(getLabelKey(item)))
        .map(candidate => makeLabelPlacement(item, candidate));
    }

    function chooseBestCandidate(item, placed, settings, mapBounds, points = placed, perimeterCandidateMap = new Map(), candidatePlacementMap = null) {
      const preferred = preferredSide(item, settings, mapBounds);
      return candidatePlacementsForItem(item, settings, mapBounds, perimeterCandidateMap, candidatePlacementMap)
        .map(label => {
          return { label, score: scoreCandidate(label, placed, settings, mapBounds, preferred, points) };
        })
        .sort((a, b) => a.score - b.score)[0].label;
    }

    function candidateLabelsForItem(item, placed, settings, mapBounds, points, perimeterCandidateMap = new Map(), candidatePlacementMap = null) {
      const preferred = preferredSide(item, settings, mapBounds);
      return candidatePlacementsForItem(item, settings, mapBounds, perimeterCandidateMap, candidatePlacementMap)
        .map(label => {
          return {
            label,
            localScore: scoreCandidate(label, placed, settings, mapBounds, preferred, points)
          };
        })
        .sort((a, b) => a.localScore - b.localScore)
        .map(candidate => candidate.label);
    }

    function placementDifficulty(item, points, settings) {
      const radius = Math.max(46, settings.labelSize * 3.4);
      return points.reduce((count, other) => {
        if (other === item) return count;
        return Math.hypot(item.x - other.x, item.y - other.y) <= radius ? count + 1 : count;
      }, 0);
    }

    function layoutOptimizationNeeded(points, settings) {
      if (points.length >= 12) return true;
      if (Array.isArray(settings.layoutObstacles) && settings.layoutObstacles.length && points.length >= 6) return true;
      return points.some(point => placementDifficulty(point, points, settings) >= 3);
    }

    function scoreLayout(placed, settings, mapBounds, points) {
      return placed.reduce((score, label, index) => {
        const others = placed.filter((_, otherIndex) => otherIndex !== index);
        return score + scoreCandidate(label, others, settings, mapBounds, preferredSide(label, settings, mapBounds), points);
      }, 0);
    }

    function pairPlacementPenalty(candidateLabel, label, settings) {
      const overlap = rectOverlapArea(labelRect(candidateLabel), labelRect(label));
      return countCandidateCrossings(candidateLabel, [label], settings) * weights.leaderLineCrossing
        + countLeaderLabelCrossings(candidateLabel, [label], settings) * weights.leaderLabelCrossing
        + sideCrowdingPenalty(candidateLabel, [label], settings)
        + verticalOrderPenalty(candidateLabel, [label])
        + (overlap ? weights.labelOverlapBase + overlap * weights.labelOverlapArea : 0);
    }

    function intrinsicPlacementScore(label, settings, mapBounds, points, cache = null) {
      if (cache && cache.has(label)) return cache.get(label);
      const score = scoreCandidate(label, [], settings, mapBounds, preferredSide(label, settings, mapBounds), points);
      if (cache) cache.set(label, score);
      return score;
    }

    function scoreLayoutReplacement(placed, index, replacement, settings, mapBounds, points, currentScore = null, intrinsicScoreCache = null) {
      const current = placed[index];
      if (!current || !replacement) return Number.isFinite(currentScore) ? currentScore : scoreLayout(placed, settings, mapBounds, points);

      const baselineScore = Number.isFinite(currentScore)
        ? currentScore
        : scoreLayout(placed, settings, mapBounds, points);
      const others = placed.filter((_, otherIndex) => otherIndex !== index);
      const currentIntrinsic = intrinsicPlacementScore(current, settings, mapBounds, points, intrinsicScoreCache);
      const replacementIntrinsic = intrinsicPlacementScore(replacement, settings, mapBounds, points, intrinsicScoreCache);
      const currentPairPenalty = others.reduce((score, label) => score + pairPlacementPenalty(current, label, settings), 0);
      const replacementPairPenalty = others.reduce((score, label) => score + pairPlacementPenalty(replacement, label, settings), 0);

      // scoreLayout evaluates each pair once from each label's perspective.
      return baselineScore
        + replacementIntrinsic - currentIntrinsic
        + 2 * (replacementPairPenalty - currentPairPenalty);
    }

    function shouldRouteDenseLeader(label, settings) {
      if (leaderLineHidden(label, settings)) return false;
      if (label.elbowLeader) return true;
      if (!settings.routeDenseLeaders) return false;
      const end = lineEnd(label);
      const straightLength = Math.hypot(label.x - end.x, label.y - end.y);
      const longLeader = straightLength > Math.max(210, settings.width * 0.32);
      const southeastCluster = label.x > settings.width * 0.52
        && label.y > settings.height * 0.45
        && (label.labelSide === "right" || label.labelSide === "bottom");
      return longLeader || southeastCluster;
    }

    function leaderPathPoints(label, settings) {
      const end = lineEnd(label);
      const start = { x: label.x, y: label.y };
      if (!shouldRouteDenseLeader(label, settings)) return [start, end];

      if (label.labelSide === "left" || label.labelSide === "right") {
        const bendX = end.x;
        const bendY = start.y;
        return compactPathPoints([start, { x: bendX, y: bendY }, end]);
      }

      const bendX = start.x;
      const bendY = end.y;
      return compactPathPoints([start, { x: bendX, y: bendY }, end]);
    }

    function leaderSegmentsForLabel(label, settings) {
      const points = leaderPathPoints(label, settings);
      const segments = [];
      for (let index = 1; index < points.length; index += 1) {
        segments.push({ start: points[index - 1], end: points[index] });
      }
      return segments;
    }

    function leaderPathLength(label, settings) {
      return leaderSegmentsForLabel(label, settings).reduce((total, segment) => {
        return total + Math.hypot(segment.start.x - segment.end.x, segment.start.y - segment.end.y);
      }, 0);
    }

    function measurePlacementQuality(placed, settings) {
      const lines = placed
        .filter(label => !leaderLineHidden(label, settings))
        .map(label => ({ segments: leaderSegmentsForLabel(label, settings), length: leaderPathLength(label, settings), label }));
      const rects = placed.map(labelBackgroundRect);
      const obstacles = Array.isArray(settings.layoutObstacles) ? settings.layoutObstacles : [];
      let leaderCrossings = 0;
      let leaderLabelCrossings = 0;
      let labelOverlaps = 0;
      let furnitureOverlaps = 0;
      let landOverlaps = 0;
      let sideRuleViolations = 0;
      let leaderLengthTotal = 0;
      let maxLeaderLength = 0;
      const sideRuleViolationNames = [];
      const leaderLengthLimit = maxAllowedLeaderLength(settings);

      for (let i = 0; i < lines.length; i += 1) {
        leaderLengthTotal += lines[i].length;
        maxLeaderLength = Math.max(maxLeaderLength, lines[i].length);

        for (let j = i + 1; j < lines.length; j += 1) {
          const crosses = lines[i].segments.some(a => lines[j].segments.some(b => segmentsCross(a.start, a.end, b.start, b.end)));
          if (crosses) leaderCrossings += 1;
        }
      }

      for (let i = 0; i < rects.length; i += 1) {
        const expectedSides = referenceSideOptions(placed[i], settings);
        if (expectedSides.length && !expectedSides.includes(placed[i].labelSide)) {
          sideRuleViolations += 1;
          sideRuleViolationNames.push(placed[i].name || `label ${i + 1}`);
        }
        for (let j = i + 1; j < rects.length; j += 1) {
          if (rectsOverlap(rects[i], rects[j])) labelOverlaps += 1;
        }
        obstacles.forEach(obstacle => {
          if (rectsOverlap(rects[i], obstacle.rect)) furnitureOverlaps += 1;
        });
        if (typeof settings.labelTouchesLand === "function" && settings.labelTouchesLand(rects[i])) {
          landOverlaps += 1;
        }

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
          if (lines[lineIndex].label === placed[i]) continue;
          if (lines[lineIndex].segments.some(segment => segmentIntersectsRect(segment.start, segment.end, rects[i]))) {
            leaderLabelCrossings += 1;
          }
        }
      }

      const hardProblems = leaderCrossings + leaderLabelCrossings + labelOverlaps + furnitureOverlaps + landOverlaps;
      return {
        leaderCrossings,
        leaderLabelCrossings,
        labelOverlaps,
        furnitureOverlaps,
        landOverlaps,
        hardProblems,
        sideRuleViolations,
        sideRuleViolationNames,
        leaderLengthLimit,
        excessLeaderLength: Math.max(0, maxLeaderLength - leaderLengthLimit),
        maxLeaderLength,
        averageLeaderLength: lines.length ? leaderLengthTotal / lines.length : 0
      };
    }

    function stablePlacementKey(label) {
      return [
        String(getLabelKey(label)),
        String(label.labelSide || ""),
        Math.round(Number(label.labelX) * 10),
        Math.round(Number(label.labelY) * 10)
      ].join(":");
    }

    function placementPassesUnaryRules(label, settings) {
      const canvasRect = { x0: 0, y0: 0, x1: settings.width, y1: settings.height };
      const rect = labelBackgroundRect(label);
      if (outsideRectArea(rect, canvasRect) > 0.01) return false;

      const expectedSides = referenceSideOptions(label, settings);
      if (expectedSides.length && !expectedSides.includes(label.labelSide)) return false;
      if (!leaderLineHidden(label, settings) && leaderPathLength(label, settings) > maxAllowedLeaderLength(settings) + 0.01) return false;
      if (typeof settings.labelTouchesLand === "function" && settings.labelTouchesLand(rect)) return false;

      const obstacles = Array.isArray(settings.layoutObstacles) ? settings.layoutObstacles : [];
      return !obstacles.some(obstacle => rectsOverlap(rect, obstacle.rect));
    }

    function placementsHardConflict(first, second, settings) {
      if (!first || !second) return true;
      if (rectsOverlap(labelBackgroundRect(first), labelBackgroundRect(second))) return true;
      if (leaderIntersectsLabel(first, second, settings) || leaderIntersectsLabel(second, first, settings)) return true;

      if (!leaderLineHidden(first, settings) && !leaderLineHidden(second, settings)) {
        const firstSegments = leaderSegmentsForLabel(first, settings);
        const secondSegments = leaderSegmentsForLabel(second, settings);
        if (firstSegments.some(a => secondSegments.some(b => segmentsCross(a.start, a.end, b.start, b.end)))) {
          return true;
        }
      }

      return false;
    }

    function createSolverCandidateDomains(points, settings, mapBounds, options = {}) {
      const perimeterCandidateMap = options.perimeterCandidateMap || createPerimeterCandidateMap(points, settings, mapBounds);
      const candidatePlacementMap = options.candidatePlacementMap || createCandidatePlacementMap(points, settings, mapBounds, perimeterCandidateMap);
      const maxCandidatesPerLabel = Math.max(8, Number(options.maxCandidatesPerLabel) || 40);
      const intrinsicScoreCache = new WeakMap();
      const warmByKey = new Map((options.warmStart || []).map(label => [getLabelKey(label), label]));
      const completeCandidateCounts = [];
      let nextCandidateId = 0;
      const referenceCanvas = settings.bookSize === "compact" && settings.imageSize === "half";
      const candidateKindPriority = label => {
        const kind = label.candidateKind || "radial";
        if (referenceCanvas) return kind === "inset" ? 0 : kind === "perimeter" ? 1 : 2;
        return kind === "perimeter" ? 0 : kind === "inset" ? 1 : 2;
      };

      const domains = points.map((point, pointIndex) => {
        const seen = new Set();
        const valid = candidatePlacementsForItem(point, settings, mapBounds, perimeterCandidateMap, candidatePlacementMap)
          .filter(label => placementPassesUnaryRules(label, settings))
          .filter(label => {
            const key = stablePlacementKey(label);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map(label => {
            const warm = warmByKey.get(getLabelKey(label));
            const warmDistance = warm
              ? Math.hypot(label.labelX - warm.labelX, label.labelY - warm.labelY)
                + (label.labelSide === warm.labelSide ? 0 : settings.width)
              : 0;
            return {
              id: nextCandidateId++,
              pointIndex,
              label,
              score: intrinsicPlacementScore(label, settings, mapBounds, points, intrinsicScoreCache),
              warmDistance,
              stableKey: stablePlacementKey(label)
            };
          });
        completeCandidateCounts[pointIndex] = valid.length;

        valid.sort((a, b) => (
          (options.preferWarmStart ? a.warmDistance - b.warmDistance : 0)
          || candidateKindPriority(a.label) - candidateKindPriority(b.label)
          || a.score - b.score
          || a.stableKey.localeCompare(b.stableKey)
        ));

        const bySideAndKind = new Map();
        valid.forEach(candidate => {
          const groupKey = [
            candidate.label.labelSide,
            candidate.label.candidateKind || "radial",
            candidate.label.candidateBand || "default"
          ].join(":");
          if (!bySideAndKind.has(groupKey)) bySideAndKind.set(groupKey, []);
          bySideAndKind.get(groupKey).push(candidate);
        });
        const groupLimit = Math.max(2, Math.floor(maxCandidatesPerLabel / Math.max(1, bySideAndKind.size)));
        const selected = [];
        bySideAndKind.forEach(groupCandidates => selected.push(...groupCandidates.slice(0, groupLimit)));
        if (selected.length < maxCandidatesPerLabel) {
          const selectedIds = new Set(selected.map(candidate => candidate.id));
          selected.push(...valid.filter(candidate => !selectedIds.has(candidate.id)).slice(0, maxCandidatesPerLabel - selected.length));
        }
        selected.sort((a, b) => (
          (options.preferWarmStart ? a.warmDistance - b.warmDistance : 0)
          || candidateKindPriority(a.label) - candidateKindPriority(b.label)
          || a.score - b.score
          || a.stableKey.localeCompare(b.stableKey)
        ));
        return selected.slice(0, maxCandidatesPerLabel);
      });

      const truncatedDomainCount = domains.reduce((count, domain, index) => (
        count + (completeCandidateCounts[index] > domain.length ? 1 : 0)
      ), 0);
      return { domains, perimeterCandidateMap, candidatePlacementMap, completeCandidateCounts, truncatedDomainCount };
    }

    function solveConflictFreeLayout(points, settings, mapBounds, options = {}) {
      if (!Array.isArray(points) || !points.length) {
        return { status: "solved", placed: [], nodesVisited: 0, candidateCount: 0 };
      }

      const candidateData = createSolverCandidateDomains(points, settings, mapBounds, options);
      const domains = candidateData.domains;
      const domainSummary = options.collectDomainDiagnostics === true
        ? domains.map((domain, index) => ({
          label: points[index] && points[index].name || `label ${index + 1}`,
          selectedCount: domain.length,
          completeCount: candidateData.completeCandidateCounts[index]
        }))
        : null;
      const candidateCount = domains.reduce((total, domain) => total + domain.length, 0);
      const emptyDomainIndex = domains.findIndex(domain => domain.length === 0);
      if (emptyDomainIndex >= 0) {
        return {
          status: "infeasible",
          placed: null,
          nodesVisited: 0,
          candidateCount,
          emptyDomainIndex,
          domainSummary,
          ...candidateData
        };
      }

      const maxNodes = Math.max(1, Number(options.maxNodes) || 80000);
      const assignments = new Array(points.length).fill(null);
      const conflictCache = new Map();
      let nodesVisited = 0;
      let budgetExhausted = false;
      const deadEnds = [];

      function rememberDeadEnd(blockedIndex) {
        if (deadEnds.length >= 8) return;
        deadEnds.push({
          blockedLabel: points[blockedIndex] && points[blockedIndex].name || `label ${blockedIndex + 1}`,
          assignedLabels: assignments
            .map((candidate, index) => candidate ? points[index] && points[index].name || `label ${index + 1}` : null)
            .filter(Boolean)
        });
      }

      function candidatesConflict(first, second) {
        const low = Math.min(first.id, second.id);
        const high = Math.max(first.id, second.id);
        const key = `${low}:${high}`;
        if (conflictCache.has(key)) return conflictCache.get(key);
        const conflicts = placementsHardConflict(first.label, second.label, settings);
        conflictCache.set(key, conflicts);
        return conflicts;
      }

      function searchWithMinConflicts() {
        const restarts = Math.max(0, Number(options.minConflictRestarts) || 0);
        const stepsPerRestart = Math.max(0, Number(options.minConflictSteps) || 0);
        if (!restarts || !stepsPerRestart) return null;

        const random = makeSeededRandom(layoutSeed(points, settings) + 7919);
        let bestAssignment = null;
        let bestConflictCount = Infinity;
        let stepsVisited = 0;

        const conflictCountFor = (assignment, index, candidate) => assignment.reduce((count, other, otherIndex) => {
          if (otherIndex === index || !other) return count;
          return count + (candidatesConflict(candidate, other) ? 1 : 0);
        }, 0);

        for (let restart = 0; restart < restarts; restart += 1) {
          const assignment = domains.map(domain => {
            if (restart === 0) return domain[0];
            const explorationSize = Math.max(1, Math.min(domain.length, 16 + restart * 4));
            return domain[Math.floor(random() * explorationSize)];
          });

          for (let step = 0; step < stepsPerRestart; step += 1) {
            stepsVisited += 1;
            const conflictCounts = assignment.map((candidate, index) => conflictCountFor(assignment, index, candidate));
            const totalConflicts = conflictCounts.reduce((sum, count) => sum + count, 0) / 2;
            if (totalConflicts < bestConflictCount) {
              bestConflictCount = totalConflicts;
              bestAssignment = assignment.slice();
            }
            if (totalConflicts === 0) {
              return { assignment, stepsVisited, bestConflictCount: 0 };
            }

            const conflicted = conflictCounts
              .map((count, index) => ({ count, index }))
              .filter(item => item.count > 0)
              .sort((a, b) => b.count - a.count || a.index - b.index);
            const highestConflict = conflicted[0].count;
            const variablePool = step % 11 === 0
              ? conflicted
              : conflicted.filter(item => item.count === highestConflict);
            const selectedIndex = variablePool[Math.floor(random() * variablePool.length)].index;
            const ranked = domains[selectedIndex]
              .map(candidate => ({
                candidate,
                conflicts: conflictCountFor(assignment, selectedIndex, candidate),
                tieScore: candidate.warmDistance + candidate.score * 0.00001
              }))
              .sort((a, b) => a.conflicts - b.conflicts || a.tieScore - b.tieScore || a.candidate.stableKey.localeCompare(b.candidate.stableKey));
            const bestLocalConflict = ranked[0].conflicts;
            const bestLocal = ranked.filter(item => item.conflicts === bestLocalConflict);
            let replacement = bestLocal[Math.floor(random() * Math.min(bestLocal.length, 6))].candidate;
            if (replacement === assignment[selectedIndex] && bestLocal.length > 1) {
              replacement = bestLocal.find(item => item.candidate !== assignment[selectedIndex]).candidate;
            }
            assignment[selectedIndex] = replacement;
          }
        }

        return { assignment: null, bestAssignment, stepsVisited, bestConflictCount };
      }

      function polishConflictFreeAssignment(sourceAssignment) {
        const assignment = sourceAssignment.slice();
        const placed = assignment.map(candidate => candidate.label);
        const intrinsicScoreCache = new WeakMap();
        let layoutScore = scoreLayout(placed, settings, mapBounds, points);
        let moves = 0;
        let pairMoves = 0;
        let completedPasses = 0;
        const maxPasses = Math.max(0, Number(options.polishPasses) || 3);

        for (let pass = 0; pass < maxPasses; pass += 1) {
          let changed = false;
          for (let index = 0; index < assignment.length; index += 1) {
            const current = assignment[index];
            let best = current;
            let bestScore = layoutScore;
            for (const candidate of domains[index]) {
              if (candidate === current) continue;
              const conflicts = assignment.some((other, otherIndex) => (
                otherIndex !== index && candidatesConflict(candidate, other)
              ));
              if (conflicts) continue;
              const candidateScore = scoreLayoutReplacement(
                placed,
                index,
                candidate.label,
                settings,
                mapBounds,
                points,
                layoutScore,
                intrinsicScoreCache
              );
              if (candidateScore < bestScore - 0.01) {
                best = candidate;
                bestScore = candidateScore;
              }
            }
            if (best === current) continue;
            assignment[index] = best;
            placed[index] = best.label;
            layoutScore = bestScore;
            moves += 1;
            changed = true;
          }
          completedPasses += 1;
          if (!changed) break;
        }

        const maxPairMoves = Math.max(0, Number(options.pairPolishMoves) || 0);
        const pairCandidateLimit = Math.max(2, Number(options.pairPolishCandidates) || 8);
        for (let pairMove = 0; pairMove < maxPairMoves; pairMove += 1) {
          let bestPair = null;
          for (let firstIndex = 0; firstIndex < assignment.length; firstIndex += 1) {
            const firstCurrent = assignment[firstIndex];
            const firstCandidates = [
              firstCurrent,
              ...domains[firstIndex].filter(candidate => candidate !== firstCurrent).slice(0, pairCandidateLimit - 1)
            ];
            for (let secondIndex = firstIndex + 1; secondIndex < assignment.length; secondIndex += 1) {
              const secondCurrent = assignment[secondIndex];
              const secondCandidates = [
                secondCurrent,
                ...domains[secondIndex].filter(candidate => candidate !== secondCurrent).slice(0, pairCandidateLimit - 1)
              ];
              for (const firstCandidate of firstCandidates) {
                const firstBlocked = assignment.some((other, otherIndex) => (
                  otherIndex !== firstIndex
                  && otherIndex !== secondIndex
                  && candidatesConflict(firstCandidate, other)
                ));
                if (firstBlocked) continue;
                for (const secondCandidate of secondCandidates) {
                  if (firstCandidate === firstCurrent && secondCandidate === secondCurrent) continue;
                  if (candidatesConflict(firstCandidate, secondCandidate)) continue;
                  const secondBlocked = assignment.some((other, otherIndex) => (
                    otherIndex !== firstIndex
                    && otherIndex !== secondIndex
                    && candidatesConflict(secondCandidate, other)
                  ));
                  if (secondBlocked) continue;
                  const firstLabel = placed[firstIndex];
                  const secondLabel = placed[secondIndex];
                  placed[firstIndex] = firstCandidate.label;
                  placed[secondIndex] = secondCandidate.label;
                  const candidateScore = scoreLayout(placed, settings, mapBounds, points);
                  placed[firstIndex] = firstLabel;
                  placed[secondIndex] = secondLabel;
                  if (candidateScore >= layoutScore - 0.01) continue;
                  if (!bestPair || candidateScore < bestPair.score - 0.01) {
                    bestPair = {
                      firstIndex,
                      secondIndex,
                      firstCandidate,
                      secondCandidate,
                      score: candidateScore
                    };
                  }
                }
              }
            }
          }
          if (!bestPair) break;
          assignment[bestPair.firstIndex] = bestPair.firstCandidate;
          assignment[bestPair.secondIndex] = bestPair.secondCandidate;
          placed[bestPair.firstIndex] = bestPair.firstCandidate.label;
          placed[bestPair.secondIndex] = bestPair.secondCandidate.label;
          layoutScore = bestPair.score;
          pairMoves += 1;
        }

        return { assignment, layoutScore, moves, pairMoves, passes: completedPasses };
      }

      const minConflictResult = searchWithMinConflicts();
      if (minConflictResult && minConflictResult.assignment) {
        const polished = polishConflictFreeAssignment(minConflictResult.assignment);
        return {
          status: "solved",
          placed: polished.assignment.map(candidate => candidate.label),
          nodesVisited: minConflictResult.stepsVisited,
          candidateCount,
          conflictChecks: conflictCache.size,
          deadEnds,
          domainSummary,
          strategy: "min-conflicts",
          bestConflictCount: 0,
          polishMoves: polished.moves,
          pairPolishMoves: polished.pairMoves,
          polishPasses: polished.passes,
          softScore: polished.layoutScore,
          ...candidateData
        };
      }

      if (options.minConflictsOnly === true) {
        return {
          status: candidateData.truncatedDomainCount > 0 ? "candidate-limited" : "not-found",
          placed: null,
          nodesVisited: minConflictResult ? minConflictResult.stepsVisited : 0,
          candidateCount,
          conflictChecks: conflictCache.size,
          deadEnds,
          domainSummary,
          strategy: "min-conflicts",
          bestConflictCount: minConflictResult ? minConflictResult.bestConflictCount : null,
          ...candidateData
        };
      }

      if (options.computeSupportOrdering === true) {
        domains.forEach((domain, domainIndex) => {
          domain.forEach(candidate => {
            let blockingScore = 0;
            let minimumSupport = Infinity;
            domains.forEach((otherDomain, otherIndex) => {
              if (otherIndex === domainIndex) return;
              let support = 0;
              otherDomain.forEach(other => {
                if (!candidatesConflict(candidate, other)) support += 1;
              });
              minimumSupport = Math.min(minimumSupport, support);
              blockingScore += otherDomain.length - support;
            });
            candidate.minimumSupport = Number.isFinite(minimumSupport) ? minimumSupport : 0;
            candidate.blockingScore = blockingScore;
          });
          domain.sort((a, b) => (
            b.minimumSupport - a.minimumSupport
            || a.blockingScore - b.blockingScore
            || (a.label.candidateKind === "perimeter" ? -1 : 0) - (b.label.candidateKind === "perimeter" ? -1 : 0)
            || a.score - b.score
            || a.stableKey.localeCompare(b.stableKey)
          ));
        });
      }

      function viableCandidates(domainIndex) {
        return domains[domainIndex].filter(candidate => {
          for (let index = 0; index < assignments.length; index += 1) {
            if (assignments[index] && candidatesConflict(candidate, assignments[index])) return false;
          }
          return true;
        });
      }

      function search(depth) {
        nodesVisited += 1;
        if (nodesVisited > maxNodes) {
          budgetExhausted = true;
          return false;
        }
        if (depth === points.length) return true;

        let selectedIndex = -1;
        let selectedCandidates = null;
        for (let index = 0; index < domains.length; index += 1) {
          if (assignments[index]) continue;
          const viable = viableCandidates(index);
          if (!viable.length) {
            rememberDeadEnd(index);
            return false;
          }
          if (!selectedCandidates || viable.length < selectedCandidates.length) {
            selectedIndex = index;
            selectedCandidates = viable;
            if (viable.length === 1) break;
          }
        }

        for (const candidate of selectedCandidates) {
          assignments[selectedIndex] = candidate;
          let forwardValid = true;
          for (let index = 0; index < domains.length; index += 1) {
            if (assignments[index]) continue;
            if (!domains[index].some(other => {
              for (let assignedIndex = 0; assignedIndex < assignments.length; assignedIndex += 1) {
                if (assignments[assignedIndex] && candidatesConflict(other, assignments[assignedIndex])) return false;
              }
              return true;
            })) {
              forwardValid = false;
              rememberDeadEnd(index);
              break;
            }
          }
          if (forwardValid && search(depth + 1)) return true;
          assignments[selectedIndex] = null;
          if (budgetExhausted) return false;
        }
        return false;
      }

      const solved = search(0);
      const incompleteSearch = candidateData.truncatedDomainCount > 0;
      return {
        status: solved
          ? "solved"
          : budgetExhausted
            ? "budget-exhausted"
            : incompleteSearch
              ? "candidate-limited"
              : "infeasible",
        placed: solved ? assignments.map(candidate => candidate.label) : null,
        nodesVisited,
        candidateCount,
        conflictChecks: conflictCache.size,
        deadEnds,
        domainSummary,
        ...candidateData
      };
    }

    function createOrderPreservingVerticalSlots(items, side, settings, mapBounds) {
      const topLimit = Math.max(34, settings.labelSize * 2.4);
      const bottomLimit = settings.height - Math.max(34, settings.labelSize * 2.2);
      const sideGap = Math.max(24, settings.labelSize * 1.5);
      const defaultGap = Math.max(18, settings.labelSize * 1.2);
      const ordered = items.slice().sort((a, b) => a.y - b.y || a.x - b.x);
      const slots = ordered.map(item => {
        const box = makeLabelBox(item, side, settings, mapBounds);
        const visualHeight = labelVisualHeight(box);
        const desiredCenter = item.y + getDesignerVerticalOffset(item, side, settings);
        return {
          item,
          box,
          height: visualHeight,
          desiredTop: desiredCenter - visualHeight / 2,
          top: desiredCenter - visualHeight / 2
        };
      });
      const totalHeight = slots.reduce((sum, slot) => sum + slot.height, 0);
      const availableHeight = Math.max(1, bottomLimit - topLimit);
      const gap = slots.length > 1
        ? Math.max(4, Math.min(defaultGap, (availableHeight - totalHeight) / (slots.length - 1)))
        : 0;

      slots.forEach(slot => {
        slot.top = clamp(slot.desiredTop, topLimit, bottomLimit - slot.height);
      });

      for (let i = 1; i < slots.length; i += 1) {
        const previous = slots[i - 1];
        const current = slots[i];
        current.top = Math.max(current.top, previous.top + previous.height + gap);
      }

      for (let i = slots.length - 1; i >= 0; i -= 1) {
        const slot = slots[i];
        slot.top = Math.min(slot.top, bottomLimit - slot.height);
        if (i < slots.length - 1) {
          const next = slots[i + 1];
          slot.top = Math.min(slot.top, next.top - gap - slot.height);
        }
        slot.top = Math.max(slot.top, topLimit);
      }

      const slotsByItem = new Map();
      slots.forEach(slot => {
        const lineOffset = getDesignerLineOffset(slot.item, side, settings);
        const leftMin = 30 + slot.box.textWidth;
        const leftMax = mapBounds.x0 - sideGap;
        const rightMin = mapBounds.x1 + sideGap;
        const rightMax = settings.width - slot.box.textWidth - 30;
        const leftX = leftMax >= leftMin
          ? clamp(slot.item.x - lineOffset, leftMin, leftMax)
          : leftMin;
        const rightX = rightMax >= rightMin
          ? clamp(slot.item.x + lineOffset, rightMin, rightMax)
          : Math.max(30, rightMax);

        slotsByItem.set(slot.item, {
          side,
          x: side === "left" ? leftX : rightX,
          y: slot.top + labelFontSize(slot.box),
          box: slot.box
        });
      });

      return items.map(item => slotsByItem.get(item));
    }

    function createOrderPreservingHorizontalSlots(items, side, settings, mapBounds) {
      const margin = Math.max(22, settings.labelSize * 1.4);
      const sideGap = Math.max(24, settings.labelSize * 1.5);
      const rowGap = Math.max(16, settings.labelSize * 1.15);
      const minCenterGap = Math.max(10, settings.labelSize * 0.8);
      const minX = margin;
      const maxX = settings.width - margin;
      const ordered = items.slice().sort((a, b) => a.x - b.x || a.y - b.y);
      const slots = ordered.map(item => {
        const box = makeLabelBox(item, side, settings, mapBounds);
        const desiredCenter = item.x + getDesignerHorizontalOffset(item, side, settings);
        return {
          item,
          box,
          width: box.textWidth,
          height: labelVisualHeight(box),
          desiredCenter,
          centerX: clamp(desiredCenter, minX + box.textWidth / 2, maxX - box.textWidth / 2)
        };
      });

      for (let i = 1; i < slots.length; i += 1) {
        const separation = (slots[i - 1].width + slots[i].width) / 2 + minCenterGap;
        slots[i].centerX = Math.max(slots[i].centerX, slots[i - 1].centerX + separation);
      }

      for (let i = slots.length - 1; i >= 0; i -= 1) {
        slots[i].centerX = Math.min(slots[i].centerX, maxX - slots[i].width / 2);
        if (i < slots.length - 1) {
          const separation = (slots[i].width + slots[i + 1].width) / 2 + minCenterGap;
          slots[i].centerX = Math.min(slots[i].centerX, slots[i + 1].centerX - separation);
        }
        slots[i].centerX = Math.max(slots[i].centerX, minX + slots[i].width / 2);
      }

      const rows = [];
      slots.forEach(slot => {
        const left = slot.centerX - slot.width / 2;
        const right = slot.centerX + slot.width / 2;
        let rowIndex = rows.findIndex(row => left >= row.right + Math.max(8, settings.labelSize * 0.65));
        if (rowIndex < 0) {
          rowIndex = rows.length;
          rows.push({ right: -Infinity, height: 0 });
        }
        rows[rowIndex].right = Math.max(rows[rowIndex].right, right);
        rows[rowIndex].height = Math.max(rows[rowIndex].height, slot.height);
        slot.rowIndex = rowIndex;
      });

      const rowOffsets = [];
      rows.reduce((offset, row, index) => {
        rowOffsets[index] = offset;
        return offset + row.height + rowGap;
      }, 0);

      const slotsByItem = new Map();
      slots.forEach(slot => {
        const rowOffset = rowOffsets[slot.rowIndex] || 0;
        const fontSize = labelFontSize(slot.box);
        const topBaseline = mapBounds.y0 - sideGap - rowOffset - slot.height + fontSize;
        const bottomBaseline = mapBounds.y1 + sideGap + rowOffset + fontSize;
        const minY = margin + fontSize;
        const maxY = settings.height - margin - slot.height + fontSize;

        slotsByItem.set(slot.item, {
          side,
          x: clamp(slot.centerX - slot.width / 2, minX, maxX - slot.width),
          y: clamp(side === "top" ? topBaseline : bottomBaseline, minY, maxY),
          box: slot.box
        });
      });

      return items.map(item => slotsByItem.get(item));
    }

    function createOrderedSideBandTrial(placed, side, settings, mapBounds) {
      const sideLabels = placed.filter(label => label.labelSide === side);
      if (sideLabels.length < 2) return placed;

      const replacements = new Map();
      const slots = side === "left" || side === "right"
        ? createOrderPreservingVerticalSlots(sideLabels, side, settings, mapBounds)
        : createOrderPreservingHorizontalSlots(sideLabels, side, settings, mapBounds);
      slots.forEach((slot, index) => {
        if (!slot) return;
        const label = sideLabels[index];
        replacements.set(getLabelKey(label), makeLabelPlacement(label, slot));
      });

      return placed.map(label => replacements.get(getLabelKey(label)) || label);
    }

    function optimizeOrderedSideBands(placed, points, settings, mapBounds) {
      let best = placed.slice();
      let bestScore = scoreLayout(best, settings, mapBounds, points);
      let bestQuality = measurePlacementQuality(best, settings);
      let bestInversions = countSideOrderInversions(best);
      if (!layoutOptimizationNeeded(points, settings) && bestInversions === 0) return best;

      for (let pass = 0; pass < 2; pass += 1) {
        let changed = false;

        ["left", "right", "top", "bottom"].forEach(side => {
          const trial = createOrderedSideBandTrial(best, side, settings, mapBounds);
          if (trial === best) return;

          const trialScore = scoreLayout(trial, settings, mapBounds, points);
          const trialQuality = measurePlacementQuality(trial, settings);
          const trialInversions = countSideOrderInversions(trial);
          const fewerHardProblems = trialQuality.hardProblems < bestQuality.hardProblems;
          const materiallyBetterOrder = trialInversions < bestInversions
            && trialQuality.hardProblems <= bestQuality.hardProblems
            && trialScore <= bestScore + weights.verticalOrderInversion * 4;

          if (fewerHardProblems || trialScore + 0.1 < bestScore || materiallyBetterOrder) {
            best = trial;
            bestScore = trialScore;
            bestQuality = trialQuality;
            bestInversions = trialInversions;
            changed = true;
          }
        });

        if (!changed) break;
      }

      return best;
    }

    function optimizeDenseLayoutWithLocalSearch(placed, points, settings, mapBounds, perimeterCandidateMap = new Map(), candidatePlacementMap = null, intrinsicScoreCache = null) {
      if (!layoutOptimizationNeeded(points, settings)) return placed;

      let best = placed.slice();
      let bestScore = scoreLayout(best, settings, mapBounds, points);
      const maxPasses = points.length >= 18 ? 5 : 3;
      const maxCandidatesPerLabel = points.length >= 18 ? 34 : 44;

      for (let pass = 0; pass < maxPasses; pass += 1) {
        let changed = false;
        const ordered = best.slice().sort((a, b) => comparePlacementOrder(a, b, points, settings));

        for (const current of ordered) {
          const index = best.findIndex(label => getLabelKey(label) === getLabelKey(current));
          if (index < 0) continue;

          const others = best.filter((_, otherIndex) => otherIndex !== index);
          const candidates = candidateLabelsForItem(best[index], others, settings, mapBounds, points, perimeterCandidateMap, candidatePlacementMap)
            .slice(0, maxCandidatesPerLabel);

          for (const candidate of candidates) {
            const trial = best.slice();
            trial[index] = candidate;
            const trialScore = scoreLayoutReplacement(best, index, candidate, settings, mapBounds, points, bestScore, intrinsicScoreCache);
            if (trialScore + 0.1 < bestScore) {
              best = trial;
              bestScore = trialScore;
              changed = true;
              break;
            }
          }
        }

        if (!changed) break;
      }

      return best;
    }

    function optimizeDenseLayoutWithAnnealing(placed, points, settings, mapBounds, perimeterCandidateMap = new Map(), candidatePlacementMap = null, intrinsicScoreCache = null) {
      if (!layoutOptimizationNeeded(points, settings) || placed.length < 4) return placed;

      const candidateLists = placed.map((label, index) => {
        const others = placed.filter((_, otherIndex) => otherIndex !== index);
        const candidates = candidateLabelsForItem(label, others, settings, mapBounds, points, perimeterCandidateMap, candidatePlacementMap)
          .slice(0, points.length >= 18 ? 56 : 42);
        if (!candidates.some(candidate => sameLabelPlacement(candidate, label))) candidates.unshift(label);
        return candidates;
      });

      let current = placed.slice();
      let currentScore = scoreLayout(current, settings, mapBounds, points);
      let best = current.slice();
      let bestScore = currentScore;
      let bestQuality = measurePlacementQuality(best, settings);
      const random = makeSeededRandom(layoutSeed(points, settings));
      const iterations = points.length >= 18 ? 1800 : 1000;
      const startTemperature = Math.max(settings.width * 32, bestScore * 0.015);
      const endTemperature = Math.max(settings.labelSize * 18, 120);

      for (let iteration = 0; iteration < iterations; iteration += 1) {
        const labelIndex = Math.floor(random() * current.length);
        const candidates = candidateLists[labelIndex];
        if (!candidates || candidates.length < 2) continue;

        const candidate = candidates[Math.floor(random() * candidates.length)];
        if (sameLabelPlacement(candidate, current[labelIndex])) continue;

        const trial = current.slice();
        trial[labelIndex] = candidate;
        const trialScore = scoreLayoutReplacement(current, labelIndex, candidate, settings, mapBounds, points, currentScore, intrinsicScoreCache);
        const progress = iterations <= 1 ? 1 : iteration / (iterations - 1);
        const temperature = startTemperature * Math.pow(endTemperature / startTemperature, progress);
        const acceptWorse = Math.exp((currentScore - trialScore) / Math.max(1, temperature)) > random();

        if (trialScore + 0.1 < currentScore || acceptWorse) {
          current = trial;
          currentScore = trialScore;
        }

        if (trialScore + 0.1 < bestScore) {
          const trialQuality = measurePlacementQuality(trial, settings);
          if (trialQuality.hardProblems <= bestQuality.hardProblems) {
            best = trial;
            bestScore = trialScore;
            bestQuality = trialQuality;
          }
        }
      }

      return best;
    }

    function layoutLabelsWithGreedyCandidates(points, settings, mapBounds) {
      const perimeterCandidateMap = createPerimeterCandidateMap(points, settings, mapBounds);
      const candidatePlacementMap = createCandidatePlacementMap(points, settings, mapBounds, perimeterCandidateMap);
      const intrinsicScoreCache = new WeakMap();
      const ordered = points.slice().sort((a, b) => comparePlacementOrder(a, b, points, settings));
      let placed = [];

      ordered.forEach(item => {
        placed.push(chooseBestCandidate(item, placed, settings, mapBounds, points, perimeterCandidateMap, candidatePlacementMap));
      });

      for (let pass = 0; pass < 4; pass += 1) {
        let changed = false;
        for (let i = 0; i < placed.length; i += 1) {
          const current = placed[i];
          const others = placed.filter((_, index) => index !== i);
          const improved = chooseBestCandidate(current, others, settings, mapBounds, points, perimeterCandidateMap, candidatePlacementMap);
          const currentScore = scoreCandidate(current, others, settings, mapBounds, preferredSide(current, settings, mapBounds), points);
          const improvedScore = scoreCandidate(improved, others, settings, mapBounds, preferredSide(current, settings, mapBounds), points);
          if (improvedScore + 0.1 < currentScore) {
            placed[i] = improved;
            changed = true;
          }
        }
        if (!changed) break;
      }

      // Exact search belongs to the explicit Fit map + labels operation. A
      // normal render must remain responsive while the user edits points; it
      // keeps the established bounded local refinements below.
      if (settings.solveLabelConflicts === true) {
        const solved = solveConflictFreeLayout(points, settings, mapBounds, {
          perimeterCandidateMap,
          candidatePlacementMap,
          warmStart: placed,
          preferWarmStart: true,
          maxCandidatesPerLabel: 36,
          maxNodes: 30000
        });
        if (solved.status === "solved") return solved.placed;
      }

      placed = optimizeDenseLayoutWithLocalSearch(placed, points, settings, mapBounds, perimeterCandidateMap, candidatePlacementMap, intrinsicScoreCache);
      placed = optimizeDenseLayoutWithAnnealing(placed, points, settings, mapBounds, perimeterCandidateMap, candidatePlacementMap, intrinsicScoreCache);
      placed = optimizeOrderedSideBands(placed, points, settings, mapBounds);

      const byKey = new Map(placed.map(label => [getLabelKey(label), label]));
      return points.map(point => byKey.get(getLabelKey(point)) || chooseBestCandidate(point, [], settings, mapBounds, points, perimeterCandidateMap, candidatePlacementMap));
    }

    function layoutLabels(points, settings, mapBounds) {
      return layoutLabelsWithGreedyCandidates(points, settings, mapBounds);
    }

    function applyManualLabelPositions(placed, options) {
      const {
        useManualPositions = true,
        manualLabelPositions = {},
        getLegacyLabelKey
      } = options || {};
      return (placed || []).map((d, index) => {
        const key = getLabelKey(d);
        const manual = useManualPositions
          ? manualLabelPositions[key] || (typeof getLegacyLabelKey === "function" ? manualLabelPositions[getLegacyLabelKey(d)] : null)
          : null;
        const manualSide = manual && ["left", "right", "top", "bottom"].includes(manual.side) ? manual.side : d.labelSide;
        return {
          ...d,
          layoutId: `label-${index}`,
          labelKey: key,
          labelSide: manualSide,
          anchor: manualSide === "left" ? "end" : "start",
          labelX: manual ? manual.x : d.labelX,
          labelY: manual ? manual.y : d.labelY
        };
      });
    }

    function rememberLabelPositions(placed) {
      const positions = {};
      (placed || []).forEach(label => {
        const key = label.labelKey || getLabelKey(label);
        if (!key || !Number.isFinite(label.labelX) || !Number.isFinite(label.labelY)) return;
        positions[key] = {
          x: Math.round(label.labelX * 10) / 10,
          y: Math.round(label.labelY * 10) / 10,
          side: label.labelSide
        };
      });
      return positions;
    }

    return Object.freeze({
      applyManualLabelPositions,
      candidateSideOrder,
      chooseBestCandidate,
      compactPathPoints,
      compatibleSideOrder,
      countSideOrderInversions,
      createCandidateForSide,
      createCandidatePlacementMap,
      createLabelCandidates,
      createOrderPreservingHorizontalSlots,
      createOrderPreservingVerticalSlots,
      createPerimeterCandidateMap,
      createSolverCandidateDomains,
      isBetterScaleFallback,
      layoutLabels,
      layoutLabelsWithGreedyCandidates,
      layoutSeed,
      leaderPathLength,
      leaderPathPoints,
      leaderSegmentsForLabel,
      makeSeededRandom,
      makeLabelPlacement,
      maxAllowedLeaderLength,
      measurePlacementQuality,
      oppositeSide,
      optimizeDenseLayoutWithAnnealing,
      optimizeDenseLayoutWithLocalSearch,
      optimizeOrderedSideBands,
      placementQualityAcceptable,
      placementsHardConflict,
      rememberLabelPositions,
      scoreCandidate,
      scoreLayout,
      scoreLayoutReplacement,
      solveConflictFreeLayout,
      sameLabelPlacement,
      weights
    });
  }

  global.PLOTYPUS_LABEL_LAYOUT = Object.freeze({ create, weights });
})(window);

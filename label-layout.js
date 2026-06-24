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
        return { side, x, y, box };
      }

      if (side === "right") {
        const preferredMin = mapRect.x1 + sideGap;
        const x = preferredMin <= maxX
          ? clamp(item.x + distance, preferredMin, maxX)
          : clamp(item.x + distance, minX, maxX);
        const y = clampLabelBaseline(labelBaselineForCenter(item.y + offset, box), box, minY, maxY);
        return { side, x, y, box };
      }

      const x = clamp(item.x - box.textWidth / 2 + offset, minX, maxX);
      if (side === "top") {
        const outsideBottom = mapRect.y0 - sideGap;
        const desiredBottom = Math.min(item.y - distance, outsideBottom);
        const y = clamp(desiredBottom - labelVisualHeight(box) + labelFontSize(box), minY, maxY - labelVisualHeight(box) + labelFontSize(box));
        return { side, x, y, box };
      }

      const outsideTop = mapRect.y1 + sideGap;
      const desiredTop = Math.max(item.y + distance, outsideTop);
      const y = clamp(desiredTop + labelFontSize(box), minY, maxY - labelVisualHeight(box) + labelFontSize(box));
      return { side, x, y, box };
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
      candidateSideOrder(preferred).forEach(side => {
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
      return candidates;
    }

    function createPerimeterCandidateMap(points, settings, mapBounds) {
      const byKey = new Map(points.map(point => [getLabelKey(point), []]));
      ["left", "right", "top", "bottom"].forEach(side => {
        const sideItems = points.slice().sort((a, b) => {
          if (side === "left" || side === "right") return a.y - b.y || a.x - b.x;
          return a.x - b.x || a.y - b.y;
        });
        const boxes = sideItems.map(item => makeLabelBox(item, side, settings, mapBounds));
        createSlots(sideItems, side, settings, mapBounds).forEach((slot, index) => {
          if (!slot) return;
          const item = sideItems[index];
          const list = byKey.get(getLabelKey(item));
          if (!list) return;
          list.push({ side, x: slot.x, y: slot.y, box: boxes[index] });
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
      return Math.max(360, settings.width * 0.38);
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

    function countCandidateCrossings(candidateLabel, placed) {
      if (candidateLabel.hideLine) return 0;
      const candidateLine = lineSegmentForLabel(candidateLabel);
      return placed.filter(label => {
        if (label.hideLine) return false;
        const line = lineSegmentForLabel(label);
        return segmentsCross(candidateLine.start, candidateLine.end, line.start, line.end);
      }).length;
    }

    function countMarkerLineCrossings(candidateLabel, points, settings) {
      if (candidateLabel.hideLine) return 0;
      const candidateLine = lineSegmentForLabel(candidateLabel);
      return points.filter(point => {
        if (point.rowId === candidateLabel.rowId) return false;
        return segmentIntersectsRect(candidateLine.start, candidateLine.end, markerObstacleRect(point, settings));
      }).length;
    }

    function leaderDirectionPenalty(label) {
      if (label.hideLine) return 0;
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
      if (label.hideLine) return 0;
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
        const linePenalty = !label.hideLine && segmentIntersectsRect(line.start, line.end, obstacle.rect)
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
      const mapOverlap = rectOverlapArea(rect, mapRect);
      const outsideCanvas = outsideRectArea(rect, canvasRect);
      const sidePenalty = sideCompatibilityPenalty(candidateLabel, preferredSideValue, mapBounds);
      const crossingPenalty = countCandidateCrossings(candidateLabel, placed) * weights.leaderLineCrossing;
      const reducedMapPenaltyFactor = settings.mapScale < 90
        ? 1 + (90 - settings.mapScale) / 20
        : 1;
      const mapOverlapPenalty = mapOverlap
        ? (weights.mapOverlapBase + mapOverlap * weights.mapOverlapArea) * reducedMapPenaltyFactor
        : -weights.offMapBonus;
      let score = sidePenalty
        + crossingPenalty
        + lineLength * weights.leaderLineLength
        + leaderLengthPenalty(candidateLabel, settings)
        + mapOverlapPenalty
        + outsideCanvas * weights.outsideCanvasArea
        + layoutBoxObstaclePenalty(candidateLabel, settings)
        + markerObstaclePenalty(candidateLabel, points, settings)
        + countMarkerLineCrossings(candidateLabel, points, settings) * weights.leaderMarkerCrossing
        + sideCrowdingPenalty(candidateLabel, placed, settings)
        + verticalOrderPenalty(candidateLabel, placed)
        + leaderDirectionPenalty(candidateLabel);

      placed.forEach(label => {
        const overlap = rectOverlapArea(rect, labelRect(label));
        if (overlap) {
          score += weights.labelOverlapBase + overlap * weights.labelOverlapArea;
        }
      });

      if (rect.centerY < mapRect.y0 || rect.centerY > mapRect.y1) score -= weights.outsideMapBoundsBonus;
      if (rect.centerX < mapRect.x0 || rect.centerX > mapRect.x1) score -= weights.outsideMapBoundsBonus;
      if (rect.centerX > mapRect.x0 && rect.centerX < mapRect.x1 && rect.centerY > mapRect.y0 && rect.centerY < mapRect.y1) {
        score += weights.nearMapCenterPenalty;
      }
      if (getBoundary() === "canada" && labelKeyText(candidateLabel).includes("northwest critical") && candidateLabel.labelSide === "left") {
        const targetY = mapRect.y1 + Math.max(18, settings.labelSize * 1.2);
        if (rect.centerY < targetY) score += (targetY - rect.centerY) * 1500;
      }
      if (getBoundary() === "canada" && labelKeyText(candidateLabel).includes("pathways") && candidateLabel.labelSide === "bottom") {
        const targetX = mapRect.x0 + Math.max(35, settings.labelSize * 3);
        if (rect.x0 < targetX) score += (targetX - rect.x0) * 1200;
      }

      return score;
    }

    function chooseBestCandidate(item, placed, settings, mapBounds, points = placed, perimeterCandidateMap = new Map()) {
      const preferred = preferredSide(item, settings, mapBounds);
      const candidates = createLabelCandidates(item, settings, mapBounds, perimeterCandidateMap.get(getLabelKey(item)));
      return candidates
        .map(candidate => {
          const label = makeLabelPlacement(item, candidate);
          return { label, score: scoreCandidate(label, placed, settings, mapBounds, preferred, points) };
        })
        .sort((a, b) => a.score - b.score)[0].label;
    }

    function candidateLabelsForItem(item, placed, settings, mapBounds, points, perimeterCandidateMap = new Map()) {
      const preferred = preferredSide(item, settings, mapBounds);
      return createLabelCandidates(item, settings, mapBounds, perimeterCandidateMap.get(getLabelKey(item)))
        .map(candidate => {
          const label = makeLabelPlacement(item, candidate);
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

    function shouldRouteDenseLeader(label, settings) {
      if (label.hideLine) return false;
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
        .filter(label => !label.hideLine)
        .map(label => ({ segments: leaderSegmentsForLabel(label, settings), length: leaderPathLength(label, settings), label }));
      const rects = placed.map(labelBackgroundRect);
      const obstacles = Array.isArray(settings.layoutObstacles) ? settings.layoutObstacles : [];
      let leaderCrossings = 0;
      let labelOverlaps = 0;
      let furnitureOverlaps = 0;
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
        const expectedSides = referenceSideOptions(placed[i]);
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
      }

      const hardProblems = leaderCrossings + labelOverlaps + furnitureOverlaps;
      return {
        leaderCrossings,
        labelOverlaps,
        furnitureOverlaps,
        hardProblems,
        sideRuleViolations,
        sideRuleViolationNames,
        leaderLengthLimit,
        excessLeaderLength: Math.max(0, maxLeaderLength - leaderLengthLimit),
        maxLeaderLength,
        averageLeaderLength: lines.length ? leaderLengthTotal / lines.length : 0
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
        const currentCenter = item.labelSide === side && Number.isFinite(item.labelX)
          ? lineEnd(item).x
          : null;
        const desiredCenter = currentCenter || item.x + getDesignerHorizontalOffset(item, side, settings);
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
        slots[i].centerX = Math.max(slots[i].centerX, slots[i - 1].centerX + minCenterGap);
      }

      for (let i = slots.length - 1; i >= 0; i -= 1) {
        slots[i].centerX = Math.min(slots[i].centerX, maxX - slots[i].width / 2);
        if (i < slots.length - 1) {
          slots[i].centerX = Math.min(slots[i].centerX, slots[i + 1].centerX - minCenterGap);
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

    function optimizeDenseLayoutWithLocalSearch(placed, points, settings, mapBounds, perimeterCandidateMap = new Map()) {
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
          const candidates = candidateLabelsForItem(best[index], others, settings, mapBounds, points, perimeterCandidateMap)
            .slice(0, maxCandidatesPerLabel);

          for (const candidate of candidates) {
            const trial = best.slice();
            trial[index] = candidate;
            const trialScore = scoreLayout(trial, settings, mapBounds, points);
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

    function optimizeDenseLayoutWithAnnealing(placed, points, settings, mapBounds, perimeterCandidateMap = new Map()) {
      if (!layoutOptimizationNeeded(points, settings) || placed.length < 4) return placed;

      const candidateLists = placed.map((label, index) => {
        const others = placed.filter((_, otherIndex) => otherIndex !== index);
        const candidates = candidateLabelsForItem(label, others, settings, mapBounds, points, perimeterCandidateMap)
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
        const trialScore = scoreLayout(trial, settings, mapBounds, points);
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
      const ordered = points.slice().sort((a, b) => comparePlacementOrder(a, b, points, settings));
      let placed = [];

      ordered.forEach(item => {
        placed.push(chooseBestCandidate(item, placed, settings, mapBounds, points, perimeterCandidateMap));
      });

      for (let pass = 0; pass < 4; pass += 1) {
        let changed = false;
        for (let i = 0; i < placed.length; i += 1) {
          const current = placed[i];
          const others = placed.filter((_, index) => index !== i);
          const improved = chooseBestCandidate(current, others, settings, mapBounds, points, perimeterCandidateMap);
          const currentScore = scoreCandidate(current, others, settings, mapBounds, preferredSide(current, settings, mapBounds), points);
          const improvedScore = scoreCandidate(improved, others, settings, mapBounds, preferredSide(current, settings, mapBounds), points);
          if (improvedScore + 0.1 < currentScore) {
            placed[i] = improved;
            changed = true;
          }
        }
        if (!changed) break;
      }

      placed = optimizeDenseLayoutWithLocalSearch(placed, points, settings, mapBounds, perimeterCandidateMap);
      placed = optimizeDenseLayoutWithAnnealing(placed, points, settings, mapBounds, perimeterCandidateMap);
      placed = optimizeOrderedSideBands(placed, points, settings, mapBounds);

      const byKey = new Map(placed.map(label => [getLabelKey(label), label]));
      return points.map(point => byKey.get(getLabelKey(point)) || chooseBestCandidate(point, [], settings, mapBounds, points, perimeterCandidateMap));
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
        return {
          ...d,
          layoutId: `label-${index}`,
          labelKey: key,
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
          y: Math.round(label.labelY * 10) / 10
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
      createLabelCandidates,
      createOrderPreservingHorizontalSlots,
      createOrderPreservingVerticalSlots,
      createPerimeterCandidateMap,
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
      rememberLabelPositions,
      scoreCandidate,
      scoreLayout,
      sameLabelPlacement,
      weights
    });
  }

  global.PLOTYPUS_LABEL_LAYOUT = Object.freeze({ create, weights });
})(window);

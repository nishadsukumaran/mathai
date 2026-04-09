# MathAI Whiteboard Teaching Vocabulary

**Status:** Specification — not yet implemented.
**Scope:** Shapes, fractions, number lines, and charts. Defines the *teaching
actions* a whiteboard experience can use, and the rules that keep those actions
feeling like a teacher and not like a UI animating data.

---

## Core Principle

Every visual must be:

- drawn progressively
- explained through action
- used to guide attention
- not pre-rendered and revealed

**If something appears fully formed → it's wrong.**

---

## 1. Universal Board Actions (baseline)

These apply to all topics:

- `writeText(x, y, text)`
- `writeNumber(x, y, value)`
- `pause(duration)`
- `focus(target)`
- `dim(target)`
- `restoreFocus()`
- `pointTo(target)`
- `circle(target)`
- `underline(target)`
- `box(target)`
- `erase(target)`
- `rewrite(target, newValue)`

---

## 2. Shape Teaching Actions (Geometry)

### Drawing

- `drawLine(from, to)`
- `drawShape(type, params)` — triangle, rectangle, square, circle, polygon
- `traceEdge(shapeId, edgeIndex)`
- `tracePerimeter(shapeId)`

### Annotation

- `labelVertex(vertexId, label)`
- `labelSide(edgeId, value)`
- `markAngle(vertexId)`
- `markRightAngle(vertexId)`
- `markEqualSides(edgeIds[])`

### Highlighting

- `highlightSide(edgeId)`
- `highlightAngle(vertexId)`
- `highlightShape(shapeId)`

### Area & Region

- `shadeRegion(shapeId, pattern)`
- `partitionShape(shapeId, parts)`
- `compareRegions(regionA, regionB)`

### Teaching Behaviors

- draw → label → highlight → conclude
- trace important paths (perimeter)
- use shading to explain area

---

## 3. Fraction Teaching Actions

### Construction

- `drawWhole(shapeType)` — circle / rectangle
- `partitionShape(shapeId, parts)`
- `labelPartitions(shapeId)`

### Explanation

- `shadePart(shapeId, partIndex)`
- `shadeMultipleParts(shapeId, indices[])`
- `highlightFraction(shapeId, fraction)`

### Comparison

- `drawSecondWhole()`
- `compareFractions(shapeA, shapeB)`
- `emphasizeLargerRegion()`
- `circleResult()`

### Teaching Behaviors

- always build from whole → parts → shaded part
- comparisons must be visual first, numeric later
- keep shapes aligned for clarity

---

## 4. Number Line Actions

### Construction

- `drawNumberLine(start, end)`
- `markIntervals(step)`
- `labelNumbers(values[])`

### Interaction

- `placePoint(value)`
- `highlightPoint(value)`
- `jump(from, to)`
- `animateMovement(from, to)`

### Teaching Behaviors

- movement = meaning
- jumps should show addition/subtraction visually
- avoid static explanation

---

## 5. Chart Teaching Actions

### Construction (very important)

- `drawAxes()`
- `labelAxis(axis, label)`
- `markScale(axis, values[])`

### Data Representation

- `drawBar(category, value)`
- `drawMultipleBars(data[])`
- `drawLineSegment(pointA, pointB)`
- `placeDataPoint(x, y)`

### Explanation

- `highlightBar(category)`
- `compareBars(catA, catB)`
- `annotateValue(target, text)`
- `circleHighest()`
- `circleLowest()`

### Teaching Behaviors

- build chart step-by-step
- never show full chart instantly
- explain while constructing
- guide attention to key comparisons

---

## 6. Visual Rules (mandatory)

### Drawing Rules

- all shapes must be drawn progressively
- no instant appearance of full shapes
- use consistent stroke style

### Timing Rules

- short pauses after key steps
- slightly uneven timing
- avoid robotic sequences

### Focus Rules

- only one primary focus at a time
- dim background elements when needed
- restore context after explanation

### Style Rules

- one highlight color
- one stroke style
- clean board layout
- minimal visual noise

---

## 7. Example Teaching Flows

### Example 1: Fraction (1/2 vs 1/4)

1. `drawWhole(circle)`
2. partition into 2
3. shade 1 part
4. draw second circle
5. partition into 4
6. shade 1 part
7. compare visually
8. circle larger region
9. write conclusion

### Example 2: Geometry (Perimeter)

1. draw rectangle
2. label sides
3. trace perimeter
4. highlight path
5. compute total
6. box answer

### Example 3: Bar Chart

1. draw axes
2. label axes
3. mark scale
4. draw bars one by one
5. highlight tallest bar
6. compare two bars
7. conclude

---

## 8. What NOT to do

- do not render full shapes instantly
- do not animate like dashboards
- do not overload visuals
- do not use generic reveal/move as primary logic
- do not treat visuals as decoration

---

## Final Principle

Everything must feel like:

> "A teacher is drawing this to help me understand."

If it feels like:

> "A UI is animating data"

→ it is wrong.

---

## Implementation Status

| Action / Flow                       | Status         | Notes |
| ----------------------------------- | -------------- | ----- |
| Writing effect (clip-reveal + pen)  | ✅ Built       | `WhiteboardDemo.tsx` — Kalam font, glyph-by-glyph, pen-tip indicator |
| Progressive drawing (dasharray)     | ✅ Built       | `WhiteboardDemo.tsx` — circles, arrows, strikes, box |
| Column focus washes                 | ✅ Built       | `WhiteboardDemo.tsx` — ones/tens column highlights |
| Strike → beat → rewrite timing      | ✅ Built       | `WhiteboardDemo.tsx` — borrow transformation |
| Universal actions (all)             | 📝 Spec only  | Defined above, not implemented as a reusable API |
| Shape actions (all)                 | 📝 Spec only  | — |
| Fraction actions (all)              | 📝 Spec only  | — |
| Number line actions (all)           | 📝 Spec only  | — |
| Chart actions (all)                 | 📝 Spec only  | — |

**Current working demo:** `/whiteboard-demo` (route) — subtraction with
borrowing only.

**Implementation strategy:** We are deliberately NOT building a generic
engine yet. The next lesson will be built the same hand-crafted way as
subtraction-with-borrowing, using patterns extracted from both implementations
only after at least 2-3 lessons exist. This vocabulary is the reference we'll
check against when extracting those patterns, so the API matches how a teacher
actually works on a board — not how a UI framework likes to think about shapes.

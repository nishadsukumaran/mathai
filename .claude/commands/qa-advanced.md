You are a senior product QA lead reviewing this application built with modern web frameworks.

Perform a deep technical and UX audit of the project.

## 1. Component Consistency
Inspect UI components and identify:
- inconsistent buttons
- inconsistent spacing
- inconsistent card layouts
- duplicated component patterns
- places where reusable components should exist

## 2. Missing UI States
Check the code and UI for missing states:
- loading state
- empty state
- error state
- success confirmation
- retry mechanisms

If any page fetches API data but does not show a loading or error state, report it.

## 3. API Interaction Issues
Look for:
- API calls without error handling
- missing try/catch blocks
- UI that breaks when API returns empty data
- UI assuming data always exists

## 4. Form Quality
Review forms for:
- missing validation
- unclear error messages
- poor input labeling
- missing success feedback
- duplicate submissions

## 5. Navigation Flow
Evaluate whether users can:
- understand where they are
- easily return to previous pages
- complete tasks without confusion

Highlight broken or confusing flows.

## 6. UX Clarity
Check if:
- page purpose is obvious
- primary actions stand out
- instructions are clear
- users know what to do next

## 7. Mobile Responsiveness
Identify:
- overflow issues
- elements too close together
- text wrapping problems
- buttons too small

## 8. Product Experience
Evaluate the product like a real user.

Identify:
- friction points
- confusing interactions
- areas where users might abandon the flow

## Output format

# Advanced QA Audit

## Critical Bugs

## UX Friction Points

## Missing UI States

## API Handling Issues

## Component Inconsistencies

## Mobile UX Problems

## Recommended Fixes

## Quick Improvements

Finally provide:

Product Quality Score (1–10)

Release Decision:
GO / NEEDS FIXES

# Rebound Coach - Phase 2: Execution Engine Upgrade

Version: 2.0
Status: Upgrade Spec (from Planner to Execution System)

## Objective

Transform Rebound Coach from a workout planner into a real-time workout execution system.

Phase 2 focuses only on doing the workout, not planning it.

## Core Flow

Open app -> Today workout -> Start session -> Full-screen execution mode -> Exercise timer/reps -> Auto rest -> Auto next -> Finish summary.

## Execution Mode Requirements

- Full-screen mobile-first workout mode
- Large exercise name
- Set/rep or timer prescription
- Visual instruction
- Rest timer auto-starts
- Next and Skip controls
- Duration exercises auto-count down and auto-advance
- Rep exercises wait for Done
- Summary after completion

## State Machine

IDLE -> LOADING_WORKOUT -> READY -> IN_EXERCISE -> RESTING -> NEXT_EXERCISE -> COMPLETED

## Success Criteria

- User can complete a full workout without leaving the app
- No manual tracking needed
- Timer and reps are functional
- Auto progression works
- Mobile experience feels like a coaching session

## Philosophy

The app should disappear. The workout should take over.

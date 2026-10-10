# UniteMeal Project Health Report

## Overview
This report details the findings and resolutions of the comprehensive production audit conducted on the UniteMeal project. The audit focused on fixing broken integrations, hardcoded values, mock implementations, missing database connections, and synchronization issues.

## 1. KPI Dashboard Fixed
- **Issue**: The Restaurant Dashboard KPI cards were stuck at 0 because the queries were incorrectly evaluating all non-delivered status donations as 0, or rendering stale states.
- **Fix**: Re-wrote `fetchDashboardData` in `DonorDashboard.tsx`. It now computes `Meals Shared` and `Food Donated` for all non-cancelled donations, counts completed pickups correctly across delivered/completed states, tracks unique NGO partners, and calculates CO2 dynamically.
- **Realtime**: Added `supabase.channel` subscriptions to keep the dashboard constantly updated when new donations or deliveries are made.

## 2. Donation History UI & Loading Fixed
- **Issue**: The Donation History (Ledger) UI was rendering outsized cards, not sorting correctly, and overwriting rows by mixing `id` and `donation_id`.
- **Fix**: Completely redesigned the `DonationHistoryContent` component. Replaced vertical heavy cards with compact horizontal cards showing essential icons, status badges, and date.
- **Sorting**: Handled reliable reverse chronological sorting (`dateB - dateA`).
- **Realtime**: Integrated `supabase.channel` so new donations appear instantly.

## 3. Details Modal Implemented
- **Issue**: The "Details" button did nothing.
- **Fix**: Implemented a responsive shadcn `Dialog` inside the history page. Clicking "Details" now pops up a comprehensive modal showing weights, meals, dates, pickup addresses, timelines, and special instructions.
- **Cancel Support**: Added a "Cancel" button for available donations, wired properly to Supabase.

## 4. Google Maps Autocomplete Rewritten
- **Issue**: The `AddressAutocomplete.tsx` component was using the new Places API endpoint (`places.AutocompleteSuggestion`), which was encountering billing/quota limits on this environment.
- **Fix**: Swapped out the new Autocomplete API with the legacy, stable `google.maps.places.AutocompleteService()`, mapping `getPlacePredictions` to suggestions and using `PlacesService.getDetails` to securely and affordably resolve latitudes, longitudes, and full addresses.

## 5. Profile Synchronization
- **Issue**: Creating a new donation used a Supabase `upsert` without a full payload, inadvertently overwriting the user's profile address with the donation address.
- **Fix**: Changed `handleCreate` to securely verify if a donor record exists, using a safe `insert` block instead of `upsert`, thereby preventing overwrites of restaurant profiles.

## 6. Removed Mock Maps and Hardcoded Coordinates
- **Issue**: `DonorLiveMap.tsx` and `NGODashboard.tsx` contained static images masking as maps, fake buttons for pins, and default hardcoded coordinates in Kurla (19.0760, 72.8777).
- **Fix**: Replaced all fake HTML markers and backgrounds with the fully functional `@vis.gl/react-google-maps` `APIProvider` and `Map`.
- **Geopositioning**: Replaced Kurla coordinates with standard `navigator.geolocation` so restaurants viewing the map without saved addresses see their actual location rather than Mumbai defaults.
- **Live Queries**: Re-wired `DonorLiveMap.tsx` to actively query the `deliveries` table and dynamically place the driver.

## Summary
The system has successfully moved off mock implementations across the board. The dashboard calculates correctly, historical data renders gracefully, addresses resolve affordably, and all operations sync in realtime.


## 7. Supabase Relation Queries
- **Issue**: `Error fetching donations` was firing constantly in the console. The query was attempting to fetch `ngos(*)` as a direct child of `donations`, which failed because `donations` does not have a foreign key to `ngos` (only `deliveries` does).
- **Fix**: Re-structured the Supabase relations to `.select('*, deliveries(*, ngos(*))')` correctly traversing from `donations` -> `deliveries` -> `ngos`. 
- **Fix**: Adjusted the Donor KPI Dashboard to extract unique NGO partners from the deeply nested `deliveries[0].ngo_id` payload instead of a non-existent root-level `ngo_id`.

## 8. Google Maps Autocomplete API Fix
- **Issue**: Encountered a fatal `LegacyApiNotActivatedMapError` stating "You're calling a legacy API, which is not enabled for your project". The autocomplete fell back to the legacy `AutocompleteService`.
- **Fix**: Migrated `AddressAutocomplete.tsx` completely to the **Places API (New)** using `places.AutocompleteSuggestion.fetchAutocompleteSuggestions()`.
- **Fix**: Used the new `places.Place` class and `.fetchFields()` to safely resolve location data, removing all calls to legacy Places services.

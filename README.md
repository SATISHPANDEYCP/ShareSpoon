# ShareSpoon

ShareSpoon is a community-first food sharing platform where people can post extra food and nearby users can request it quickly, safely, and respectfully. The product is designed to reduce food waste and improve neighborhood-level food access through a simple request-to-pickup flow.

## What The App Does

ShareSpoon connects two kinds of users:
- Donors: People who post available food with quantity, location, and expiry details.
- Requesters: People nearby who discover listings and request portions.

The app supports the complete lifecycle from posting food to pickup confirmation and post-pickup rating.

## Core User Flows

### 1. Food Posting
- Donors create a food post with details such as title, description, quantity, unit, location, and expiry.
- Posts appear in nearby discovery feeds.

### 2. Nearby Discovery
- Users browse food posts around their area.
- Location-aware browsing helps requesters find practical pickup options.

### 3. Request Management
- Requesters submit quantity-specific requests for available posts.
- Donors can accept or reject incoming requests.
- Re-request is allowed after rejected or cancelled outcomes.

### 4. Pickup Confirmation With OTP
- Pickup confirmation is protected by OTP verification.
- This adds trust and prevents accidental or incorrect completion.

### 5. Ratings And Feedback
- After successful pickup, users can rate their experience.
- Rating reminders are sent on a delayed schedule if feedback is pending.

### 6. Notifications And Email Events
- Users receive important lifecycle updates such as:
  - New request notifications
  - Accepted request updates
  - Rejected request updates
  - Pickup and rating reminder events

## Product Focus

- Reduce food waste through quick redistribution
- Improve reliability through explicit request states
- Build trust with OTP-based confirmation
- Keep communication clear using real-time and email updates

## High-Level Architecture

### Frontend
- React + Vite interface for browsing, posting, and request actions
- Route-protected screens for user-specific actions
- Client-side state management for auth, UI preferences, and interactions

### Backend
- Express API for authentication, posts, requests, reviews, and admin operations
- MongoDB models for users, food posts, requests, and reviews
- Background services for periodic tasks (for example, reminder workflows)

### Media And Realtime
- Cloud media support for user/post assets
- Socket-based realtime events for request lifecycle updates

## Identity And Experience

ShareSpoon is not only a listing board. It is a structured donation workflow with accountability checkpoints, status transitions, and feedback loops that make neighborhood food sharing dependable at scale.

# SXM GO - Product Requirements Document

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Pre-Development

---

## 1. Product Overview

### 1.1 Purpose
SXM GO is a gamified mobile tourism application designed to enhance visitor engagement on St. Maarten by transforming island exploration into an interactive, competitive experience.

### 1.2 Problem Statement
St. Maarten offers diverse experiences across two nations, 37 beaches, and countless local businesses, yet most visitors only explore a fraction of the island due to limited awareness and lack of structured discovery.

### 1.3 Solution
A mobile app that incentivizes exploration through gamification, allowing tourists to compete globally and within travel groups while discovering local attractions, restaurants, and hidden gems.

### 1.4 Target Users
- **Primary:** Tourists visiting St. Maarten (cruise passengers, resort guests, independent travelers)
- **Secondary:** Repeat visitors, locals seeking new experiences
- **Tertiary:** Local businesses seeking increased foot traffic

---

## 2. Core Features & Requirements

### 2.1 User Authentication & Profiles

#### 2.1.1 Account Management
- **FR-001:** Users shall create accounts using email/password or social login (Google, Apple, Facebook)
- **FR-002:** User profiles shall store: name, profile photo, visit history, total points, achievements, and preferences
- **FR-003:** All user data shall sync to cloud storage in real-time
- **FR-004:** Users shall remain logged in across app sessions
- **FR-005:** Users shall be able to update profile information and settings
- **FR-006:** Users shall be able to delete their account and all associated data

#### 2.1.2 Privacy & Security
- **FR-007:** Location data shall only be collected with explicit user permission
- **FR-008:** Users shall be able to pause/disable location tracking
- **FR-009:** System shall comply with GDPR and CCPA requirements
- **FR-010:** Passwords shall be encrypted using industry-standard protocols
- **FR-011:** User data shall be stored in compliance with data residency requirements

---

### 2.2 Interactive Map

#### 2.2.1 Map Display
- **FR-012:** Map shall display St. Maarten island with Google Maps-style appearance
- **FR-013:** Map shall show terrain features: land, water, roads, beaches, forests, urban areas
- **FR-014:** Map shall display location pins for all featured businesses and attractions
- **FR-015:** Map shall support zoom, pan, and rotation gestures
- **FR-016:** Map shall show user's current location in real-time
- **FR-017:** Map shall differentiate between visited and unvisited locations

#### 2.2.2 Location Categories
- **FR-018:** System shall categorize locations: Restaurants, Beaches, Casinos, Shopping, Attractions, Entertainment
- **FR-019:** Users shall filter visible locations by category
- **FR-020:** Each location pin shall display: name, category, points value, and visited status

#### 2.2.3 Location Details
- **FR-021:** Tapping a location pin shall show: name, description, address, hours, contact info, photos, user ratings
- **FR-022:** Location details shall include "Check In" button when within range
- **FR-023:** System shall provide directions to selected locations

#### 2.2.4 Offline Functionality
- **FR-024:** Map shall cache location data for offline viewing
- **FR-025:** Users shall be able to download island map for offline use
- **FR-026:** Offline check-ins shall sync when connection is restored

---

### 2.3 Check-In System

#### 2.3.1 Check-In Mechanism
- **FR-027:** Users shall check in when within 50-100 meters of a location (configurable)
- **FR-028:** System shall verify location using GPS coordinates
- **FR-029:** Check-ins shall award points based on location type and rarity
- **FR-030:** Users shall receive confirmation feedback upon successful check-in
- **FR-031:** System shall prevent duplicate check-ins at same location within 24 hours

#### 2.3.2 Anti-Fraud Measures
- **FR-032:** System shall detect and flag GPS spoofing attempts
- **FR-033:** Suspicious check-in patterns shall trigger manual review
- **FR-034:** Optional: QR code verification at participating businesses
- **FR-035:** Optional: Photo verification requirement for high-value locations

---

### 2.4 Points & Scoring System

#### 2.4.1 Point Allocation
- **FR-036:** Standard location check-in: 10-50 points (based on rarity/difficulty)
- **FR-037:** First-time visitor bonus: +20 points
- **FR-038:** Completing full itinerary: Bonus multiplier (1.5x-2x)
- **FR-039:** Daily check-in streak bonuses
- **FR-040:** Discover hidden/off-path locations: Premium points (100+)

#### 2.4.2 Point Display
- **FR-041:** User's total points shall display prominently in profile
- **FR-042:** Point transactions shall show in activity feed
- **FR-043:** Points earned shall be displayed immediately upon check-in

---

### 2.5 Itinerary System

#### 2.5.1 Itinerary Creation
- **FR-044:** Users shall create custom itineraries with 3-20 locations
- **FR-045:** Itineraries shall include: title, description, estimated time, difficulty level
- **FR-046:** Users shall add locations via map selection or search
- **FR-047:** Users shall reorder locations within itinerary
- **FR-048:** System shall calculate total distance and estimated completion time

#### 2.5.2 Itinerary Management
- **FR-049:** Users shall save unlimited itineraries to their profile
- **FR-050:** Users shall edit or delete their itineraries
- **FR-051:** Users shall mark itineraries as "In Progress" or "Completed"
- **FR-052:** System shall track progress through itinerary (X of Y locations visited)

#### 2.5.3 Itinerary Sharing
- **FR-053:** Users shall share itineraries via unique link or QR code
- **FR-054:** Shared itineraries shall be viewable by non-users (web view)
- **FR-055:** Users shall duplicate others' shared itineraries to their profile
- **FR-056:** System shall display "Official" or "Featured" itineraries from tourism board

#### 2.5.4 Pre-Made Itineraries
- **FR-057:** App shall include curated itineraries: "Foodie Tour," "Beach Hopper," "Cultural Explorer"
- **FR-058:** Featured itineraries shall highlight seasonal events or promotions

---

### 2.6 Challenges & Achievements

#### 2.6.1 Badge System
- **FR-059:** **Foodie Badge:** Visit 3+ restaurants
- **FR-060:** **High Roller Badge:** Visit 3+ casinos
- **FR-061:** **Island Nomad Badge:** Travel 5+ kilometers
- **FR-062:** **Sun Chaser Badge:** Visit 5+ beaches
- **FR-063:** Additional badges for: first check-in, 10 locations, 25 locations, complete all categories

#### 2.6.2 Challenge Mechanics
- **FR-064:** Challenges shall have: name, description, requirements, point reward, deadline (if applicable)
- **FR-065:** Progress toward challenges shall display in real-time
- **FR-066:** Completed challenges shall unlock badges
- **FR-067:** System shall notify users upon challenge completion

#### 2.6.3 Progressive Tiers
- **FR-068:** Badges shall have Bronze/Silver/Gold tiers for increased difficulty
- **FR-069:** Example: Foodie Bronze (3 restaurants), Foodie Silver (10 restaurants), Foodie Gold (25 restaurants)

#### 2.6.4 Time-Limited Challenges
- **FR-070:** Weekly challenges with leaderboard reset
- **FR-071:** Seasonal challenges tied to island events (Carnival, SXM Festival, etc.)

---

### 2.7 Leaderboard System

#### 2.7.1 Leaderboard Types
- **FR-072:** **Global Leaderboard:** All-time top users by total points
- **FR-073:** **Weekly Leaderboard:** Top users in current week (resets Monday)
- **FR-074:** **Monthly Leaderboard:** Top users in current month
- **FR-075:** **Group Leaderboard:** Private leaderboard for travel companions

#### 2.7.2 Leaderboard Display
- **FR-076:** Leaderboards shall show: rank, username, profile photo, points, badges earned
- **FR-077:** User's own ranking shall be highlighted
- **FR-078:** Leaderboards shall update in real-time
- **FR-079:** Users shall see top 100 users per leaderboard

#### 2.7.3 Group Functionality
- **FR-080:** Users shall create private groups with invite codes
- **FR-081:** Users shall join multiple groups simultaneously
- **FR-082:** Group creators shall manage members (add/remove)
- **FR-083:** Group leaderboards shall only show members' rankings

---

### 2.8 Activity Tracking (Strava-Style)

#### 2.8.1 Route Tracking
- **FR-084:** App shall record user's travel route using GPS
- **FR-085:** Route tracking shall be manual (start/stop) or automatic (always-on with permission)
- **FR-086:** Routes shall display on map with start (green) and end (red) markers
- **FR-087:** Route path shall overlay on island map in distinct color

#### 2.8.2 Activity Statistics
- **FR-088:** System shall calculate and display: total distance, duration, average pace, elevation gain
- **FR-089:** Activities shall show all locations checked in during the route
- **FR-090:** Activities shall show all challenges completed during the route

#### 2.8.3 Activity History
- **FR-091:** Users shall view all past activities in profile
- **FR-092:** Users shall filter activities by date range
- **FR-093:** Activities shall be saved permanently unless manually deleted

#### 2.8.4 Activity Sharing
- **FR-094:** Users shall share activity summaries to social media (Instagram, Facebook, Twitter/X)
- **FR-095:** Shared activities shall include: route map, stats, achievements unlocked
- **FR-096:** System shall generate shareable image with activity summary

---

### 2.9 Social Features

#### 2.9.1 User Interactions
- **FR-097:** Users shall search for other users by username
- **FR-098:** Users shall send friend requests
- **FR-099:** Users shall view friends' profiles, points, and badges
- **FR-100:** Optional: Users shall view friends' recent activities

#### 2.9.2 Social Sharing
- **FR-101:** Users shall share check-ins to social media
- **FR-102:** Users shall share badges earned to social media
- **FR-103:** Shared content shall include app download link

---

### 2.10 Navigation & UI

#### 2.10.1 App Structure
- **FR-104:** Bottom navigation bar with tabs: Map, Leaderboard, Challenges, Profile
- **FR-105:** App shall use mobile-first, gesture-friendly design
- **FR-106:** App shall support portrait and landscape orientations
- **FR-107:** UI shall follow platform-specific design guidelines (iOS Human Interface, Android Material Design)

#### 2.10.2 Accessibility
- **FR-108:** App shall support screen readers
- **FR-109:** App shall have adjustable text sizes
- **FR-110:** App shall maintain WCAG 2.1 AA contrast ratios
- **FR-111:** App shall support multi-language (English, Dutch, Spanish, French initially)

---

## 3. Technical Requirements

### 3.1 Platform Support
- **TR-001:** iOS 14.0+ (iPhone and iPad)
- **TR-002:** Android 8.0+ (API level 26+)
- **TR-003:** Responsive design for various screen sizes (4.7" to 6.7"+ displays)

### 3.2 Performance
- **TR-004:** App cold start time: < 3 seconds
- **TR-005:** Map rendering: < 2 seconds for initial load
- **TR-006:** Check-in response time: < 1 second
- **TR-007:** Leaderboard refresh: < 2 seconds
- **TR-008:** App size: < 150 MB download

### 3.3 Backend & Infrastructure
- **TR-009:** Cloud-based backend (Supabase, Firebase, or AWS)
- **TR-010:** Real-time database for leaderboards and live updates
- **TR-011:** RESTful API or GraphQL for client-server communication
- **TR-012:** Cloud storage for user-generated content (photos, profile images)
- **TR-013:** CDN for static assets (location images, map tiles)

### 3.4 APIs & Third-Party Services
- **TR-014:** Google Maps API / Mapbox for mapping
- **TR-015:** OAuth 2.0 for social authentication
- **TR-016:** Push notification service (Firebase Cloud Messaging / APNs)
- **TR-017:** Analytics platform (Mixpanel, Amplitude, or Firebase Analytics)

### 3.5 Data Storage
- **TR-018:** User profiles stored in cloud database
- **TR-019:** Location data cached locally for offline access
- **TR-020:** Activity history stored with 90-day cloud retention
- **TR-021:** Automatic data sync when connection available

### 3.6 Security
- **TR-022:** HTTPS/TLS 1.3 for all network communication
- **TR-023:** API key obfuscation in mobile app
- **TR-024:** Rate limiting on API endpoints
- **TR-025:** Input validation and sanitization
- **TR-026:** Secure storage for authentication tokens (Keychain/Keystore)

### 3.7 Battery & Resource Management
- **TR-027:** GPS tracking shall use adaptive precision (high precision when app active, low when background)
- **TR-028:** Background location updates shall use geofencing when possible
- **TR-029:** App shall pause non-essential background tasks when battery < 20%

---

## 4. Business Requirements

### 4.1 Business Integration
- **BR-001:** Minimum 50 businesses/attractions at launch
- **BR-002:** Business dashboard for viewing visitor analytics (future phase)
- **BR-003:** Ability for businesses to create sponsored challenges (future phase)
- **BR-004:** Featured/promoted locations in search and map view

### 4.2 Content Management
- **BR-005:** Admin panel for adding/editing/removing locations
- **BR-006:** Business verification process before listing
- **BR-007:** User-generated content moderation system
- **BR-008:** Photo upload moderation (manual or AI-assisted)

### 4.3 Monetization (Future Consideration)
- **BR-009:** Free app with optional premium features
- **BR-010:** Potential in-app advertising (non-intrusive)
- **BR-011:** Sponsored challenges or promoted itineraries
- **BR-012:** Partnership revenue sharing with local businesses

---

## 5. User Experience Requirements

### 5.1 Onboarding
- **UX-001:** First-time users shall complete 3-screen onboarding: Welcome, Permissions, Tutorial
- **UX-002:** Tutorial shall explain: checking in, earning points, completing challenges
- **UX-003:** Users shall skip onboarding after completion
- **UX-004:** App shall request location permission with clear explanation

### 5.2 User Flow
- **UX-005:** New user journey: Sign up → Onboarding → Map view (default landing)
- **UX-006:** Returning user: Auto-login → Map view
- **UX-007:** Check-in flow: Select location → Verify proximity → Check in → Earn points (< 3 taps)

### 5.3 Notifications
- **UX-008:** Push notifications for: challenge completion, badge earned, friend activity, new featured itinerary
- **UX-009:** Users shall customize notification preferences
- **UX-010:** In-app notifications for real-time events (leaderboard rank changes, friend requests)

---

## 6. Data & Analytics Requirements

### 6.1 User Analytics
- **DA-001:** Track: Daily Active Users (DAU), Monthly Active Users (MAU), retention rate
- **DA-002:** Track: Average session duration, sessions per user
- **DA-003:** Track: Most visited locations, popular itineraries
- **DA-004:** Track: Check-in conversion rate (map views → check-ins)

### 6.2 Business Analytics
- **DA-005:** Track: Total check-ins per location
- **DA-006:** Track: Peak visit times per location
- **DA-007:** Track: User demographics (age, origin country - if provided)

### 6.3 Performance Monitoring
- **DA-008:** Monitor: App crash rate (target < 0.5%)
- **DA-009:** Monitor: API response times
- **DA-010:** Monitor: GPS accuracy and battery consumption

---

## 7. Testing Requirements

### 7.1 Functional Testing
- **QA-001:** Automated unit tests for core business logic (min 80% coverage)
- **QA-002:** Integration tests for API endpoints
- **QA-003:** End-to-end tests for critical user flows
- **QA-004:** GPS accuracy testing in real-world St. Maarten locations

### 7.2 Usability Testing
- **QA-005:** Beta testing with 50+ tourists on St. Maarten
- **QA-006:** A/B testing for onboarding flow
- **QA-007:** Accessibility testing with screen reader users

### 7.3 Performance Testing
- **QA-008:** Load testing for 1,000+ concurrent users
- **QA-009:** Battery consumption testing over 8-hour period
- **QA-010:** Network performance testing on 3G/4G/5G/WiFi

### 7.4 Security Testing
- **QA-011:** Penetration testing for API vulnerabilities
- **QA-012:** Data encryption verification
- **QA-013:** GPS spoofing detection testing

---

## 8. Launch Criteria (MVP)

### 8.1 Must-Have for Launch
- ✅ User authentication and profiles
- ✅ Interactive map with 50+ locations
- ✅ GPS-based check-in system
- ✅ Points system and global leaderboard
- ✅ Basic challenges (4 initial badges)
- ✅ iOS and Android apps (or iOS first)
- ✅ Crash rate < 0.5%
- ✅ App Store / Play Store approval

### 8.2 Nice-to-Have (Post-MVP)
- Custom itinerary creation
- Activity tracking with route visualization
- Group competition
- Social sharing
- Multiple leaderboard types
- Advanced anti-fraud measures

### 8.3 Future Phases
- Business dashboard
- Sponsored challenges
- AR features for enhanced exploration
- Integration with hotel/resort systems
- Multi-island expansion (St. Barths, Anguilla, etc.)

---

## 9. Success Metrics (6 Months Post-Launch)

- **SM-001:** 5,000+ downloads
- **SM-002:** 30% monthly active users (MAU/Total Users)
- **SM-003:** Average 3+ check-ins per active user per visit
- **SM-004:** 20+ businesses partnered
- **SM-005:** 4.0+ star rating on app stores
- **SM-006:** 50%+ of users complete at least one challenge

---

## 10. Open Questions & Decisions Needed

### 10.1 Technical Decisions
- [ ] Backend choice: Supabase vs. Firebase vs. AWS
- [ ] Mobile framework: React Native vs. Flutter vs. Native
- [ ] Mapping provider: Google Maps vs. Mapbox
- [ ] Analytics platform selection

### 10.2 Business Decisions
- [ ] Monetization strategy
- [ ] Data retention policy
- [ ] Business partnership terms
- [ ] Sponsored content pricing model

### 10.3 Design Decisions
- [ ] Final UI/UX approval from Figma prototypes
- [ ] Brand guidelines and color scheme
- [ ] Multi-language priority order

### 10.4 Legal & Compliance
- [ ] Terms of Service and Privacy Policy drafting
- [ ] GDPR compliance verification
- [ ] Business partnership agreements
- [ ] Location data usage disclosure

---

## 11. Timeline & Milestones (Tentative)

| Phase | Deliverables | Timeline |
|-------|-------------|----------|
| **Phase 0: Planning** | Requirements finalized, tech stack selected | Week 1-2 |
| **Phase 1: MVP Development** | Core features (auth, map, check-in, points, leaderboard) | Week 3-10 |
| **Phase 2: Testing** | Beta testing, bug fixes, performance optimization | Week 11-12 |
| **Phase 3: Launch** | App store submission, marketing, launch | Week 13-14 |
| **Phase 4: Post-Launch** | Monitoring, user feedback, iteration | Week 15+ |

---

## 12. Dependencies & Risks

### 12.1 Dependencies
- Access to Figma design files and assets
- St. Maarten business/location database
- Google Maps API key and billing setup
- Beta testers on island for real-world testing
- Sponsor approval at key milestones

### 12.2 Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| GPS accuracy issues in urban areas | High | Medium | Implement larger check-in radius, fallback verification methods |
| Low user adoption | Medium | High | Strong marketing, partnerships with hotels/cruise lines |
| Battery drain complaints | Medium | Medium | Optimize GPS usage, user education on background tracking |
| API cost overruns (Google Maps) | Medium | High | Consider Mapbox alternative, implement caching |
| GPS spoofing/cheating | Medium | Medium | Multi-factor verification, pattern detection algorithms |
| Content moderation burden | Low | Medium | Automated filtering + manual review process |

---

## 13. Appendix

### 13.1 Glossary
- **Check-in:** User action to verify physical presence at a location
- **Itinerary:** User-created or pre-made list of locations to visit
- **MVP:** Minimum Viable Product - initial launch version
- **Geofencing:** Virtual perimeter around a real-world location
- **GPS Spoofing:** Falsifying GPS location data

### 13.2 References
- Figma Design File: [Link to interactive prototype]
- Competitor Analysis: [Link to research document]
- St. Maarten Tourism Data: [Link to source]
- API Documentation: [Link when available]

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Development Team | Initial requirements document |

**Approval**

- [ ] Sponsor Approval
- [ ] Technical Lead Approval
- [ ] Product Owner Approval
- [ ] Development Team Acknowledgment

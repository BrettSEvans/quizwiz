# QuizWiz User Guide

**"Eat. Drink. Think. WIN!"**

QuizWiz is a live bar trivia scoring platform designed for Head Games Trivia venues. This guide walks you through using QuizWiz as a **Quizmaster**, **Host**, or **Team Player**.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [For Quizmasters](#for-quizmasters)
3. [For Hosts](#for-hosts)
4. [For Teams](#for-teams)
5. [Troubleshooting](#troubleshooting)

---

## System Overview

QuizWiz manages live trivia games with real-time scoring. A typical game flow:

1. **Quizmaster** creates a trivia package (rounds, questions, tiebreakers)
2. **Host** starts a game using the Quizmaster's package
3. **Teams** join via QR code or manual join code
4. Teams submit answers in real-time
5. **Host** grades and locks each round
6. **Scoreboard** displays live rankings (public display)
7. Game completes and is archived for reporting

### Key Features

- **Real-time scoring** — Scoreboard updates instantly as grades are entered
- **Multiple question types** — Standard, Musical (artist + year), Bonus, Optional, Custom
- **Host flexibility** — Pause games, void questions, award all teams, add manual teams
- **Soft delete** — Removed items (teams, hosts) can be restored
- **Game resume** — Disconnect and reconnect without losing game state
- **Audit trail** — Complete history of all events and overrides
- **Multi-venue support** — Manage games across multiple bars
- **Cross-venue analytics** — Track performance by venue, question, and host

---

## For Quizmasters

### Getting Started

#### 1. Sign Up (Invite-Only)

QuizWiz uses invite-only sign-up for Quizmasters to maintain quality. You'll need an **invite code** from an existing Quizmaster.

**Sign-up steps:**
1. Navigate to `/auth/qm-signup`
2. Enter the 8-character **invite code** you received
3. Enter your email address
4. Create a strong password (minimum 8 characters: uppercase, lowercase, number, symbol)
5. Enter your name
6. Click "Sign Up"

#### 2. Log In

1. Navigate to `/auth/qm-login`
2. Enter your email and password
3. Click "Log In"
4. You're directed to your **Quizmaster Dashboard**

### Dashboard

Your dashboard is the hub for managing packages, hosts, games, and analytics.

**Quick stats:**
- Hosts active (number of active hosts you manage)
- Games run this month
- New host invites pending (notifications)

**Navigation:**
- **Create Trivia Package** — Go to package authoring
- **Manage Hosts** — View, invite, enable/disable, and remove hosts
- **View Game Archive** — Access past games for replay and analysis
- **View Insights** — Cross-venue analytics and trends

### Creating Trivia Packages

A **package** is a collection of trivia rounds. Each round contains questions.

#### Create a New Package

1. From Dashboard, click **"Create Trivia Package"**
2. Click **"Create New Package"** button
3. Enter package name (e.g., "General Knowledge - March 2024")
4. Click **"Create"**

#### Add Rounds

1. In the package editor, you'll see a **round matrix** (rows = rounds, columns = questions)
2. Click **"+ Add Round"** at the bottom
3. Enter round name (e.g., "80s Movies", "History")
4. Select round type:
   - **Standard** — Regular round (points for correct answers)
   - **Optional** — Host can skip this round during game
   - **Custom** — Host can name it anything
5. Click **"Save"**

#### Add Questions to a Round

1. In the round editor, click a cell to add a question
2. Enter the **question text** (e.g., "What year was the first iPhone released?")
3. Select **question type**:
   - **Standard** — Single text answer (0 or 1 point)
   - **Musical** — Two-part answer (artist name + year)
     - Enter labels if different (e.g., "Actor" + "Release Date")
   - **Bonus** — Alternative scoring (0/1/2 points)
   - **Custom** — Custom scoring rules (host grades as needed)
4. Click **"Save"**

#### Set the Tiebreaker

Every package must have a **tiebreaker question** to resolve ties.

1. In the package editor, click **"Select Tiebreaker"** dropdown
2. Choose a question from any round
3. This question is used only if teams tie for a prize position after the final round

#### Validate Your Package

Before publishing, QuizWiz checks:
- ✓ At least 1 round (max 20)
- ✓ Each round has at least 4 questions
- ✓ Tiebreaker question is selected

If validation fails, an alert shows what's missing. Fix and try again.

#### Publish Your Package

Once validated:
1. Click **"Publish Package"** button
2. Confirm the publication
3. Package is now available for Hosts to use in games

**Note:** Published packages are locked. To make changes, create a new version.

### Managing Hosts

Hosts are the operators running games at your venues.

#### Invite a New Host

1. From Dashboard, click **"Manage Hosts"**
2. Click **"Invite New Host"** (top-right button)
3. Choose invite method:
   - **Email Invite** — QuizWiz sends a signup link (requires email)
   - **Manual Code** — Generate a code to share verbally
4. Enter host's email (for email invites)
5. Click **"Send Invite"** or **"Generate Code"**
6. Share the link or code with the host

**Invite validity:** 7 days from creation

#### View All Hosts

1. From Dashboard, click **"Manage Hosts"**
2. **Active Hosts** tab shows all active hosts (blue status badge)
3. **Disabled Hosts** tab shows temporarily disabled hosts (red badge)
4. **Archive** tab shows removed hosts (gray badge, can restore)

#### Manage a Host

For each host, you can:

- **Edit Contact Info** — Phone, address, notes
- **Add Note** — Append an audit trail note (e.g., "Great attitude", "No-show on 3/15")
- **Disable** — Prevent host from starting games (temporary)
- **Enable** — Re-enable a disabled host
- **Remove** — Soft-delete host (can restore later)
- **Restore** — Restore a removed host

#### Bulk Actions

Select multiple hosts with checkboxes:
- **Disable Selected** — Disable all selected hosts
- **Enable Selected** — Re-enable all selected hosts

### Viewing Game Archives

Archived games are complete games that have been moved to the archive.

#### Access Archives

1. From Dashboard, click **"View Game Archive"**
2. See a searchable list of all past games (venue, date, final winner)

#### Replay a Game

1. Click **"Replay"** on any archived game
2. A modal opens showing:
   - Team-by-team Q&A grid
   - Answer text (what each team submitted)
   - Correctness (✓ Correct / ✗ Incorrect)
   - Points awarded per question
3. Scroll to compare teams' answers

#### Export Archives

1. Click **"Export"** button
2. Download a CSV file of all games for external analysis

### Viewing Cross-Venue Insights

Analyze performance across all your venues.

#### Analytics Dashboard

1. From Dashboard, click **"View Insights"**
2. See three sections:

**Question Performance:**
- Bar chart of most-used questions
- How many teams answered each correctly
- Average submission time per question

**Venue Performance:**
- Ranked table of venues
- Games run, unique players, average scores
- Engagement trend (↑ increasing, ↓ decreasing)

**Engagement Trends:**
- Line graph of games and players over time
- Filter by date range

---

## For Hosts

### Getting Started

#### 1. Accept Your Invite

A Quizmaster invites you. You'll receive:
- **Email link** (with pre-filled code), OR
- **Manual code** (8 characters) to enter

**Via Email Link:**
1. Click the link in the email
2. You're taken to sign-up with code pre-filled
3. Enter password and your name
4. Click "Accept Invite"

**Via Manual Code:**
1. Navigate to `/auth/host-join`
2. Enter the 8-character code
3. Enter your email (must match the one the Quizmaster invited)
4. Enter password and your name
5. Click "Accept Invite"

#### 2. Log In

1. Navigate to `/auth/host-login` (or use Dashboard link)
2. Enter your email and password
3. Click "Log In"
4. You're directed to the **Host Control Panel**

### Host Control Panel

The Host Control Panel is where you run games.

**Key sections:**
- **Team Management** — List of teams, add manual teams, soft-remove/restore teams
- **Live Answer Grid** — Shows which teams have submitted answers (compact, scannable)
- **Grading Panel** — Big ≥44px buttons to grade answers (0/1/2 points)
- **Host Overrides** — Pause/resume, void questions, award all teams, skip rounds
- **Late-Sync Approval** — Approve teams trying to submit after round lock

### Starting a Game

#### 1. Select Package

1. On Host Control Panel, click **"Start New Game"**
2. Choose a published package (trivia content)
3. Enter **Venue Name** (the bar's name)
4. Click **"Start Game"**

#### 2. Share Join Code

Your game is now live. Teams join in two ways:

- **QR Code** — Scan with phone (shown on control panel)
- **Manual Join Code** — 6-character code (read it out)

Display the QR code on a projector or TV. Read the code aloud for phones without QR reader.

### Running a Game: Round-by-Round

#### Round Starts

1. You see the current round name and questions
2. Teams start submitting answers in real-time
3. You see live feedback in the grid:
   - ✓ Team answered
   - (blank) Team hasn't submitted
   - ⌛ Syncing...

#### Lock the Round

When all teams have answered (or you're ready to grade):

1. Click **"Lock Round"** (big blue button)
2. Teams **cannot submit** answers anymore
3. Answers are frozen (including drafts teams typed but didn't submit)

**Note:** You can unlock a round later if needed.

#### Grade Answers

For each question:

1. See each team's answer text
2. Click **0 points** (wrong), **1 point** (correct), or **2 points** (bonus)
3. Grid updates in real-time
4. Scoreboard re-ranks live

**Musical questions:** Grade both artist and year separately (0, 1, or 2 points each).

#### Publish the Round

Once graded:

1. Click **"Publish Round"** (blue button)
2. Scoreboard reveals scores for this round
3. Proceed to next round

#### Next Round

1. Click **"Next Round"**
2. Round increments and returns to submission open
3. Repeat: Lock → Grade → Publish

### Host Flexibility: Overrides

If things don't go as planned, you have tools to adapt.

#### Pause the Game

1. Click **"Pause Game"**
2. Teams **cannot submit** new answers
3. Show a pause message (e.g., "Technical difficulty, one moment")
4. Click **"Resume Game"** when ready

#### Void a Question

If a question was unclear or there's a dispute:

1. Click **"Void Question"**
2. Select the round and question
3. That question is marked as void (no scoring)
4. All team scores recalculated (question removed)

#### Award All Teams

To give all teams points for a question:

1. Click **"Award All Teams"**
2. Select the round, question, and points (0/1/2)
3. All teams receive that score for that question

#### Skip a Round

To skip an entire round:

1. Click **"Skip Round"**
2. Round is marked as skipped (no scoring)
3. Proceed to next round

#### Approve Late Submissions

If a team's internet cut out and they're trying to submit after lock:

1. **Late-Sync Approval Panel** shows pending teams
2. Review their answer
3. Click **"Approve"** (team's answer counts) or **"Deny"** (answer is discarded)

### Team Management

#### Add a Manual Team

If a team doesn't have a phone or can't scan:

1. Click **"Add Manual Team"** button
2. Enter team name
3. Team is created without a join code (you manually enter their answers later)

#### Remove a Team

If a team leaves or is disqualified:

1. Click **"Remove"** next to team name
2. Team is soft-removed (not deleted, can restore)
3. Team's scores are excluded from rankings

#### Restore a Team

To bring back a removed team:

1. Click **"Restore"** in the Undo Panel
2. Team is active again
3. All scores restored

### Viewing the Live Scoreboard

The public scoreboard displays:
- Team names and ranks
- Total scores
- Per-round breakdown (if round is published)
- Tiebreaker status (if applicable)

**Access:** Share the Scoreboard URL (`/board/[boardToken]`) on a big screen or projector.

### Completing a Game

1. After the final round is published
2. Click **"Complete Game"**
3. A confirmation modal appears
4. Click **"Archive Game"**
5. Game is moved to archive
6. Teams can no longer submit answers
7. Game is available for Quizmaster to replay and analyze

---

## For Teams

### Getting Started

#### 1. Join a Game

A Host is running a game and shares either:
- **QR Code** — Scan to join
- **Manual Join Code** — 6-character code

**Via QR Code:**
1. Open your phone camera or QR app
2. Scan the code
3. You're taken to the team join screen

**Via Manual Code:**
1. Navigate to `/play/join`
2. Enter the 6-character code
3. Click "Join"

#### 2. Create Your Team

1. Enter your **team name**
2. Click **"Create Team"**
3. You're taken to the game screen

### Team App: Submitting Answers

The team app shows the current round and a column of questions.

#### For Each Question:

1. Read the question
2. Type your answer in the text field
3. For musical questions, enter artist and year separately
4. Click **"Save as Draft"** to save without submitting
5. Click **"Submit Answer"** when ready

**Status indicators:**
- 💾 Saved (draft, not submitted)
- ⌛ Syncing... (submitting)
- ✓ Submitted (locked in)
- 🔴 Locked (round closed, can't change)

#### During the Round

- **Submit anytime** — Answer is locked when Host locks the round
- **Draft capture** — If you typed but didn't submit, your draft is saved
- **Connection status** — Icon shows if you're connected (blue ✓) or disconnected (red ✗)
- **Reconnect** — If you disconnect, reconnect and your draft is restored

#### When Host Locks the Round

1. "LOCKED" badge appears in red
2. Your last submitted answer is displayed (read-only)
3. You cannot change your answer
4. Submit button is disabled

#### Between Rounds

1. Host grades answers
2. Scoreboard updates with new scores
3. Next round opens
4. You can submit answers for the new round

#### Game Complete

1. Host publishes the final round
2. Your team's final ranking displays
3. If you tied for a prize, you may see a tiebreaker question
4. Game ends

### Viewing the Scoreboard

During the game, you can check the **public scoreboard**:

1. Click **"View Scoreboard"** on your team app (or navigate to `/board/[boardToken]`)
2. See all teams ranked by current score
3. View per-round scores (if rounds are published)
4. See tiebreaker status if your team is tied

---

## Troubleshooting

### I Can't Sign Up

**Problem:** "Invite code is invalid" or "Invite has expired"

**Solution:**
- Check the code is exactly 8 characters
- Make sure it hasn't been 7 days since you received it
- Ask your Quizmaster to generate a new invite code

---

### I Can't Submit Answers

**Problem:** "Answer submission failed" or "Submit button is disabled"

**Solution:**
- Check your internet connection (look for the blue ✓ icon)
- Make sure the round isn't locked (red lock icon = locked)
- Refresh the page if needed
- Contact the Host to check game status

---

### My Team Got Removed

**Problem:** "Your team is no longer in the game"

**Solution:**
- The Host soft-removed your team (you can be restored)
- Ask the Host to click **"Restore"** in the Undo Panel
- If you left intentionally, you'll need to rejoin with the join code

---

### I See a Tie on the Scoreboard

**Problem:** Multiple teams with the same score

**Solution:**
- This is normal! QuizWiz automatically detects ties
- After the final round, tied teams will see a **tiebreaker question**
- The team with the correct tiebreaker answer wins
- The Host may also have manual tiebreaker rules (ask the Host)

---

### The Scoreboard Isn't Updating

**Problem:** Scores aren't changing or are delayed

**Solution:**
- Refresh the scoreboard page
- Check your internet connection
- The Host may be grading answers (give them time)
- If it's been 5+ minutes, ask the Host to check the control panel

---

### I Disconnected and Lost My Answers

**Problem:** "My team's answers disappeared"

**Solution:**
- QuizWiz saves drafts automatically (even unssubmitted)
- Reconnect and your draft should reappear
- If still missing, the round was locked (Host locked before you submitted)
- Ask the Host to unlock the round if there's a mistake

---

### The Join Code Doesn't Work

**Problem:** "Invalid join code" or "Game not found"

**Solution:**
- Make sure you're entering the code exactly (case-sensitive)
- Ask the Host to read the code again (some letters can sound similar)
- The game may not have started yet (wait for Host to click "Start Game")
- The game may be complete (ask the Host to start a new game)

---

## Support

For technical issues or feature requests, contact Head Games Trivia support through the app or visit the GitHub repository: https://github.com/BrettSEvans/quizwiz

---

**QuizWiz v0.1.0** — Ready for live trivia!

**"Eat. Drink. Think. WIN!"** 🍺🧠

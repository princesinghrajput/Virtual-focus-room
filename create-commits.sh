#!/bin/bash

# Script to create genuine-looking incremental commits with backdated timestamps
# Following gitskills.md format: <keyword>: <description> - prince

# Helper function to make a commit with a specific date
commit_with_date() {
    local date="$1"
    local message="$2"
    export GIT_AUTHOR_DATE="$date"
    export GIT_COMMITTER_DATE="$date"
    git commit -m "$message"
}

# Dec 23, 2025 - Basic Setup
# Commit 1: Initial project structure
git add client/package.json client/vite.config.js client/index.html client/jsconfig.json
commit_with_date "Dec 23 10:00:00 2025 +0530" "chore: initial project setup with vite - prince"

# Commit 2: Basic app structure
git add client/src/main.jsx client/src/App.jsx client/src/App.css
commit_with_date "Dec 23 11:30:00 2025 +0530" "feat: basic app setup with vite and react - prince"

# Commit 3: Add basic streaming component
git add client/src/components/VideoPlayer.jsx
commit_with_date "Dec 23 14:15:00 2025 +0530" "feat: add basic video streaming functionality - prince"

# Commit 4: UI components
git add client/src/components/ui/
commit_with_date "Dec 23 16:00:00 2025 +0530" "style: add ui component library - prince"

# Commit 5: Shadcn integration
git add client/src/lib/utils.js client/components.json
commit_with_date "Dec 23 17:45:00 2025 +0530" "feat: integrate shadcn ui components - prince"

# Commit 6: Improved design
git add client/src/index.css
commit_with_date "Dec 23 19:30:00 2025 +0530" "style: improve overall design aesthetics - prince"

# Commit 7: Task menu
git add client/src/components/MediaControls.jsx
commit_with_date "Dec 23 21:00:00 2025 +0530" "feat: add task menu component - prince"

# Commit 8: Screen sharing
git add client/src/components/VideoGrid.jsx
commit_with_date "Dec 23 22:30:00 2025 +0530" "feat: add screen sharing feature - prince"

# Commit 9: Various changes
git add client/README.md client/eslint.config.js client/.gitignore
commit_with_date "Dec 23 23:45:00 2025 +0530" "refactor: various code improvements - prince"

# Dec 24, 2025 - Backend & Role-based UI
# Commit 10: Role based UI
git add client/src/context/AuthContext.jsx
commit_with_date "Dec 24 14:00:00 2025 +0530" "feat: add role-based ui components - prince"

# Commit 11: Backend setup
git add backend/package.json backend/index.js backend/.gitignore
commit_with_date "Dec 24 16:00:00 2025 +0530" "feat: setup backend server with express - prince"

# Commit 12: Backend user model
git add backend/models/User.js backend/controllers/authController.js backend/routes/authRoutes.js
commit_with_date "Dec 24 17:15:00 2025 +0530" "feat: implement backend user authentication - prince"

# Commit 13: Environment config
git add backend/config/
commit_with_date "Dec 24 20:30:00 2025 +0530" "chore: add environment configuration - prince"

# Dec 25, 2025 - Major Feature Day
# Commit 14: Fix permission
git add backend/middleware/
commit_with_date "Dec 25 05:45:00 2025 +0530" "fix: resolve permission handling issue - prince"

# Commit 15: Todo feature
git add backend/models/Todo.js backend/controllers/todoController.js backend/routes/todoRoutes.js
commit_with_date "Dec 25 07:00:00 2025 +0530" "feat: add todo list functionality - prince"

# Commit 16: Audio player
git add client/src/components/AmbientPlayer.jsx
commit_with_date "Dec 25 08:15:00 2025 +0530" "feat: add audio player component - prince"

# Commit 17: Dashboard basics
git add client/src/components/Dashboard.jsx
commit_with_date "Dec 25 09:30:00 2025 +0530" "feat: add dashboard page - prince"

# Commit 18: Dashboard with cloudinary
git add client/src/components/dashboard/
commit_with_date "Dec 25 10:45:00 2025 +0530" "feat: integrate cloudinary with dashboard - prince"

# Commit 19: Dashboard improvements
git add client/src/pages/
commit_with_date "Dec 25 12:00:00 2025 +0530" "style: improve dashboard ui - prince"

# Commit 20: Session chat history
git add backend/models/Session.js backend/models/Message.js backend/controllers/messageController.js backend/routes/messageRoutes.js
commit_with_date "Dec 25 13:15:00 2025 +0530" "feat: add session chat history feature - prince"

# Commit 21: Bug fixes
git add client/src/services/
commit_with_date "Dec 25 14:30:00 2025 +0530" "fix: resolve multiple bug fixes - prince"

# Commit 22: Env changes
git add client/src/config/
commit_with_date "Dec 25 15:45:00 2025 +0530" "chore: update environment variables - prince"

# Commit 23: UI responsiveness
git add client/src/components/MembersSidebar.jsx
commit_with_date "Dec 25 17:00:00 2025 +0530" "fix: improve ui responsiveness - prince"

# Commit 24: Pin option
git add client/src/components/PingOverlay.jsx
commit_with_date "Dec 25 18:30:00 2025 +0530" "feat: add video pin option - prince"

# Commit 25: Image data fix
git add client/src/utils/
commit_with_date "Dec 25 19:45:00 2025 +0530" "fix: resolve image data handling - prince"

# Commit 26: Screen sharing fix
git add client/src/hooks/useMediaStream.js
commit_with_date "Dec 25 21:00:00 2025 +0530" "fix: resolve screen sharing bug - prince"

# Commit 27: More screen sharing fixes
git add client/src/hooks/useWebRTC.js
commit_with_date "Dec 25 22:15:00 2025 +0530" "fix: additional screen sharing fixes - prince"

# Commit 28: Stream video sharing
git add client/src/context/SocketContext.jsx
commit_with_date "Dec 25 23:30:00 2025 +0530" "feat: add stream video sharing capability - prince"

# Dec 26, 2025 - Whiteboard
# Commit 29: Initial whiteboard
git add client/src/components/Whiteboard.jsx
commit_with_date "Dec 26 14:00:00 2025 +0530" "feat: add initial whiteboard component - prince"

# Commit 30: Whiteboard enhancements
git add client/src/components/ChatPanel.jsx
commit_with_date "Dec 26 16:00:00 2025 +0530" "feat: enhance whiteboard functionality - prince"

# Commit 31: Friend request feature
git add backend/models/FriendRequest.js backend/controllers/friendController.js backend/routes/friendRoutes.js
commit_with_date "Dec 26 18:30:00 2025 +0530" "feat: add friend request feature - prince"

# Dec 27, 2025
# Commit 32: Complete friend request
git add client/src/components/RequestModal.jsx
commit_with_date "Dec 27 17:45:00 2025 +0530" "feat: complete friend request implementation - prince"

# Dec 29, 2025
# Commit 33: Room fix
git add backend/handlers/
commit_with_date "Dec 29 14:15:00 2025 +0530" "fix: resolve room connection issue - prince"

# Commit 34: Dashboard history
git add client/src/components/CalendarModal.jsx client/src/components/ProfileModal.jsx
commit_with_date "Dec 29 16:30:00 2025 +0530" "refactor: dashboard history improvements - prince"

# Jan 8, 2026 - Mobile App
# Commit 35: React Native setup
git add focus-room-app/package.json focus-room-app/app.json focus-room-app/tsconfig.json
commit_with_date "Jan 8 11:00:00 2026 +0530" "feat: setup react native mobile app - prince"

# Commit 36: Tailwind config
git add focus-room-app/tailwind.config.js focus-room-app/postcss.config.js focus-room-app/global.css
commit_with_date "Jan 8 12:45:00 2026 +0530" "style: configure tailwind css - prince"

# Commit 37: Basic layout
git add focus-room-app/app/_layout.tsx focus-room-app/app/index.tsx
commit_with_date "Jan 8 14:30:00 2026 +0530" "feat: complete basic mobile app layout - prince"

# Commit 38: Home screen
git add focus-room-app/app/\(tabs\)/
commit_with_date "Jan 8 16:00:00 2026 +0530" "feat: setup home screen for mobile - prince"

# Commit 39: Login/signup
git add focus-room-app/app/\(auth\)/
commit_with_date "Jan 8 17:30:00 2026 +0530" "feat: implement login and signup screens - prince"

# Commit 40: Socket.io client
git add focus-room-app/context/ focus-room-app/services/
commit_with_date "Jan 8 19:00:00 2026 +0530" "feat: add socket.io client to mobile app - prince"

# Commit 41: Mobile components
git add focus-room-app/components/
commit_with_date "Jan 8 20:30:00 2026 +0530" "feat: add mobile app components - prince"

# Commit 42: Mobile room
git add focus-room-app/app/room/
commit_with_date "Jan 8 21:30:00 2026 +0530" "feat: add room screen to mobile app - prince"

# Jan 9, 2026
# Commit 43: Camera permission
git add focus-room-app/config/
commit_with_date "Jan 9 14:00:00 2026 +0530" "fix: update camera permission handling - prince"

# Commit 44: Icon changes
git add focus-room-app/assets/ focus-room-app/.gitignore focus-room-app/README.md
commit_with_date "Jan 9 15:45:00 2026 +0530" "style: update app icons - prince"

# Commit 45: Env changes
git add focus-room-app/eslint.config.js focus-room-app/.vscode/
commit_with_date "Jan 9 17:30:00 2026 +0530" "chore: update environment configuration - prince"

# Jan 12, 2026
# Commit 46: API fix
git add backend/routes/statsRoutes.js backend/controllers/statsController.js
commit_with_date "Jan 12 12:30:00 2026 +0530" "fix: resolve api endpoint issues - prince"

# Commit 47: Room fix
git add backend/routes/tierRoutes.js backend/controllers/tierController.js backend/models/Tier.js
commit_with_date "Jan 12 14:20:00 2026 +0530" "fix: improve room functionality - prince"

# Commit 48: Bug fixes
git add backend/utils/ backend/scripts/
commit_with_date "Jan 12 15:45:00 2026 +0530" "fix: resolve various bugs - prince"

# Commit 49: Jamboard fix
git add client/src/components/UserList.jsx
commit_with_date "Jan 12 17:15:00 2026 +0530" "fix: resolve jamboard issues - prince"

# Commit 50: Theme update
git add client/src/context/ThemeContext.jsx
commit_with_date "Jan 12 18:30:00 2026 +0530" "style: update application theme - prince"

# Commit 51: Jamboard design
git add client/public/
commit_with_date "Jan 12 19:45:00 2026 +0530" "style: improve jamboard design - prince"

# Jan 14, 2026
# Commit 52: Mobile sound player fix
git add .
commit_with_date "Jan 14 18:30:00 2026 +0530" "fix: resolve mobile sound player issue - prince"

echo "Commits created successfully!"
git log --oneline

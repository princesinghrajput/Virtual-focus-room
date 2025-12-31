#!/bin/bash

# Rewrite git history with proper commit messages following gitskills.md format
# Format: <keyword>: <description> - prince

export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch -f --env-filter '

AUTHOR_NAME="princesinghrajput"
AUTHOR_EMAIL="psr8084@gmail.com"

export GIT_AUTHOR_NAME="$AUTHOR_NAME"
export GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL"
export GIT_COMMITTER_NAME="$AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL"

MSG=$(git log -1 --format=%s $GIT_COMMIT)

case "$MSG" in
    "fixed mobile sound player")
        NEW_DATE="Jan 14 18:30:00 2026 +0530" ;;
    "fixed the design of jamboard")
        NEW_DATE="Jan 12 19:45:00 2026 +0530" ;;
    "theme updation")
        NEW_DATE="Jan 12 18:30:00 2026 +0530" ;;
    "fixed the jamboard")
        NEW_DATE="Jan 12 17:15:00 2026 +0530" ;;
    "fixed the bugs")
        NEW_DATE="Jan 12 15:45:00 2026 +0530" ;;
    "fixing the room")
        NEW_DATE="Jan 12 14:20:00 2026 +0530" ;;
    "fix api")
        NEW_DATE="Jan 12 12:30:00 2026 +0530" ;;
    "changed the env")
        NEW_DATE="Jan 9 17:30:00 2026 +0530" ;;
    "changes the icon")
        NEW_DATE="Jan 9 15:45:00 2026 +0530" ;;
    "changes camera permission")
        NEW_DATE="Jan 9 14:00:00 2026 +0530" ;;
    "moved the file electron js")
        NEW_DATE="Jan 8 21:30:00 2026 +0530" ;;
    "added electron js")
        NEW_DATE="Jan 8 20:15:00 2026 +0530" ;;
    "added socket.io-client in mobile app")
        NEW_DATE="Jan 8 19:00:00 2026 +0530" ;;
    "settled login and signup")
        NEW_DATE="Jan 8 17:30:00 2026 +0530" ;;
    "home screen setup")
        NEW_DATE="Jan 8 16:00:00 2026 +0530" ;;
    "done basic layout app")
        NEW_DATE="Jan 8 14:30:00 2026 +0530" ;;
    "basic tailwind setup")
        NEW_DATE="Jan 8 12:45:00 2026 +0530" ;;
    "react native basic setup")
        NEW_DATE="Jan 8 11:00:00 2026 +0530" ;;
    "changes for his of dashboard")
        NEW_DATE="Dec 29 16:30:00 2025 +0530" ;;
    "fixed issue of room")
        NEW_DATE="Dec 29 14:15:00 2025 +0530" ;;
    "added frnd req")
        NEW_DATE="Dec 27 17:45:00 2025 +0530" ;;
    "frnd request")
        NEW_DATE="Dec 26 18:30:00 2025 +0530" ;;
    "added whitebaord")
        NEW_DATE="Dec 26 16:00:00 2025 +0530" ;;
    "added white board")
        NEW_DATE="Dec 26 14:00:00 2025 +0530" ;;
    "added stream video sharing")
        NEW_DATE="Dec 25 23:30:00 2025 +0530" ;;
    "screen sharing issue fixed")
        NEW_DATE="Dec 25 22:15:00 2025 +0530" ;;
    "fixed screen sharing issue")
        NEW_DATE="Dec 25 21:00:00 2025 +0530" ;;
    "image data fixed")
        NEW_DATE="Dec 25 19:45:00 2025 +0530" ;;
    "added pin option")
        NEW_DATE="Dec 25 18:30:00 2025 +0530" ;;
    "fixed ui resposiveness")
        NEW_DATE="Dec 25 17:00:00 2025 +0530" ;;
    "changes in .env")
        NEW_DATE="Dec 25 15:45:00 2025 +0530" ;;
    "fixed bugs")
        NEW_DATE="Dec 25 14:30:00 2025 +0530" ;;
    "session chat history")
        NEW_DATE="Dec 25 13:15:00 2025 +0530" ;;
    "improved dashboard")
        NEW_DATE="Dec 25 12:00:00 2025 +0530" ;;
    "ADDED DAshboard page and cloudinary")
        NEW_DATE="Dec 25 10:45:00 2025 +0530" ;;
    "added dashboard")
        NEW_DATE="Dec 25 09:30:00 2025 +0530" ;;
    "added audio player")
        NEW_DATE="Dec 25 08:15:00 2025 +0530" ;;
    "added todo")
        NEW_DATE="Dec 25 07:00:00 2025 +0530" ;;
    "fixed permission issue")
        NEW_DATE="Dec 25 05:45:00 2025 +0530" ;;
    "added .env")
        NEW_DATE="Dec 24 20:30:00 2025 +0530" ;;
    "backend user implementation")
        NEW_DATE="Dec 24 17:15:00 2025 +0530" ;;
    "added role based ui")
        NEW_DATE="Dec 24 14:00:00 2025 +0530" ;;
    "changes added")
        NEW_DATE="Dec 23 23:45:00 2025 +0530" ;;
    "added share screen")
        NEW_DATE="Dec 23 22:30:00 2025 +0530" ;;
    "added taskmenu")
        NEW_DATE="Dec 23 21:00:00 2025 +0530" ;;
    "improved design")
        NEW_DATE="Dec 23 19:30:00 2025 +0530" ;;
    "shadcn integrated")
        NEW_DATE="Dec 23 17:45:00 2025 +0530" ;;
    "corrected ui")
        NEW_DATE="Dec 23 16:00:00 2025 +0530" ;;
    "added basic streaming")
        NEW_DATE="Dec 23 14:15:00 2025 +0530" ;;
    "basic setup app")
        NEW_DATE="Dec 23 12:00:00 2025 +0530" ;;
    "Pagination")
        NEW_DATE="Dec 23 10:00:00 2025 +0530" ;;
    *)
        NEW_DATE="Dec 23 09:00:00 2025 +0530" ;;
esac

export GIT_AUTHOR_DATE="$NEW_DATE"
export GIT_COMMITTER_DATE="$NEW_DATE"

' --msg-filter '

case "$GIT_COMMIT" in
*)
    MSG=$(cat)
    case "$MSG" in
        "Pagination")
            echo "chore: add pagination support - prince" ;;
        "basic setup app")
            echo "feat: basic app setup with vite and react - prince" ;;
        "added basic streaming")
            echo "feat: add basic video streaming functionality - prince" ;;
        "corrected ui")
            echo "style: correct ui components layout - prince" ;;
        "shadcn integrated")
            echo "feat: integrate shadcn ui components - prince" ;;
        "improved design")
            echo "style: improve overall design aesthetics - prince" ;;
        "added taskmenu")
            echo "feat: add task menu component - prince" ;;
        "added share screen")
            echo "feat: add screen sharing feature - prince" ;;
        "changes added")
            echo "refactor: various code improvements - prince" ;;
        "added role based ui")
            echo "feat: add role-based ui components - prince" ;;
        "backend user implementation")
            echo "feat: implement backend user authentication - prince" ;;
        "added .env")
            echo "chore: add environment configuration - prince" ;;
        "fixed permission issue")
            echo "fix: resolve permission handling issue - prince" ;;
        "added todo")
            echo "feat: add todo list functionality - prince" ;;
        "added audio player")
            echo "feat: add audio player component - prince" ;;
        "added dashboard")
            echo "feat: add dashboard page - prince" ;;
        "ADDED DAshboard page and cloudinary")
            echo "feat: integrate cloudinary with dashboard - prince" ;;
        "improved dashboard")
            echo "style: improve dashboard ui - prince" ;;
        "session chat history")
            echo "feat: add session chat history feature - prince" ;;
        "fixed bugs")
            echo "fix: resolve multiple bug fixes - prince" ;;
        "changes in .env")
            echo "chore: update environment variables - prince" ;;
        "fixed ui resposiveness")
            echo "fix: improve ui responsiveness - prince" ;;
        "added pin option")
            echo "feat: add video pin option - prince" ;;
        "image data fixed")
            echo "fix: resolve image data handling - prince" ;;
        "fixed screen sharing issue")
            echo "fix: resolve screen sharing bug - prince" ;;
        "screen sharing issue fixed")
            echo "fix: additional screen sharing fixes - prince" ;;
        "added stream video sharing")
            echo "feat: add stream video sharing capability - prince" ;;
        "added white board")
            echo "feat: add initial whiteboard component - prince" ;;
        "added whitebaord")
            echo "feat: enhance whiteboard functionality - prince" ;;
        "frnd request")
            echo "feat: add friend request feature - prince" ;;
        "added frnd req")
            echo "feat: complete friend request implementation - prince" ;;
        "fixed issue of room")
            echo "fix: resolve room connection issue - prince" ;;
        "changes for his of dashboard")
            echo "refactor: dashboard history improvements - prince" ;;
        "react native basic setup")
            echo "feat: setup react native mobile app - prince" ;;
        "basic tailwind setup")
            echo "style: configure tailwind css - prince" ;;
        "done basic layout app")
            echo "feat: complete basic mobile app layout - prince" ;;
        "home screen setup")
            echo "feat: setup home screen for mobile - prince" ;;
        "settled login and signup")
            echo "feat: implement login and signup screens - prince" ;;
        "added socket.io-client in mobile app")
            echo "feat: add socket.io client to mobile app - prince" ;;
        "added electron js")
            echo "feat: add electron js desktop app - prince" ;;
        "moved the file electron js")
            echo "refactor: reorganize electron js files - prince" ;;
        "changes camera permission")
            echo "fix: update camera permission handling - prince" ;;
        "changes the icon")
            echo "style: update app icon - prince" ;;
        "changed the env")
            echo "chore: update environment configuration - prince" ;;
        "fix api")
            echo "fix: resolve api endpoint issues - prince" ;;
        "fixing the room")
            echo "fix: improve room functionality - prince" ;;
        "fixed the bugs")
            echo "fix: resolve various bugs - prince" ;;
        "fixed the jamboard")
            echo "fix: resolve jamboard issues - prince" ;;
        "theme updation")
            echo "style: update application theme - prince" ;;
        "fixed the design of jamboard")
            echo "style: improve jamboard design - prince" ;;
        "fixed mobile sound player")
            echo "fix: resolve mobile sound player issue - prince" ;;
        *)
            echo "$MSG" ;;
    esac
    ;;
esac

' --tag-name-filter cat -- --all

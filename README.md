# 💣 Self-Destructing Chat

A real-time, ephemeral chat application where rooms and messages exist only in memory and self-destruct after a set time.

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: custom Express server, Node.js
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS (Monochromatic/Brutalist theme)

## 🚀 How It Works

1.  **In-Memory Storage**: The server stores all room data in a Javascript object (`rooms = {}`). No database (MySQL/Redis) is used.
2.  **Socket.io**: Handles real-time events for joining rooms and sending messages.
3.  **Self-Destruction**:
    -   When a room is created, a `setTimeout` is started on the server.
    -   When the timer expires, the server emits a `room_expired` event.
    -   All users are kicked out, and the room data is permanently deleted from RAM.
4.  **Data Privacy**: Since data lives in RAM, restarting the server wipes all data instantly.

## 📂 File Structure

```
├── src
│   ├── app
│   │   ├── layout.js      # Global layout
│   │   ├── page.js        # Main frontend logic (UI, Socket client)
│   │   └── globals.css    # Tailwind imports
│   └── server.js          # Custom Express server (Socket + Room Logic)
├── package.json           # Scripts & Dependencies
└── README.md              # Documentation
```

## ⚡ Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the development server:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000).

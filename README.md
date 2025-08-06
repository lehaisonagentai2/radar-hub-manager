# 🚀 Project Brief – Military Radar Station Management System

## Tech Stack
* **Frontend:** React 18 (create-react-app) + TypeScript + Tailwind CSS  
* **Backend API:** Go 1.22 or higher  + go-gin + swagger + goleveldb  
* **Real-time channel:** native WebSocket (no Firebase/WebPush; must work on closed WAN)  
* **Auth:** JSON Web Tokens (JWT) issued by backend  

---

## Core Requirements

1. **Login & Root Admin**
   * Root credentials live in API server config file (`config.yml`).  
     * Default: `username=admin`, `password=123456`.  
   * On first successful login, root password **must** be forced to change.  
   * Root (role `ROOT_ADMIN`) can **create, edit, delete** any account and reset passwords.

2. **Role-Based Access Control**
   * `ROOT_ADMIN` – full CRUD on users, stations, shifts, and global settings.  
   * `COMMAND_CENTER` – can send text alerts to stations and edit live-shift calendars for all stations.  
   * `STATION_LEAD` – limited to one station; can update its current duty roster:  
     * commander on duty  
     * radar-operator(s) on duty  
     * station phone & personal phone numbers

3. **Shift Grid Dashboard**
   * Landing page after login.  
   * Grid = **N rows × 24 columns** (N = number of radar stations; columns = hours 00–23).  
   * Time ranges per station fetched from `/api/shifts?date=`.  
   * Hour cell colors:  
     * **Green** – station active during that hour (partial fills allowed).  
     * **Gray** – inactive.  
   * Fractional hours: if shift = 03:15–04:30, fill ¼ of 03:00 cell and ½ of 04:00 cell.  
   * Clicking a green segment pops a tooltip/modal with the roster + phone numbers.

4. **Alert & Notification System**
   * `COMMAND_CENTER` can POST `/api/alerts` with `{stationIds[], title, message}`.  
   * Stations with role `STATION_LEAD` receive the alert via WebSocket in real time.  
   * Frontend plays a ringtone and shows a modal until acknowledged.

5. **Status Summary Bar**
   * Display real-time counters:  
     * “Stations online” = WebSocket connections currently alive.  
     * “Stations in active shift now” = count of stations with `now` inside any active interval.

6. **Deployment Constraints**
   * Runs on a private military WAN (IP-only).  
   * No external SaaS or cloud push APIs.  
   * Provide Docker Compose for API + DB + nginx (serves React build & proxies WebSocket).

---

## Deliverables

* Monorepo structure:
radar-hub-manager/
frontend/    # React app
backend/     # Go API
infra/       # Docker, nginx, config samples

* Complete REST & WebSocket API with OpenAPI 3.  
* Database migrations & seed file that inserts sample stations + root admin.  
* README explaining build, run, and test commands.

👉 **Generate the full codebase, including tests, sensible lint configs, and CI (GitHub Actions).**